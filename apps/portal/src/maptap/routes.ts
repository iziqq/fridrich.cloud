import type { RouteRecordRaw } from 'vue-router';
import MapTapShell from './MapTapShell.vue';

/**
 * Cesta, pod kterou MapTap v portálu žije.
 *
 * Je to jediné místo, kde prefix stojí – odkazy uvnitř si ho skládají přes
 * `maptapPath()`.
 */
export const MAPTAP_BASE = '/maptap';

export function maptapPath(path = ''): string {
  return `${MAPTAP_BASE}${path}`;
}

/**
 * Routy tabule.
 *
 * Aplikace je interní: **v rozcestníku portálu schválně není** (nemá záznam
 * v `content/apps.ts`), kdo o ní ví, napíše si adresu. Neuvedení ale není
 * ochrana – tou je `requiresAuth`, bez přihlášení tu není co vidět
 * (doc/wiki/domains/maptap.md).
 */
export const maptapRoutes: RouteRecordRaw[] = [
  {
    path: MAPTAP_BASE,
    component: MapTapShell,
    // `bare` schová hlavičku a patičku portálu – produkt má vlastní.
    meta: { requiresAuth: true, bare: true },
    children: [
      {
        // Lišta i `main#obsah` jsou společné, obrazovky se mění uvnitř.
        path: '',
        component: () => import('./MapTapLayout.vue'),
        children: [
          {
            path: '',
            name: 'maptap-day',
            component: () => import('./scores/DayView.vue'),
          },
          {
            path: 'poradi',
            name: 'maptap-standings',
            component: () => import('./scores/StandingsView.vue'),
          },
        ],
      },
      {
        path: ':pathMatch(.*)*',
        name: 'maptap-not-found',
        component: () => import('./NotFoundView.vue'),
      },
    ],
  },
];
