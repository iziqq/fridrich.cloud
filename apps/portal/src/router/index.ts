import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import { useAuthStore } from '@/stores/auth';

declare module 'vue-router' {
  interface RouteMeta {
    /** Vyžaduje přihlášení – nepřihlášený jde na `/prihlaseni`. */
    requiresAuth?: boolean;
    /** Jen pro nepřihlášené – přihlášeného nemá smysl posílat na login. */
    guestOnly?: boolean;
  }
}

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomeView },
  {
    path: '/projekty/:id',
    name: 'project',
    component: () => import('@/views/ProjectView.vue'),
  },
  {
    path: '/prihlaseni',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/registrace',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/zapomenute-heslo',
    name: 'forgot-password',
    component: () => import('@/views/ForgotPasswordView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/obnova-hesla',
    name: 'reset-password',
    component: () => import('@/views/ResetPasswordView.vue'),
  },
  {
    path: '/overeni-emailu',
    name: 'verify-email',
    component: () => import('@/views/VerifyEmailView.vue'),
  },
  {
    path: '/ucet',
    name: 'account',
    component: () => import('@/views/AccountView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition;
    // Kotva musí skončit pod plovoucí lištou, ne za ní.
    if (to.hash) return { el: to.hash, top: 96, behavior: 'smooth' };
    return { top: 0 };
  },
});

/*
 * Ochrana tras je jen pohodlí pro uživatele, ne bezpečnostní opatření –
 * data hlídá API, které bez platné session nic nevydá.
 */
router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth && !to.meta.guestOnly) return true;

  const auth = useAuthStore();
  await auth.load();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'account' };
  }

  return true;
});
