import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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
    readonly plusIcon = 'plus';
    readonly arrowRightIcon = 'arrowRight';
    readonly sortIcon = 'arrowUpDown';
    readonly deleteIcon = 'trash2';
    readonly tipIcon = 'lightbulb';
    readonly formatUpdatedAt = formatListUpdatedAt;
    private readonly listStore = inject(ConstructionListStore);
    readonly summaries = this.listStore.summaries;
    readonly lists = this.listStore.lists;
    readonly selectedFilter = signal<ListFilter>('all');
    readonly sortOrder = signal<'recent' | 'oldest'>('recent');
    readonly filters = computed(() => [
        { label: 'Todas', value: 'all' as const, count: this.lists().length },
        {
            label: 'Em planejamento',
            value: 'planning' as const,
            count: this.lists().filter((list) => list.status === 'planning').length
        },
        {
            label: 'Concluídas',
            value: 'completed' as const,
            count: this.lists().filter((list) => list.status === 'completed').length
        }
    ]);
    readonly visibleLists = computed(() => {
        const filteredLists = this.lists().filter(
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
}
