import type { User } from '@fridrich/shared';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { deleteAccount } from './endpoints/deleteAccount.endpoint';
import { getCurrentUser } from './endpoints/getCurrentUser.endpoint';
import { logout } from './endpoints/logout.endpoint';
import { verifyEmail } from './endpoints/verifyEmail.endpoint';
import { verifyLoginCode, type VerifyLoginCodeRequest } from './endpoints/verifyLoginCode.endpoint';

/**
 * Přihlášený uživatel – sdílený stav domény identity.
 *
 * Session drží httpOnly cookie, kterou JavaScript nepřečte – stav se proto
 * zjišťuje dotazem na `/api/auth/me`, ne čtením tokenu. Store drží jen akce,
 * které přihlášení mění; registraci a vyžádání kódu volají obrazovky rovnou
 * přes endpoint, protože stav nemění.
 */
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const loaded = ref(false);
  let pending: Promise<void> | undefined;

  const isAuthenticated = computed(() => user.value !== null);

  /** Načte přihlášeného uživatele; souběžná volání sdílí jeden požadavek. */
  async function load(): Promise<void> {
    if (loaded.value) return;
    pending ??= (async () => {
      try {
        user.value = await getCurrentUser();
      } catch {
        // 401 je běžný stav, ne chyba – uživatel prostě není přihlášený.
        user.value = null;
      } finally {
        loaded.value = true;
        pending = undefined;
      }
    })();

    return pending;
  }

  /** Druhý krok přihlášení – ověří opsaný kód a založí session. */
  async function signInWithCode(request: VerifyLoginCodeRequest): Promise<void> {
    user.value = await verifyLoginCode(request);
    loaded.value = true;
  }

  /** Aktivace účtu z odkazu v e-mailu – zároveň přihlašuje. */
  async function activateAccount(token: string): Promise<void> {
    user.value = await verifyEmail({ token });
    loaded.value = true;
  }

  async function signOut(): Promise<void> {
    try {
      await logout();
    } finally {
      // I když volání selže, lokálně uživatele odhlásíme.
      user.value = null;
      loaded.value = true;
    }
  }

  /**
   * Zrušení účtu z nastavení. Na rozdíl od odhlášení se při chybě uživatel
   * lokálně neodhlašuje – musí vidět, že se účet nesmazal, a zkusit to znovu.
   */
  async function closeAccount(): Promise<void> {
    await deleteAccount();
    user.value = null;
    loaded.value = true;
  }

  return {
    user,
    loaded,
    isAuthenticated,
    load,
    signInWithCode,
    activateAccount,
    signOut,
    closeAccount,
  };
});
