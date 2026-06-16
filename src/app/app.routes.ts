import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: "",
    loadComponent: () => import('./features/dashboard/dashboard'),
  },
  {
    path: "dashboard",
    loadComponent: () => import('./features/dashboard/dashboard')
  },
  {
    path: "touren",
    loadComponent: () => import('./features/hike-list/hike-list')
  },
  {
    path: "touren/:id",
    loadComponent: () => import('./features/hike-detail/hike-detail')
  },
  {
    path: "touren/:id/vergleich/:id",
    loadComponent: () => import('./features/hike-compare/hike-compare')
  },
  {
    path: "neu",
    loadComponent: () => import('./features/hike-create/hike-create')
  },
  {
    path: "statistiken",
    loadComponent: () => import('./features/hike-create/hike-create')
  },
];
