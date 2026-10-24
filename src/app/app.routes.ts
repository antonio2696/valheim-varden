import { Routes } from '@angular/router';
import { requireAuthentication } from './auth/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/my-lists', pathMatch: 'full' },
    {
        path: 'login',
        loadComponent: () => import('./pages/login/login').then((module) => module.Login)
    },
    {
        path: 'home',
        loadComponent: () => import('./pages/home/home').then((module) => module.Home),
        canActivate: [requireAuthentication],
        data: { listScope: 'all' }
    },
    {
        path: 'my-lists',
        loadComponent: () => import('./pages/home/home').then((module) => module.Home),
        canActivate: [requireAuthentication],
        data: { listScope: 'private' }
    },
    {
        path: 'shared-lists',
        loadComponent: () => import('./pages/home/home').then((module) => module.Home),
        canActivate: [requireAuthentication],
        data: { listScope: 'shared' }
    },
    {
        path: 'create-list',
        loadComponent: () =>
            import('./pages/create-list/create-list').then((module) => module.CreateList),
        canActivate: [requireAuthentication]
    },
    {
        path: 'list/:id',
        loadComponent: () =>
            import('./pages/view-list/view-list').then((module) => module.ViewList),
        canActivate: [requireAuthentication]
    },
    {
        path: 'view-list/:id',
        loadComponent: () =>
            import('./pages/view-list/view-list').then((module) => module.ViewList),
        canActivate: [requireAuthentication]
    }
];
