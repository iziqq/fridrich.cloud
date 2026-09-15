import type { RouteRecordRaw } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import { weddyRoutes } from '@/weddy/routes';

declare module 'vue-router' {
  interface RouteMeta {
    /** Vyžaduje přihlášení – nepřihlášený jde na `/prihlaseni`. */
    requiresAuth?: boolean;
    /** Jen pro nepřihlášené – přihlášeného nemá smysl posílat na login. */
    guestOnly?: boolean;
    /** Bez hlavičky a patičky portálu – stránka si obal kreslí sama. */
    bare?: boolean;
  }
}

/** Routy zvlášť od routeru, ať jdou vyzkoušet i bez prohlížeče. */
export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomeView },
  {
    path: '/projekty/:id',
    name: 'project',
    component: () => import('@/views/ProjectView.vue'),
  },
  {
    path: '/prihlaseni',
    name: 'login',
    component: () => import('@/identity/LoginView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/registrace',
    name: 'register',
    component: () => import('@/identity/RegisterView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/overeni-emailu',
    name: 'verify-email',
    component: () => import('@/identity/VerifyEmailView.vue'),
  },
  {
    path: '/ucet',
    name: 'account',
    component: () => import('@/identity/AccountView.vue'),
    meta: { requiresAuth: true },
  },
  // Produkty jsou části portálu s vlastním vzhledem, ne samostatné aplikace.
  ...weddyRoutes,
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
];
