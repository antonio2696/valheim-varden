import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';
import { ConstructionListStore } from '../pages/home/construction-list.store';

export const requireAuthentication: CanActivateFn = async () => {
    const auth = inject(AuthStore);
    const router = inject(Router);
    const listStore = inject(ConstructionListStore);

    if (!(await auth.ensureSession())) {
        return router.parseUrl('/login');
    }

    await listStore.loadLists();
    return true;
};
