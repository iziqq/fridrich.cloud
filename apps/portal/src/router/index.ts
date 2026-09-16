import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/identity/auth.store';
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
 * Vizitka se přestěhovala z úvodní stránky na `/o-mne`, ale odkazy s kotvou
 * (`/#sluzby`, `/#kontakt`) žijí dál v e-mailech i ve vyhledávačích. Kotva
 * není součástí cesty, takže ji `redirect` v routě nechytí – řeší se tady.
 */
const MOVED_SECTIONS = ['#o-mne', '#sluzby', '#vyvoj', '#projekty', '#kontakt'];

router.beforeEach((to) => {
  if (to.path === '/' && MOVED_SECTIONS.includes(to.hash)) {
    return { path: '/o-mne', hash: to.hash };
  }

  return true;
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
