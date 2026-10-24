import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    {
        path: 'home',
        loadComponent: () => import('./pages/home/home').then((module) => module.Home)
    },
    {
        path: 'create-list',
        loadComponent: () =>
            import('./pages/create-list/create-list').then((module) => module.CreateList)
    },
    {
        path: 'list/:id',
        loadComponent: () => import('./pages/view-list/view-list').then((module) => module.ViewList)
    },
    {
        path: 'view-list/:id',
        loadComponent: () => import('./pages/view-list/view-list').then((module) => module.ViewList)
    }
];
