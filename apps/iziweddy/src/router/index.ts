import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import WeddingLayout from '@/layouts/WeddingLayout.vue';
import DashboardView from '@/views/DashboardView.vue';
import { useAuthStore } from '@/stores/auth';
import { useWeddingsStore } from '@/stores/weddings';

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'dashboard', component: DashboardView },
  {
    path: '/weddings/new',
    name: 'wedding-new',
    component: () => import('@/views/WeddingNewView.vue'),
  },
  {
    path: '/weddings/:weddingId',
    component: WeddingLayout,
    children: [
      { path: '', redirect: (to) => `/weddings/${to.params['weddingId']}/couple` },
      {
        path: 'couple',
        name: 'couple',
        component: () => import('@/views/CoupleView.vue'),
      },
      {
        path: 'guests',
        name: 'guests',
        component: () => import('@/views/GuestsView.vue'),
      },
      {
        path: 'planning',
        name: 'planning',
        component: () => import('@/views/PlanningView.vue'),
      },
      {
        path: 'planning/:category',
        name: 'planning-category',
        component: () => import('@/views/PlanningCategoryView.vue'),
      },
      {
        path: 'budget',
        name: 'budget',
        component: () => import('@/views/BudgetView.vue'),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: (_to, _from, savedPosition) => savedPosition ?? { top: 0 },
});

/*
 * Bez přihlášení nemá aplikace co zobrazit, takže se rovnou jde na portál.
 * Data stejně hlídá API – tohle je jen pohodlí, ne ochrana.
 */
router.beforeEach(async (to) => {
  const auth = useAuthStore();
  await auth.load();

  if (!auth.isAuthenticated) {
    auth.redirectToLogin();
    return false;
  }

  // Detail svatby potřebuje název do hlavičky i data do formuláře snoubenců.
  const weddingId = to.params['weddingId'];
  if (typeof weddingId === 'string' && weddingId !== '') {
    await useWeddingsStore().loadOne(weddingId);
  }

  return true;
});
