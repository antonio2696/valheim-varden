import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { VardenIcon } from '../icon/icon';

export interface SidebarItem {
    label: string;
    id: string;
}

@Component({
    selector: 'varden-sidebar',
    templateUrl: './sidebar.html',
    imports: [RouterLink, RouterLinkActive, VardenIcon]
})
export class Sidebar {
    readonly items = input.required<SidebarItem[]>();
    readonly brandIcon = 'pickaxe';
    readonly tipIcon = 'compass';
}
