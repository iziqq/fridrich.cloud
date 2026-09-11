import type { RouteRecordRaw } from 'vue-router';
import WeddyShell from './WeddyShell.vue';

/**
 * Cesta, pod kterou IziWeddy v portálu žije.
 *
 * Je to jediné místo, kde prefix stojí – odkazy uvnitř aplikace si ho
 * skládají přes `weddyPath()`, takže přesun pod jinou cestu je změna
 * jednoho řádku.
 */
export const WEDDY_BASE = '/izi-weddy';

export function weddyPath(path = ''): string {
  return `${WEDDY_BASE}${path}`;
}

/**
 * Routy svatebního plánovače.
 *
 * Všechny visí pod `WeddyShell`, který kreslí vlastní vzhled a drží
 * `requiresAuth` – plánovač bez přihlášení nemá co ukázat.
 */
export const weddyRoutes: RouteRecordRaw[] = [
  {
    path: WEDDY_BASE,
    component: WeddyShell,
    // `bare` schová hlavičku a patičku portálu – plánovač má vlastní.
    // Děti routu dědí, takže stačí jednou na kořeni.
    meta: { requiresAuth: true, bare: true },
    children: [
      {
        path: '',
        name: 'weddy-dashboard',
        component: () => import('./views/DashboardView.vue'),
      },
      {
        path: 'weddings/new',
        name: 'weddy-wedding-new',
        component: () => import('./views/WeddingNewView.vue'),
      },
      {
        path: 'weddings/:weddingId',
        component: () => import('./layouts/WeddingLayout.vue'),
        children: [
          { path: '', redirect: (to) => weddyPath(`/weddings/${to.params['weddingId']}/couple`) },
          { path: 'couple', name: 'weddy-couple', component: () => import('./views/CoupleView.vue') },
          { path: 'guests', name: 'weddy-guests', component: () => import('./views/GuestsView.vue') },
          {
            path: 'planning',
            name: 'weddy-planning',
            component: () => import('./views/PlanningView.vue'),
          },
          {
            path: 'planning/:category',
            name: 'weddy-planning-category',
            component: () => import('./views/PlanningCategoryView.vue'),
          },
          { path: 'budget', name: 'weddy-budget', component: () => import('./views/BudgetView.vue') },
        ],
      },
      {
        path: ':pathMatch(.*)*',
        name: 'weddy-not-found',
        component: () => import('./views/NotFoundView.vue'),
      },
    ],
  },
];
