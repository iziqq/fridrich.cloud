import type {
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  User,
} from '@fridrich/shared';
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
 * zjišťuje dotazem na `/api/auth/me`, ne čtením tokenu.
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

  async function login(credentials: LoginRequest): Promise<void> {
    user.value = await http.post<User>('/auth/login', credentials);
    loaded.value = true;
  }

  async function register(input: RegisterRequest): Promise<string> {
    const response = await http.post<MessageResponse>('/auth/register', input);
    return response.message;
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

  async function forgotPassword(input: ForgotPasswordRequest): Promise<string> {
    const response = await http.post<MessageResponse>('/auth/forgot-password', input);
    return response.message;
  }

  async function resetPassword(input: ResetPasswordRequest): Promise<void> {
    await http.post<void>('/auth/reset-password', input);
    user.value = null;
  }

  async function verifyEmail(token: string): Promise<void> {
    user.value = await http.post<User>('/auth/verify-email', { token });
  }

  return {
    user,
    loaded,
    isAuthenticated,
    load,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    verifyEmail,
  };
});

export { ApiError };
