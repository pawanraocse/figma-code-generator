import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'figma-preview',
    loadComponent: () => import('./generated/unnamed/unnamed.component').then(m => m.UnnamedComponent)
  }
];
