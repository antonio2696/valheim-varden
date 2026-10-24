import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../../auth/auth.store';
import { valheimImages } from '../../data/valheim-images';
import { createUuidV4 } from '../../utils/uuid';
import { ConstructionItem, ConstructionList } from './construction-list.model';

interface ListsResponse {
    success: boolean;
    lists: ConstructionList[];
}

interface ListResponse {
    success: boolean;
    list: ConstructionList;
}

const legacyStorageKey = 'varden.construction-lists.v1';

@Injectable({ providedIn: 'root' })
export class ConstructionListStore {
    private readonly http = inject(HttpClient);
    private readonly auth = inject(AuthStore);
    readonly lists = signal<ConstructionList[]>([]);
    readonly error = signal<string | null>(null);
    readonly isLoading = signal(false);
    readonly legacyListsAvailable = signal(false);
    private activeRequests = 0;

    async loadLists(): Promise<void> {
        this.error.set(null);
        await this.trackRequest(async () => {
            try {
                const response = await firstValueFrom(
                    this.http.get<ListsResponse>('/api/lists', { withCredentials: true })
                );
                this.lists.set(
                    response.lists.map((list) => ({
                        ...list,
                        decomposeMaterials: list.decomposeMaterials ?? true
                    }))
                );
                const hasPrivateLists = response.lists.some((list) => !list.isShared);
                if (hasPrivateLists) {
                    this.markLegacyImportComplete();
                }
                this.legacyListsAvailable.set(
                    !hasPrivateLists &&
                        !this.isLegacyImportComplete() &&
                        this.readLegacyLists().length > 0
                );
            } catch (error) {
                this.reportError(error, 'Não foi possível carregar as listas.');
            }
        });
    }

    async importLegacyLists(): Promise<void> {
        const legacyLists = this.readLegacyLists();
        if (!legacyLists.length) {
            this.legacyListsAvailable.set(false);
            return;
        }

        for (const list of legacyLists) {
            if (this.findById(list.id)) {
                continue;
            }

            const response = await this.request<ListResponse>(
                () =>
                    firstValueFrom(
                        this.http.post<ListResponse>(
                            '/api/lists',
                            { list, shared: false },
                            { withCredentials: true }
                        )
                    ),
                `Não foi possível importar a lista "${list.title}".`
            );
            if (!response) {
                return;
            }
            this.upsert(response.list);
        }

        this.legacyListsAvailable.set(false);
        this.markLegacyImportComplete();
    }

    findById(id: string | null): ConstructionList | undefined {
        return this.lists().find((list) => list.id === id);
    }

    async addList(details: {
        title: string;
        region: string;
        description: string;
        imageId: string;
        isShared?: boolean;
    }): Promise<ConstructionList | undefined> {
        const selectedImage = valheimImages.find((image) => image.id === details.imageId);
        if (!selectedImage) {
            throw new TypeError(`Unknown Valheim image: ${details.imageId}`);
        }

        const list: ConstructionList = {
            id: createUuidV4(),
            title: details.title.trim(),
            region: details.region,
            description: details.description || 'Um novo projeto de construção.',
            completedUnits: 0,
            totalUnits: 0,
            buildings: 0,
            progress: 0,
            updatedAt: new Date().toISOString(),
            imageUrl: selectedImage.url,
            imageThumbnailUrl: selectedImage.thumbnailUrl,
            imageAlt: selectedImage.alt,
            priority: false,
            status: 'planning',
            updatedOrder: this.nextUpdatedOrder(),
            constructionItems: [],
            ownerUserId: 0,
            isShared: details.isShared ?? false,
            allowEditing: false,
            decomposeMaterials: true
        };

        const response = await this.request<ListResponse>(
            () =>
                firstValueFrom(
                    this.http.post<ListResponse>(
                        '/api/lists',
                        { list, shared: list.isShared },
                        { withCredentials: true }
                    )
                ),
            'Não foi possível criar a lista.'
        );
        if (!response) {
            return undefined;
        }

        this.upsert(response.list);
        return response.list;
    }

    async renameList(listId: string, title: string): Promise<boolean> {
        const normalizedTitle = title.trim();
        const list = this.findById(listId);
        if (!normalizedTitle || normalizedTitle.length > 100 || !list) {
            return false;
        }
        if (list.title === normalizedTitle) {
            return true;
        }

        return this.save({
            ...list,
            title: normalizedTitle,
            updatedAt: new Date().toISOString(),
            updatedOrder: this.nextUpdatedOrder()
        });
    }

