import type { RouteRecordRaw } from 'vue-router';
import BudgyShell from './BudgyShell.vue';

/**
 * Cesta, pod kterou IziBudgy v portálu žije.
 *
 * Je to jediné místo, kde prefix stojí – odkazy uvnitř aplikace si ho
 * skládají přes `budgyPath()`, takže přesun pod jinou cestu je změna
 * jednoho řádku.
 */
export const BUDGY_BASE = '/izi-budgy';

export function budgyPath(path = ''): string {
  return `${BUDGY_BASE}${path}`;
}

/**
 * Routy rozpočtu.
 *
 * Všechny visí pod `BudgyShell`, který kreslí vlastní vzhled a drží
 * `requiresAuth` – rozpočet bez přihlášení nemá co ukázat.
 */
export const budgyRoutes: RouteRecordRaw[] = [
  {
    path: BUDGY_BASE,
    component: BudgyShell,
    // `bare` schová hlavičku a patičku portálu – produkt má vlastní.
    meta: { requiresAuth: true, bare: true },
    children: [
      {
        // Lišta i `main#obsah` jsou společné, obrazovky se mění uvnitř.
        path: '',
        component: () => import('./BudgyLayout.vue'),
        children: [
          {
            path: '',
            name: 'budgy-dashboard',
            component: () => import('./budget/DashboardView.vue'),
          },
          {
            path: 'mesic',
            name: 'budgy-month',
            component: () => import('./budget/BudgetView.vue'),
          },
        ],
      },
      {
        path: ':pathMatch(.*)*',
        name: 'budgy-not-found',
        component: () => import('./NotFoundView.vue'),
      },
    ],
  },
];
