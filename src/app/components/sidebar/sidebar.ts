import { Component, inject, input, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../auth/auth.store';
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
    private readonly auth = inject(AuthStore);
    private readonly router = inject(Router);
    readonly privateLists = input.required<SidebarItem[]>();
    readonly sharedLists = input.required<SidebarItem[]>();
    readonly error = this.auth.error;
    readonly isLoading = this.auth.isLoading;
    readonly showAllPrivate = signal(false);
    readonly showAllShared = signal(false);
    readonly brandIcon = 'pickaxe';
    readonly tipIcon = 'compass';

    async logout(): Promise<void> {
        if (await this.auth.logout()) {
            await this.router.navigate(['/login']);
        }
    }
}
