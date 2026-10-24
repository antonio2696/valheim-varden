import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../auth/auth.store';
import { Button } from '../../components/button/button';
import { VardenIcon } from '../../components/icon/icon';
import { RenameListAction } from '../../components/rename-list-action/rename-list-action';
import { formatListUpdatedAt, ListFilter } from './construction-list.model';
import { ConstructionListStore } from './construction-list.store';

@Component({
    selector: 'varden-home',
    templateUrl: './home.html',
    imports: [Button, NgOptimizedImage, RenameListAction, RouterLink, VardenIcon]
})
export class Home {
    private readonly route = inject(ActivatedRoute);
    private readonly auth = inject(AuthStore);
    readonly plusIcon = 'plus';
    readonly arrowRightIcon = 'arrowRight';
    readonly sortIcon = 'arrowUpDown';
    readonly deleteIcon = 'trash2';
    readonly formatUpdatedAt = formatListUpdatedAt;
    private readonly listStore = inject(ConstructionListStore);
    readonly lists = this.listStore.lists;
    readonly isLoading = this.listStore.isLoading;
    readonly error = this.listStore.error;
    readonly legacyListsAvailable = this.listStore.legacyListsAvailable;
    private readonly routeData = toSignal(this.route.data, {
        initialValue: this.route.snapshot.data
    });
    readonly listScope = computed(() => this.routeData()['listScope'] ?? 'all');
    readonly pageTitle = computed(() =>
        this.listScope() === 'private'
            ? 'Minhas listas'
            : this.listScope() === 'shared'
              ? 'Listas compartilhadas'
              : 'Todas as listas'
    );
    readonly selectedFilter = signal<ListFilter>('all');
    readonly sortOrder = signal<'recent' | 'oldest'>('recent');
    readonly filters = computed(() => [
        { label: 'Todas', value: 'all' as const, count: this.scopedLists().length },
        {
            label: 'Em planejamento',
            value: 'planning' as const,
            count: this.scopedLists().filter((list) => list.status === 'planning').length
        },
        {
            label: 'Concluídas',
            value: 'completed' as const,
            count: this.scopedLists().filter((list) => list.status === 'completed').length
        }
    ]);
    readonly scopedLists = computed(() =>
        this.lists().filter((list) =>
            this.listScope() === 'private'
                ? !list.isShared
                : this.listScope() === 'shared'
                  ? list.isShared
                  : true
        )
    );
    readonly visibleLists = computed(() => {
        const filteredLists = this.scopedLists().filter(
            (list) => this.selectedFilter() === 'all' || list.status === this.selectedFilter()
        );

        return filteredLists.sort((first, second) =>
            this.sortOrder() === 'recent'
                ? second.updatedOrder - first.updatedOrder
                : first.updatedOrder - second.updatedOrder
        );
    });

    toggleSort(): void {
        this.sortOrder.update((order) => (order === 'recent' ? 'oldest' : 'recent'));
    }

    async deleteList(listId: string, title: string): Promise<void> {
        if (window.confirm(`Excluir a lista "${title}"? Esta ação não pode ser desfeita.`)) {
            await this.listStore.deleteList(listId);
        }
    }

    async importLegacyLists(): Promise<void> {
        await this.listStore.importLegacyLists();
    }

    canEdit(listId: string): boolean {
        const list = this.listStore.findById(listId);
        return list ? this.listStore.canEdit(list, this.auth.user()?.id) : false;
    }

    isOwner(listId: string): boolean {
        return this.listStore.findById(listId)?.ownerUserId === this.auth.user()?.id;
    }
}
