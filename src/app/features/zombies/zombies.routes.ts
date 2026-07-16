import { Routes } from '@angular/router';

/**
 * Rutas de la sección Zombies, cargadas de forma diferida (lazy) desde
 * app.routes.ts mediante loadChildren.
 *
 *   /zombies                          -> listado principal
 *   /zombies/:gameSlug                -> detalle del juego
 *   /zombies/:gameSlug/:mapSlug       -> guía del mapa
 *   /zombies/**                       -> guía no encontrada (fallback)
 */
export const ZOMBIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./zombies-shell.component').then((m) => m.ZombiesShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/zombies-home/zombies-home.component').then(
            (m) => m.ZombiesHomeComponent
          ),
      },
      {
        path: 'not-found',
        loadComponent: () =>
          import('./pages/guide-not-found/guide-not-found.component').then(
            (m) => m.ZombiesGuideNotFoundComponent
          ),
      },
      {
        path: ':gameSlug',
        loadComponent: () =>
          import('./pages/game-detail/game-detail.component').then(
            (m) => m.ZombiesGameDetailComponent
          ),
      },
      {
        path: ':gameSlug/:mapSlug',
        loadComponent: () =>
          import('./pages/map-guide/map-guide.component').then(
            (m) => m.ZombiesMapGuideComponent
          ),
      },
      {
        path: '**',
        loadComponent: () =>
          import('./pages/guide-not-found/guide-not-found.component').then(
            (m) => m.ZombiesGuideNotFoundComponent
          ),
      },
    ],
  },
];
