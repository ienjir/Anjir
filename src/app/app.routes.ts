import { Routes } from '@angular/router';
import { langGuard } from './lang-guard';

export const routes: Routes = [
  {
    path: ':lang',
    canActivate: [langGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/dashboard/dashboard'),
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard'),
      },
      {
        path: 'touren',
        loadComponent: () => import('./pages/hike-list/hike-list'),
      },
      {
        path: 'touren/:id',
        loadComponent: () => import('./pages/hike-detail/hike-detail'),
      },
      {
        path: 'touren/:id/vergleich/:id',
        loadComponent: () => import('./pages/hike-compare/hike-compare'),
      },
      {
        path: 'neu',
        loadComponent: () => import('./pages/hike-create/hike-create'),
      },
      {
        path: 'statistiken',
        loadComponent: () => import('./pages/hike-create/hike-create'),
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
