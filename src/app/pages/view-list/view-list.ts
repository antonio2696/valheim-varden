import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConstructionListStore } from '../home/construction-list.store';
import { constructionCatalog } from '../home/construction-catalog';
import {
    ConstructionItem,
    ConstructionMaterial,
    formatListUpdatedAt
} from '../home/construction-list.model';
import { VardenIcon, VardenIconName } from '../../components/icon/icon';
import { RenameListAction } from '../../components/rename-list-action/rename-list-action';
import { AuthStore } from '../../auth/auth.store';

interface MaterialTotals {
    name: string;
    total: number;
    remaining: number;
}

type CatalogEntry = Omit<ConstructionItem, 'quantity' | 'completed'>;

const catalogById = new Map(constructionCatalog.map((item) => [item.id, item]));
const catalogByName = indexCatalogByName(constructionCatalog);

function normalizeMaterialName(name: string): string {
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function indexCatalogByName(items: CatalogEntry[]): Map<string, CatalogEntry> {
    const byName = new Map<string, CatalogEntry>();
    for (const item of items) {
        for (const name of [item.name, item.nameEn, ...(item.aliases ?? [])]) {
            if (!name) {
                continue;
            }

            const normalizedName = normalizeMaterialName(name);
            const indexedItem = byName.get(normalizedName);
            if (!indexedItem || (!indexedItem.materials.length && item.materials.length)) {
                byName.set(normalizedName, item);
            }
        }
    }
    return byName;
}

function outputQuantity(item: Pick<ConstructionItem, 'outputQuantity'> | undefined): number {
    return item?.outputQuantity && item.outputQuantity > 0 ? item.outputQuantity : 1;
}

function calculateMaterials(items: ConstructionItem[], decompose: boolean): MaterialTotals[] {
    const totals = new Map<string, MaterialTotals>();

    const addMaterial = (name: string, amount: number, completed: boolean) => {
        const current = totals.get(name) ?? { name, total: 0, remaining: 0 };
        current.total += amount;
        if (!completed) {
            current.remaining += amount;
        }
        totals.set(name, current);
    };

    const addIngredients = (
        materials: ConstructionMaterial[],
        multiplier: number,
        completed: boolean,
        ancestors: ReadonlySet<string>
    ) => {
        for (const material of materials) {
            const amount = material.amount * multiplier;
            const ingredient = catalogByName.get(normalizeMaterialName(material.name));
            if (!decompose || !ingredient?.materials.length || ancestors.has(ingredient.id)) {
                addMaterial(material.name, amount, completed);
                continue;
            }

            const batches = Math.ceil(amount / outputQuantity(ingredient));
            addIngredients(
                ingredient.materials,
                batches,
                completed,
                new Set([...ancestors, ingredient.id])
            );
        }
    };

    for (const item of items) {
        const catalogItem = catalogById.get(item.id) ?? item;
        const batches = Math.ceil(item.quantity / outputQuantity(catalogItem));
        if (!decompose) {
            addIngredients(item.materials, batches, item.completed, new Set());
            continue;
        }

        addIngredients(item.materials, batches, item.completed, new Set([item.id]));
    }

    return [...totals.values()];
}

@Component({
    selector: 'varden-view-list',
    templateUrl: './view-list.html',
    imports: [NgOptimizedImage, RenameListAction, RouterLink, VardenIcon]
})
export class ViewList {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly auth = inject(AuthStore);
    private readonly listStore = inject(ConstructionListStore);
    private readonly params = toSignal(this.route.paramMap, {
        initialValue: this.route.snapshot.paramMap
    });
    readonly list = computed(() => this.listStore.findById(this.params().get('id')));
    readonly canEdit = computed(() => {
        const list = this.list();
        return list ? this.listStore.canEdit(list, this.auth.user()?.id) : false;
    });
    readonly isOwner = computed(() => this.list()?.ownerUserId === this.auth.user()?.id);
    readonly error = this.listStore.error;
    readonly isLoading = this.listStore.isLoading;
    readonly formatUpdatedAt = formatListUpdatedAt;
    readonly filter = signal<'all' | 'pending' | 'done'>('all');
    readonly activeTab = signal<'constructions' | 'materials'>('constructions');
    readonly search = signal('');
    readonly activeCatalogIndex = signal(0);
    readonly catalog = constructionCatalog;
    readonly filterOptions = [
        { label: 'Todos', value: 'all' },
        { label: 'Pendentes', value: 'pending' },
        { label: 'Feitos', value: 'done' }
    ] as const;
    readonly filteredItems = computed(() => {
        const query = this.normalizeSearch(this.search());
        return (this.list()?.constructionItems ?? []).filter((item) => {
            const matchesFilter =
                this.filter() === 'all' ||
                (this.filter() === 'pending' && !item.completed) ||
                (this.filter() === 'done' && item.completed);
            const searchableNames = [item.name, item.nameEn, ...(item.aliases ?? [])];
            const matchesSearch =
                !query ||
                searchableNames.some((name) => this.normalizeSearch(name ?? '').includes(query));
            return matchesFilter && matchesSearch;
        });
    });
    readonly pendingCount = computed(
        () => this.list()?.constructionItems.filter((item) => !item.completed).length ?? 0
    );
    readonly completedCount = computed(
        () => this.list()?.constructionItems.filter((item) => item.completed).length ?? 0
    );
    readonly matchingCatalog = computed(() => {
        const query = this.normalizeSearch(this.search());
        if (!query) {
            return [];
        }
        return this.catalog
            .map((item) => {
                const names = [item.name, item.nameEn, ...(item.aliases ?? [])].filter(
                    (name): name is string => Boolean(name)
                );
                const matchingNames = names.filter((name) =>
                    this.normalizeSearch(name).includes(query)
                );

                return {
                    item,
                    matchingNames,
                    startsWithQuery: matchingNames.some((name) =>
                        this.normalizeSearch(name).startsWith(query)
                    )
                };
            })
            .filter((match) => match.matchingNames.length > 0)
            .sort((first, second) => Number(second.startsWithQuery) - Number(first.startsWithQuery))
            .slice(0, 12)
            .map((match) => match.item);
    });
    readonly activeCatalogItem = computed(
        () => this.matchingCatalog()[this.activeCatalogIndex()] ?? this.matchingCatalog()[0]
    );
    readonly materials = computed(() => {
        const list = this.list();
        return calculateMaterials(
            list?.constructionItems ?? [],
            list?.decomposeMaterials !== false
        );
    });
    readonly totalMaterialUnits = computed(() =>
        this.materials().reduce((total, material) => total + material.total, 0)
    );
    readonly remainingMaterialUnits = computed(() =>
        this.materials().reduce((total, material) => total + material.remaining, 0)
    );
    readonly icons: Record<ConstructionItem['icon'], VardenIconName> = {
        workbench: 'hammer',
        bed: 'bedDouble',
        chest: 'package2',
        campfire: 'flame',
        portal: 'orbit',
        sword: 'sword'
    };
    readonly backIcon = 'arrowLeft';
    readonly completedIcon = 'check';
    readonly pendingIcon = 'circleDashed';
    readonly constructionIcon = 'hammer';
    readonly materialsIcon = 'layers';
    readonly searchIcon = 'search';
    readonly minusIcon = 'minus';
    readonly plusIcon = 'plus';
    readonly removeIcon = 'trash2';
    readonly externalIcon = 'externalLink';

    setSearch(event: Event): void {
        this.search.set((event.target as HTMLInputElement).value);
        this.activeCatalogIndex.set(0);
    }

    handleSearchKeydown(event: KeyboardEvent): void {
        const matches = this.matchingCatalog();
        const activeItem = this.activeCatalogItem();
        if (!matches.length) {
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            this.activeCatalogIndex.update((index) => (index + 1) % matches.length);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            this.activeCatalogIndex.update(
                (index) => (index - 1 + matches.length) % matches.length
            );
        } else if (event.key === 'Enter' && activeItem) {
            event.preventDefault();
            this.addFromCatalog(activeItem);
        } else if (event.key === 'Escape') {
            this.search.set('');
            this.activeCatalogIndex.set(0);
        }
    }

    kindLabel(kind: ConstructionItem['kind']): string {
        switch (kind) {
            case 'recipe':
                return 'Receita';
            case 'mead':
                return 'Hidromel';
            case 'armor':
                return 'Armadura';
            case 'weapon':
                return 'Arma';
            case 'building':
                return 'Construção';
            default:
                return 'Construção';
        }
    }

    formatTotalMaterials(item: ConstructionItem): string {
        return calculateMaterials([item], this.list()?.decomposeMaterials !== false)
            .map((material) => `${material.total} ${material.name}`)
            .join(' · ');
    }

    setDecomposeMaterials(event: Event): void {
        const list = this.list();
        if (list && this.canEdit()) {
            void this.listStore.setDecomposeMaterials(
                list.id,
                (event.target as HTMLInputElement).checked
            );
        }
    }

    setItemCompleted(item: ConstructionItem, completed: boolean): void {
        const list = this.list();
        if (list && this.canEdit()) {
            void this.listStore.updateItem(list.id, item.id, (current) => ({
                ...current,
                completed
            }));
        }
    }

    changeQuantity(item: ConstructionItem, difference: number): void {
        const list = this.list();
        if (list && this.canEdit()) {
            void this.listStore.updateItem(list.id, item.id, (current) => ({
                ...current,
                quantity: Math.max(1, current.quantity + difference)
            }));
        }
    }

    addFromCatalog(item: (typeof constructionCatalog)[number]): void {
        const list = this.list();
        if (list && this.canEdit()) {
            void this.listStore.addConstruction(list.id, item);
            this.search.set('');
            this.activeCatalogIndex.set(0);
        }
    }

    private normalizeSearch(value: string): string {
        return value
            .trim()
            .toLocaleLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    removeItem(item: ConstructionItem): void {
        const list = this.list();
        if (list && this.canEdit()) {
            void this.listStore.removeConstruction(list.id, item.id);
        }
    }

    async deleteList(): Promise<void> {
        const list = this.list();
        if (
            list &&
            this.isOwner() &&
            window.confirm(`Excluir a lista "${list.title}"? Esta ação não pode ser desfeita.`) &&
            (await this.listStore.deleteList(list.id))
        ) {
            await this.router.navigate(['/my-lists']);
        }
    }

    async setShared(isShared: boolean): Promise<void> {
        const list = this.list();
        if (list && this.isOwner()) {
            await this.listStore.setSharing(list.id, isShared);
        }
    }

    async setCollaborativeEditing(allowEditing: boolean): Promise<void> {
        const list = this.list();
        if (list && this.isOwner() && list.isShared) {
            await this.listStore.setAllowEditing(list.id, allowEditing);
        }
    }
}
