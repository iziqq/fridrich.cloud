<script setup lang="ts">
import { LOGIN_CODE_LENGTH } from '@fridrich/shared';
import { computed, nextTick, ref, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import AuthCard from '@/components/AuthCard.vue';
import AuthField from '@/components/AuthField.vue';
import AppButton from '@/components/AppButton.vue';
import { ApiError } from '@/api/http';
import { translateMessage } from '@/i18n';
import { useAuthStore } from './auth.store';
import { requestLoginCode } from './endpoints/requestLoginCode.endpoint';

const { t } = useI18n();
const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

/** Přihlášení má dva kroky: nejdřív e-mail, pak kód, který na něj přišel. */
const step = ref<'email' | 'code'>('email');

const email = ref('');
const code = ref('');
/** Klíč hlášky – překládá se až při vykreslení, ať se přepne i se změnou jazyka. */
const error = ref('');
const busy = ref(false);
const codeField = useTemplateRef<InstanceType<typeof AuthField>>('codeField');

const maskedEmail = computed(() => email.value.trim().toLowerCase());

/*
 * Cíl návratu přichází z URL, takže ho určuje ten, kdo odkaz poslal. Bez
 * kontroly by z přihlašovací stránky šlo udělat odrazový můstek na cizí web,
 * proto projde jen adresa na tomhle webu – při vývoji navíc localhost,
 * kde produkty běží na vlastním portu.
 */
function safeTarget(raw: unknown): string {
  if (typeof raw !== 'string' || raw === '') return '/ucet';

  // `//host` vypadá jako cesta, ale je to absolutní adresa na cizí doménu.
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw;

  try {
    const url = new URL(raw);
    const allowed =
      url.origin === window.location.origin ||
      (import.meta.env.DEV && url.hostname === 'localhost');

    if (allowed) return url.href;
  } catch {
    // není to platná adresa – níž se použije výchozí cíl
  }

  return '/ucet';
}

async function requestCode(): Promise<void> {
  error.value = '';
  busy.value = true;

  try {
    await requestLoginCode({ email: maskedEmail.value });
    step.value = 'code';
    // Kurzor rovnou do pole pro kód, ať se uživatel nemusí trefovat.
    await nextTick();
    codeField.value?.$el.querySelector('input')?.focus();
  } catch (cause) {
    error.value =
      cause instanceof ApiError
        ? (cause.fieldErrors['email'] ?? cause.message)
        : 'identity.login.sendFailed';
  } finally {
    busy.value = false;
  }
}

async function submitCode(): Promise<void> {
  error.value = '';
  busy.value = true;

  try {
    await auth.signInWithCode({ email: maskedEmail.value, code: code.value });

    // Po přihlášení zpět tam, odkud uživatel přišel. Produkty (`/izi-weddy`, …)
    // jsou sice na stejné doméně, ale router portálu je nezná – tam se musí
    // celou stránkou, jinak by uživatel skončil na chybové stránce portálu.
    const target = safeTarget(route.query['redirect']);

    if (target.startsWith('/') && router.resolve(target).name !== 'not-found') {
      await router.replace(target);
    } else {
      window.location.assign(target);
    }
  } catch (cause) {
    // Chyba kódu chodí jako detail u pole `code`, ostatní jako obecná hláška.
    error.value =
      cause instanceof ApiError
        ? (cause.fieldErrors['code'] ?? cause.message)
        : 'identity.login.signInFailed';
    code.value = '';
  } finally {
    busy.value = false;
  }
}

/** Návrat na první krok, když si uživatel spletl adresu. */
function changeEmail(): void {
  step.value = 'email';
  code.value = '';
  error.value = '';
}
</script>

<template>
  <AuthCard :label="t('identity.login.label')" :title="t('identity.login.title')">
    <form v-if="step === 'email'" novalidate @submit.prevent="requestCode">
      <p class="lead">
        {{ t('identity.login.emailLead', { length: LOGIN_CODE_LENGTH }) }}
      </p>

      <AuthField v-model="email" :label="t('identity.email')" type="email" autocomplete="email" />

      <p v-if="error" class="error" role="alert">{{ translateMessage(error) }}</p>

      <AppButton type="submit" :disabled="busy">
        {{ busy ? t('identity.login.sending') : t('identity.login.sendCode') }}
      </AppButton>
    </form>

    <form v-else novalidate @submit.prevent="submitCode">
      <i18n-t keypath="identity.login.codeLead" tag="p" class="lead">
        <template #email>
          <strong>{{ maskedEmail }}</strong>
        </template>
      </i18n-t>

      <AuthField
        ref="codeField"
        v-model="code"
        :label="t('identity.login.codeLabel')"
        autocomplete="one-time-code"
        inputmode="numeric"
        :maxlength="LOGIN_CODE_LENGTH"
        code
      />

      <p v-if="error" class="error" role="alert">{{ translateMessage(error) }}</p>

      <AppButton type="submit" :disabled="busy">
        {{ busy ? t('identity.login.signingIn') : t('identity.login.signIn') }}
      </AppButton>

      <button type="button" class="link mono" @click="changeEmail">
        &lt; {{ t('identity.login.changeEmail') }}
      </button>
    </form>

    <template #footer>
      <i18n-t keypath="identity.login.noAccount" tag="p">
        <template #link>
          <RouterLink to="/registrace">{{ t('identity.login.registerLink') }}</RouterLink>
        </template>
      </i18n-t>
    </template>
  </AuthCard>
</template>

<style scoped>
form {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.lead {
  color: var(--color-muted);
}

.lead strong {
  color: var(--color-text);
  word-break: break-all;
}

.error {
  color: var(--color-danger);
}

.link {
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-muted);
  cursor: pointer;
}

.link:hover {
  color: var(--color-accent-soft);
}
</style>