    async deleteList(listId: string): Promise<boolean> {
        if (!this.findById(listId)) {
            return false;
        }

        const succeeded = await this.request(
            () =>
                firstValueFrom(
                    this.http.delete<{ success: boolean }>(
                        `/api/lists/${encodeURIComponent(listId)}`,
                        {
                            withCredentials: true
                        }
                    )
                ),
            'Não foi possível excluir a lista.'
        );
        if (!succeeded) {
            return false;
        }

        this.lists.update((lists) => lists.filter((list) => list.id !== listId));
        return true;
    }

    async updateItem(
        listId: string,
        itemId: string,
        update: (item: ConstructionItem) => ConstructionItem
    ): Promise<void> {
        const list = this.findById(listId);
        if (!list) {
            return;
        }

        const updated = this.withUpdatedItems(
            list,
            list.constructionItems.map((item) => (item.id === itemId ? update(item) : item))
        );
        await this.save(updated);
    }

    async addConstruction(
        listId: string,
        item: Omit<ConstructionItem, 'quantity' | 'completed'>
    ): Promise<void> {
        const list = this.findById(listId);
        if (!list) {
            return;
        }

        const existing = list.constructionItems.find((construction) => construction.id === item.id);
        const constructionItems = existing
            ? list.constructionItems.map((construction) =>
                  construction.id === item.id
                      ? { ...construction, quantity: construction.quantity + 1 }
                      : construction
              )
            : [...list.constructionItems, { ...item, quantity: 1, completed: false }];

        await this.save(this.withUpdatedItems(list, constructionItems));
    }

    async removeConstruction(listId: string, itemId: string): Promise<void> {
        const list = this.findById(listId);
        if (!list) {
            return;
        }

        await this.save(
            this.withUpdatedItems(
                list,
                list.constructionItems.filter((item) => item.id !== itemId)
            )
        );
    }

    async setSharing(listId: string, isShared: boolean): Promise<boolean> {
        const list = this.findById(listId);
        return list ? this.save({ ...list, isShared, updatedAt: new Date().toISOString() }) : false;
    }

    async setAllowEditing(listId: string, allowEditing: boolean): Promise<boolean> {
        const list = this.findById(listId);
        return list
            ? this.save({ ...list, allowEditing, updatedAt: new Date().toISOString() })
            : false;
    }

    async setDecomposeMaterials(listId: string, decomposeMaterials: boolean): Promise<boolean> {
        const list = this.findById(listId);
        return list
            ? this.save({ ...list, decomposeMaterials, updatedAt: new Date().toISOString() })
            : false;
    }

    canEdit(list: ConstructionList, userId: number | undefined): boolean {
        return list.ownerUserId === userId || list.allowEditing;
    }

    private async save(list: ConstructionList): Promise<boolean> {
        const response = await this.request<ListResponse>(
            () =>
                firstValueFrom(
                    this.http.put<ListResponse>(
                        `/api/lists/${encodeURIComponent(list.id)}`,
                        { list, shared: list.isShared },
                        { withCredentials: true }
                    )
                ),
            'Não foi possível salvar as alterações da lista.'
        );
        if (!response) {
            return false;
        }

        this.upsert(response.list);
        return true;
    }

    private async request<T>(
        request: () => Promise<T>,
        fallbackMessage: string
    ): Promise<T | undefined> {
        this.error.set(null);
        return this.trackRequest(async () => {
            try {
                return await request();
            } catch (error) {
                this.reportError(error, fallbackMessage);
                return undefined;
            }
        });
    }

    private async trackRequest<T>(request: () => Promise<T>): Promise<T> {
        this.activeRequests += 1;
        this.isLoading.set(true);
        try {
            return await request();
        } finally {
            this.activeRequests -= 1;
            this.isLoading.set(this.activeRequests > 0);
        }
    }

    private reportError(error: unknown, fallbackMessage: string): void {
        const apiMessage =
            error instanceof HttpErrorResponse &&
            typeof error.error === 'object' &&
            error.error !== null &&
            'message' in error.error &&
            typeof error.error.message === 'string'
                ? error.error.message
                : null;
        this.error.set(apiMessage ?? fallbackMessage);
    }

    private upsert(list: ConstructionList): void {
        this.lists.update((lists) => [list, ...lists.filter((current) => current.id !== list.id)]);
    }

