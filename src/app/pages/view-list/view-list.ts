import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ConstructionListStore } from '../home/construction-list.store';
import { constructionCatalog } from '../home/construction-catalog';
import { ConstructionItem, formatListUpdatedAt } from '../home/construction-list.model';
import { VardenIcon, VardenIconName } from '../../components/icon/icon';
import { RenameListAction } from '../../components/rename-list-action/rename-list-action';

@Component({
    selector: 'varden-view-list',
    templateUrl: './view-list.html',
    imports: [NgOptimizedImage, RenameListAction, RouterLink, VardenIcon]
})
export class ViewList {
    private readonly route = inject(ActivatedRoute);
    private readonly listStore = inject(ConstructionListStore);
    private readonly params = toSignal(this.route.paramMap, {
        initialValue: this.route.snapshot.paramMap
    });
    readonly list = computed(() => this.listStore.findById(this.params().get('id')));
    readonly filter = signal<'all' | 'pending' | 'done'>('all');
    readonly activeTab = signal<'constructions' | 'materials'>('constructions');
    readonly search = signal('');
    readonly activeCatalogIndex = signal(0);
    readonly catalog = constructionCatalog;
    readonly formatUpdatedAt = formatListUpdatedAt;
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
        const totals = new Map<string, { total: number; remaining: number }>();
        for (const item of this.list()?.constructionItems ?? []) {
            for (const material of item.materials) {
                const current = totals.get(material.name) ?? { total: 0, remaining: 0 };
                const amount = material.amount * item.quantity;
                current.total += amount;
                if (!item.completed) {
                    current.remaining += amount;
                }
                totals.set(material.name, current);
            }
        }
        return [...totals.entries()].map(([name, amounts]) => ({ name, ...amounts }));
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
        return item.materials
            .map((material) => `${material.amount * item.quantity} ${material.name}`)
            .join(' · ');
    }

    setItemCompleted(item: ConstructionItem, completed: boolean): void {
        const list = this.list();
        if (list) {
            this.listStore.updateItem(list.id, item.id, (current) => ({ ...current, completed }));
        }
    }

    changeQuantity(item: ConstructionItem, difference: number): void {
        const list = this.list();
        if (list) {
            this.listStore.updateItem(list.id, item.id, (current) => ({
                ...current,
                quantity: Math.max(1, current.quantity + difference)
            }));
        }
    }

    addFromCatalog(item: (typeof constructionCatalog)[number]): void {
        const list = this.list();
        if (list) {
            this.listStore.addConstruction(list.id, item);
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
        if (list) {
            this.listStore.removeConstruction(list.id, item.id);
        }
    }
}
