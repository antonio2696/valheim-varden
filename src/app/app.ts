import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthStore } from './auth/auth.store';
import { Sidebar, SidebarItem } from './components/sidebar/sidebar';
import { ConstructionListStore } from './pages/home/construction-list.store';

@Component({
    selector: 'app-root',
    templateUrl: './app.html',
    imports: [RouterOutlet, Sidebar]
})
export class App {
    readonly auth = inject(AuthStore);
    private readonly listStore = inject(ConstructionListStore);
    readonly isLoading = computed(() => this.auth.isLoading() || this.listStore.isLoading());
    readonly isAuthenticated = computed(() => this.auth.user() !== null);
    readonly privateLists = computed<SidebarItem[]>(() =>
        this.listStore
            .lists()
            .filter((list) => !list.isShared)
            .map(({ id, title }) => ({ id, label: title }))
    );
    readonly sharedLists = computed<SidebarItem[]>(() =>
        this.listStore
            .lists()
            .filter((list) => list.isShared)
            .map(({ id, title }) => ({ id, label: title }))
    );
}
