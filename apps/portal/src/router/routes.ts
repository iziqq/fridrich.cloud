import { PERSONAL_DATA_COLLECTION_ENABLED } from '@fridrich/shared';
import type { RouteRecordRaw } from 'vue-router';
import AppsView from '@/views/AppsView.vue';
import { budgyRoutes } from '@/budgy/routes';
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

/**
 * Obrazovky, které od návštěvníka berou osobní údaje – registrace, přihlášení,
 * účet, celé IziWeddy a IziBudgy (rozpočet domácnosti je citlivý údaj). Bez zásad ochrany osobních údajů se vůbec nezaregistrují,
 * takže přímá adresa skončí na 404 (viz `PERSONAL_DATA_COLLECTION_ENABLED`).
 */
const personalDataRoutes: RouteRecordRaw[] = [
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
  ...budgyRoutes,
];

/** Routy zvlášť od routeru, ať jdou vyzkoušet i bez prohlížeče. */
export const routes: RouteRecordRaw[] = [
  // Úvod je rozcestník aplikací; vizitka má vlastní stránku jako produkty.
  { path: '/', name: 'home', component: AppsView },
  { path: '/o-mne', name: 'about', component: () => import('@/views/AboutView.vue') },
  {
    path: '/projekty/:id',
    name: 'project',
    component: () => import('@/views/ProjectView.vue'),
  },
  // Právní dokumenty platí i s vypnutým sběrem údajů – popisují, co se děje s daty už uloženými.
  {
    path: '/ochrana-osobnich-udaju',
    name: 'privacy',
    component: () => import('@/views/LegalView.vue'),
    props: { document: 'privacy' },
  },
  {
    path: '/obchodni-podminky',
    name: 'terms',
    component: () => import('@/views/LegalView.vue'),
    props: { document: 'terms' },
  },
  ...(PERSONAL_DATA_COLLECTION_ENABLED ? personalDataRoutes : []),
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
];
