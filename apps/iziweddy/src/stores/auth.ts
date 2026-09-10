import type { User } from '@fridrich/shared';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { authApi } from '@/api';

/** Adresa portálu, kde se uživatel přihlašuje. */
const PORTAL_URL = import.meta.env['VITE_PORTAL_URL'] ?? 'http://localhost:5173';

/**
 * Přihlášený uživatel.
 *
 * IziWeddy vlastní přihlašovací formulář nemá – účet je společný pro celý
 * fridrich.cloud, takže se přesměrovává na portál. Session cookie platí
 * i na subdoméně produktu.
 */
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const loaded = ref(false);
  let pending: Promise<void> | undefined;

  const isAuthenticated = computed(() => user.value !== null);

  async function load(): Promise<void> {
    if (loaded.value) return;
    pending ??= (async () => {
      try {
        user.value = await authApi.me();
      } catch {
        // 401 je běžný stav, ne chyba.
        user.value = null;
      } finally {
        loaded.value = true;
        pending = undefined;
      }
    })();

    return pending;
  }

  /** Pošle uživatele na portál a po přihlášení ho vrátí zpátky sem. */
  function redirectToLogin(): void {
    const back = encodeURIComponent(window.location.href);
    window.location.assign(`${PORTAL_URL}/prihlaseni?redirect=${back}`);
  }

  async function logout(): Promise<void> {
    try {
      await authApi.logout();
    } finally {
      user.value = null;
      loaded.value = true;
      window.location.assign(PORTAL_URL);
    }
  }

  return { user, loaded, isAuthenticated, load, redirectToLogin, logout, portalUrl: PORTAL_URL };
});
