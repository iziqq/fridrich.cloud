import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { routes } from './routes';

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
