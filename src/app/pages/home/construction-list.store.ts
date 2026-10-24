import { Injectable, computed, signal } from '@angular/core';
import { valheimImages } from '../../data/valheim-images';
import { createUuidV4 } from '../../utils/uuid';
import { ConstructionItem, ConstructionList } from './construction-list.model';

const storageKey = 'varden.construction-lists.v1';

@Injectable({ providedIn: 'root' })
export class ConstructionListStore {
    readonly lists = signal<ConstructionList[]>(this.loadLists());
    readonly summaries = computed(() => [
        {
            label: 'Listas cadastradas',
            description: 'Seus projetos reunidos',
            icon: 'clipboardList' as const,
            count: this.lists().length
        },
        {
            label: 'Em planejamento',
            description: 'Ainda há trabalho a fazer',
            icon: 'hammer' as const,
            count: this.lists().filter((list) => list.status === 'planning').length
        },
        {
            label: 'Lista concluída',
            description: 'Pronta para a próxima aventura',
            icon: 'circleCheck' as const,
            count: this.lists().filter((list) => list.status === 'completed').length
        }
    ]);

    findById(id: string | null): ConstructionList | undefined {
        return this.lists().find((list) => list.id === id);
    }

    addList(details: {
        title: string;
        region: string;
        description: string;
        imageId: string;
    }): ConstructionList {
        const selectedImage = valheimImages.find((image) => image.id === details.imageId);
        if (!selectedImage) {
            throw new TypeError(`Unknown Valheim image: ${details.imageId}`);
        }

        const list: ConstructionList = {
            id: createUuidV4(),
            title: details.title,
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
            constructionItems: []
        };

        this.lists.update((lists) => [list, ...lists]);
        this.persistLists();
        return list;
    }

    renameList(listId: string, title: string): boolean {
        const normalizedTitle = title.trim();
        if (!normalizedTitle || normalizedTitle.length > 100) {
            return false;
        }

        const list = this.findById(listId);
        if (!list) {
            return false;
        }
        if (list.title === normalizedTitle) {
            return true;
        }

        this.lists.update((lists) =>
            lists.map((current) =>
                current.id === listId
                    ? {
                          ...current,
                          title: normalizedTitle,
                          updatedAt: new Date().toISOString(),
                          updatedOrder: this.nextUpdatedOrder()
                      }
                    : current
            )
        );
        this.persistLists();
        return true;
    }

    updateItem(
        listId: string,
        itemId: string,
        update: (item: ConstructionItem) => ConstructionItem
    ): void {
        this.lists.update((lists) =>
            lists.map((list) =>
                list.id === listId
                    ? this.withUpdatedItems(
                          list,
                          list.constructionItems.map((item) =>
                              item.id === itemId ? update(item) : item
                          )
                      )
                    : list
            )
        );
        this.persistLists();
    }

    addConstruction(listId: string, item: Omit<ConstructionItem, 'quantity' | 'completed'>): void {
        this.lists.update((lists) =>
            lists.map((list) => {
                if (list.id !== listId) {
                    return list;
                }

                const existing = list.constructionItems.find(
                    (construction) => construction.id === item.id
                );
                const constructionItems = existing
                    ? list.constructionItems.map((construction) =>
                          construction.id === item.id
                              ? { ...construction, quantity: construction.quantity + 1 }
                              : construction
                      )
                    : [...list.constructionItems, { ...item, quantity: 1, completed: false }];

                return this.withUpdatedItems(list, constructionItems);
            })
        );
        this.persistLists();
    }

    removeConstruction(listId: string, itemId: string): void {
        this.lists.update((lists) =>
            lists.map((list) =>
                list.id === listId
                    ? this.withUpdatedItems(
                          list,
                          list.constructionItems.filter((item) => item.id !== itemId)
                      )
                    : list
            )
        );
        this.persistLists();
    }

    private loadLists(): ConstructionList[] {
        const storage = this.getStorage();
        if (!storage) {
            return [];
        }

        let serialized: string | null;
        try {
            serialized = storage.getItem(storageKey);
        } catch (error) {
            console.error('Unable to read construction lists from localStorage.', error);
            return [];
        }

        if (!serialized) {
            return [];
        }

        let storedValue: unknown;
        try {
            storedValue = JSON.parse(serialized);
        } catch (error) {
            if (!(error instanceof SyntaxError)) {
                throw error;
            }
            console.error('Construction list data in localStorage is not valid JSON.', error);
            return [];
        }

        if (
            !isRecord(storedValue) ||
            storedValue['version'] !== 1 ||
            !Array.isArray(storedValue['lists']) ||
            !storedValue['lists'].every(isConstructionList)
        ) {
            console.error('Construction list data in localStorage has an invalid format.');
            return [];
        }

        const lists = storedValue['lists'];
        const now = new Date().toISOString();
        const migratedLists = lists.map((list) => {
            const thumbnailUrl =
                list.imageThumbnailUrl ??
                valheimImages.find((image) => image.url === list.imageUrl)?.thumbnailUrl ??
                list.imageUrl;
            const updatedAt = list.updatedAt === 'Criada agora' ? now : list.updatedAt;

            return thumbnailUrl === list.imageThumbnailUrl && updatedAt === list.updatedAt
                ? list
                : { ...list, imageThumbnailUrl: thumbnailUrl, updatedAt };
        });

        if (migratedLists.some((list, index) => list !== lists[index])) {
            try {
                storage.setItem(storageKey, JSON.stringify({ version: 1, lists: migratedLists }));
            } catch (error) {
                console.error('Unable to migrate list timestamps in localStorage.', error);
            }
        }

        return migratedLists;
    }

    private persistLists(): void {
        const storage = this.getStorage();
        if (!storage) {
            return;
        }

        try {
            storage.setItem(storageKey, JSON.stringify({ version: 1, lists: this.lists() }));
        } catch (error) {
            console.error('Unable to save construction lists to localStorage.', error);
        }
    }

    private getStorage(): Storage | undefined {
        try {
            return typeof localStorage === 'undefined' ? undefined : localStorage;
        } catch (error) {
            console.error('localStorage is unavailable.', error);
            return undefined;
        }
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
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isConstructionList(value: unknown): value is ConstructionList {
    return (
        isRecord(value) &&
        typeof value['id'] === 'string' &&
        typeof value['title'] === 'string' &&
        typeof value['region'] === 'string' &&
        typeof value['description'] === 'string' &&
        typeof value['completedUnits'] === 'number' &&
        typeof value['totalUnits'] === 'number' &&
        typeof value['buildings'] === 'number' &&
        typeof value['progress'] === 'number' &&
        typeof value['updatedAt'] === 'string' &&
        typeof value['imageUrl'] === 'string' &&
        (value['imageThumbnailUrl'] === undefined ||
            typeof value['imageThumbnailUrl'] === 'string') &&
        typeof value['imageAlt'] === 'string' &&
        typeof value['priority'] === 'boolean' &&
        (value['status'] === 'planning' || value['status'] === 'completed') &&
        typeof value['updatedOrder'] === 'number' &&
        Array.isArray(value['constructionItems']) &&
        value['constructionItems'].every(isConstructionItem)
    );
}

function isConstructionItem(value: unknown): value is ConstructionItem {
    return (
        isRecord(value) &&
        typeof value['id'] === 'string' &&
        typeof value['name'] === 'string' &&
        ['workbench', 'bed', 'chest', 'campfire', 'portal'].includes(String(value['icon'])) &&
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