    private withUpdatedItems(
        list: ConstructionList,
        constructionItems: ConstructionItem[]
    ): ConstructionList {
        const totalUnits = constructionItems.reduce((total, item) => total + item.quantity, 0);
        const completedUnits = constructionItems.reduce(
            (total, item) => total + (item.completed ? item.quantity : 0),
            0
        );

        return {
            ...list,
            constructionItems,
            totalUnits,
            completedUnits,
            buildings: constructionItems.length,
            progress: totalUnits ? Math.round((completedUnits / totalUnits) * 100) : 0,
            status: totalUnits > 0 && completedUnits === totalUnits ? 'completed' : 'planning',
            updatedAt: new Date().toISOString(),
            updatedOrder: this.nextUpdatedOrder()
        };
    }

    private nextUpdatedOrder(): number {
        return Math.max(0, ...this.lists().map((list) => list.updatedOrder)) + 1;
    }

    private readLegacyLists(): ConstructionList[] {
        let serialized: string | null;
        try {
            serialized = localStorage.getItem(legacyStorageKey);
        } catch (error) {
            this.reportError(error, 'Não foi possível acessar as listas antigas deste navegador.');
            return [];
        }

        if (!serialized) {
            return [];
        }

        try {
            const storedValue: unknown = JSON.parse(serialized);
            if (
                !isRecord(storedValue) ||
                storedValue['version'] !== 1 ||
                !Array.isArray(storedValue['lists'])
            ) {
                return [];
            }

            return storedValue['lists'].filter(isLegacyList).map((list) => ({
                ...list,
                imageThumbnailUrl: list.imageThumbnailUrl ?? list.imageUrl,
                ownerUserId: 0,
                isShared: false,
                allowEditing: false,
                decomposeMaterials: list.decomposeMaterials ?? true
            }));
        } catch (error) {
            this.reportError(error, 'Não foi possível ler as listas antigas deste navegador.');
            return [];
        }
    }

    private isLegacyImportComplete(): boolean {
        try {
            return localStorage.getItem(this.legacyImportMarker()) === 'true';
        } catch (error) {
            this.reportError(error, 'Não foi possível verificar a importação das listas antigas.');
            return false;
        }
    }

    private markLegacyImportComplete(): void {
        try {
            localStorage.setItem(this.legacyImportMarker(), 'true');
        } catch (error) {
            this.reportError(error, 'Não foi possível registrar a importação das listas antigas.');
        }
    }

    private legacyImportMarker(): string {
        return `varden.legacy-imported.v1.${this.auth.user()?.id ?? 'anonymous'}`;
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isLegacyList(
    value: unknown
): value is Omit<ConstructionList, 'ownerUserId' | 'isShared' | 'allowEditing'> {
    if (!isRecord(value)) {
        return false;
    }

    return (
        typeof value['id'] === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            value['id']
        ) &&
        typeof value['title'] === 'string' &&
        typeof value['region'] === 'string' &&
        typeof value['description'] === 'string' &&
        typeof value['completedUnits'] === 'number' &&
        typeof value['totalUnits'] === 'number' &&
        typeof value['buildings'] === 'number' &&
        typeof value['progress'] === 'number' &&
        typeof value['updatedAt'] === 'string' &&
        typeof value['updatedOrder'] === 'number' &&
        typeof value['imageUrl'] === 'string' &&
        (value['imageThumbnailUrl'] === undefined ||
            typeof value['imageThumbnailUrl'] === 'string') &&
        typeof value['imageAlt'] === 'string' &&
        typeof value['priority'] === 'boolean' &&
        (value['status'] === 'planning' || value['status'] === 'completed') &&
        Array.isArray(value['constructionItems']) &&
        value['constructionItems'].every(isLegacyItem)
    );
}

function isLegacyItem(value: unknown): boolean {
    if (!isRecord(value)) {
        return false;
    }

    return (
        typeof value['id'] === 'string' &&
        typeof value['name'] === 'string' &&
        ['workbench', 'bed', 'chest', 'campfire', 'portal', 'sword'].includes(
            String(value['icon'])
        ) &&
        typeof value['unitDescription'] === 'string' &&
        typeof value['quantity'] === 'number' &&
        typeof value['completed'] === 'boolean' &&
        Array.isArray(value['materials']) &&
        value['materials'].every(
            (material) =>
                isRecord(material) &&
                typeof material['name'] === 'string' &&
                typeof material['amount'] === 'number'
        )
    );
}
