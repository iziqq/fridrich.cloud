import type { User } from '@fridrich/shared';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { authApi } from '@/api';

/**
 * Základ adres portálu, kde se uživatel přihlašuje.
 *
 * Portál sedí ve stejném originu – v produkci v kořeni `www.fridrich.cloud`,
 * při vývoji přes proxy dev serveru portálu na `:5173`. Odkazy proto vyjdou
 * relativně a prázdný základ je správná výchozí hodnota. `VITE_PORTAL_URL`
 * zůstává únikovkou pro případ, že by aplikace běžela jinde.
 */
const PORTAL_URL = import.meta.env['VITE_PORTAL_URL'] ?? '';

/**
 * Přihlášený uživatel.
 *
 * IziWeddy vlastní přihlašovací formulář nemá – účet je společný pro celý
 * fridrich.cloud, takže se přesměrovává na portál. Session cookie platí
 * pro celou doménu včetně cesty `/izi-weddy`.
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
    // Na stejném originu stačí portálu cesta; s vlastním základem se musí
    // poslat celá adresa, jinak by se uživatel neměl kam vrátit.
    const back =
      PORTAL_URL === ''
        ? `${window.location.pathname}${window.location.search}`
        : window.location.href;

    window.location.assign(`${PORTAL_URL}/prihlaseni?redirect=${encodeURIComponent(back)}`);
  }

  async function logout(): Promise<void> {
    try {
      await authApi.logout();
    } finally {
      user.value = null;
      loaded.value = true;
      window.location.assign(PORTAL_URL === '' ? '/' : PORTAL_URL);
    }
  }

  return { user, loaded, isAuthenticated, load, redirectToLogin, logout, portalUrl: PORTAL_URL };
});
