import { Routes } from '@angular/router';
import { langGuard } from './lang-guard';

export const routes: Routes = [
  {
    path: ':lang',
    canActivate: [langGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard'),
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard'),
      },
      {
        path: 'touren',
        loadComponent: () => import('./features/hike/pages/hike-list/hike-list'),
      },
      {
        path: 'touren/:id',
        loadComponent: () => import('./features/hike/pages/hike-detail/hike-detail'),
      },
      {
        path: 'touren/:id/vergleich/:id',
        loadComponent: () => import('./features/hike/pages/hike-compare/hike-compare'),
      },
      {
        path: 'neu',
        loadComponent: () => import('./features/import/pages/hike-create/hike-create'),
      },
      {
        path: 'statistiken',
        loadComponent: () => import('./features/import/pages/hike-create/hike-create'),
      },
    ],
  },
  {
    path: '',
    redirectTo: '/en',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/en',
  },
];
