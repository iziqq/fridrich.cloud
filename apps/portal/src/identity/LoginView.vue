<script setup lang="ts">
import { LOGIN_CODE_LENGTH } from '@fridrich/shared';
import { computed, nextTick, ref, useTemplateRef } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import AuthCard from '@/components/AuthCard.vue';
import AuthField from '@/components/AuthField.vue';
import CyberButton from '@/components/CyberButton.vue';
import { ApiError } from '@/api/http';
import { useAuthStore } from './auth.store';
import { requestLoginCode } from './endpoints/requestLoginCode.endpoint';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

/** Přihlášení má dva kroky: nejdřív e-mail, pak kód, který na něj přišel. */
const step = ref<'email' | 'code'>('email');

const email = ref('');
const code = ref('');
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
        : 'Nepodařilo se odeslat kód. Zkuste to znovu.';
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
        : 'Přihlášení selhalo. Zkuste to prosím znovu.';
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
  <AuthCard label="// Přihlášení" title="Přihlásit se">
    <form v-if="step === 'email'" novalidate @submit.prevent="requestCode">
      <p class="lead">
        Zadejte e-mail a pošleme na něj {{ LOGIN_CODE_LENGTH }}místný kód. Heslo
        nepotřebujete – žádné u nás nemáte.
      </p>

      <AuthField v-model="email" label="E-mail" type="email" autocomplete="email" />

      <p v-if="error" class="error mono" role="alert">&gt; {{ error }}</p>

      <CyberButton type="submit" :disabled="busy">
        {{ busy ? 'Odesílám…' : 'Poslat kód' }}
      </CyberButton>
    </form>

    <form v-else novalidate @submit.prevent="submitCode">
      <p class="lead">
        Pokud je účet na <strong>{{ maskedEmail }}</strong> založený, přišel na něj
        kód. Platí 10 minut.
      </p>

      <AuthField
        ref="codeField"
        v-model="code"
        label="Kód z e-mailu"
        autocomplete="one-time-code"
        inputmode="numeric"
        :maxlength="LOGIN_CODE_LENGTH"
        code
      />

      <p v-if="error" class="error mono" role="alert">&gt; {{ error }}</p>

      <CyberButton type="submit" :disabled="busy">
        {{ busy ? 'Přihlašuji…' : 'Přihlásit se' }}
      </CyberButton>

      <button type="button" class="link mono" @click="changeEmail">
        &lt; zadat jiný e-mail
      </button>
    </form>

    <template #footer>
      <p>Ještě nemáte účet? <RouterLink to="/registrace">Zaregistrujte se</RouterLink></p>
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
  color: var(--cp-muted);
}

.lead strong {
  color: var(--cp-text);
  word-break: break-all;
}

.error {
  color: var(--cp-magenta);
}

.link {
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: none;
  color: var(--cp-muted);
  cursor: pointer;
}

.link:hover {
  color: var(--cp-cyan);
}
</style>
