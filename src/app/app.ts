import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar, SidebarItem } from './components/sidebar/sidebar';
import { ConstructionListStore } from './pages/home/construction-list.store';

@Component({
    selector: 'app-root',
    templateUrl: './app.html',
    imports: [RouterOutlet, Sidebar]
})
export class App {
    private readonly listStore = inject(ConstructionListStore);
    readonly sidebarItems = computed<SidebarItem[]>(() =>
        this.listStore.lists().map(({ id, title }) => ({ id, label: title }))
    );
}
