import type { LoginCodeRequest, LoginRequest, RegisterRequest, User } from '@fridrich/shared';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { ApiError, http } from '@/api/client';

interface MessageResponse {
  message: string;
}

/**
 * Přihlášený uživatel.
 *
 * Session drží httpOnly cookie, kterou JavaScript nepřečte – stav se proto
 * zjišťuje dotazem na `/api/auth/me`, ne čtením tokenu. Hesla v systému
 * nejsou: totožnost prokazuje přístup ke schránce, ať už odkazem
 * z registrace, nebo kódem při přihlášení.
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
        user.value = await http.get<User>('/auth/me');
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

  async function register(input: RegisterRequest): Promise<string> {
    const response = await http.post<MessageResponse>('/auth/register', input);
    return response.message;
  }

  /** První krok přihlášení – nechá si poslat kód na e-mail. */
  async function requestLoginCode(input: LoginRequest): Promise<string> {
    const response = await http.post<MessageResponse>('/auth/login', input);
    return response.message;
  }

  /** Druhý krok přihlášení – ověří opsaný kód a založí session. */
  async function submitLoginCode(input: LoginCodeRequest): Promise<void> {
    user.value = await http.post<User>('/auth/login/verify', input);
    loaded.value = true;
  }

  async function logout(): Promise<void> {
    try {
      await http.post<void>('/auth/logout', {});
    } finally {
      // I když volání selže, lokálně uživatele odhlásíme.
      user.value = null;
      loaded.value = true;
    }
  }

  /** Aktivace účtu z odkazu v e-mailu – zároveň přihlašuje. */
  async function verifyEmail(token: string): Promise<void> {
    user.value = await http.post<User>('/auth/verify-email', { token });
    loaded.value = true;
  }

  return {
    user,
    loaded,
    isAuthenticated,
    load,
    register,
    requestLoginCode,
    submitLoginCode,
    logout,
    verifyEmail,
  };
});

export { ApiError };
