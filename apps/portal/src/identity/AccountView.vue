<script setup lang="ts">
import { INACTIVE_ACCOUNT_RETENTION_DAYS } from '@fridrich/shared';
import { ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import CyberButton from '@/components/CyberButton.vue';
import GlitchHeading from '@/components/GlitchHeading.vue';
import SectionLabel from '@/components/SectionLabel.vue';
import { ApiError } from '@/api/http';
import { projects } from '@/content/site';
import { useAuthStore } from './auth.store';

const auth = useAuthStore();
const router = useRouter();
const busy = ref(false);

/** Smazání je nevratné, takže má dva kroky: tlačítko a potom výslovné potvrzení. */
const deleteStep = ref<'idle' | 'confirm' | 'deleting' | 'deleted'>('idle');
const deleteError = ref('');
/** Adresa se po smazání z store vytratí – potvrzení ji ale ještě ukazuje. */
const deletedEmail = ref('');

async function signOut(): Promise<void> {
  busy.value = true;
  await auth.signOut();
  await router.push('/');
}

async function confirmDelete(): Promise<void> {
  deleteError.value = '';
  deleteStep.value = 'deleting';
  const email = auth.user?.email ?? '';

  try {
    await auth.closeAccount();
    deletedEmail.value = email;
    deleteStep.value = 'deleted';
  } catch (cause) {
    deleteStep.value = 'confirm';
    deleteError.value =
      cause instanceof ApiError ? cause.message : 'Účet se nepodařilo smazat. Zkuste to prosím znovu.';
  }
}
</script>

<template>
  <section class="page">
    <!-- Po smazání účtu už uživatel není přihlášený – zbývá jen potvrzení. -->
    <div v-if="deleteStep === 'deleted'" class="container">
      <SectionLabel text="// Účet smazán" />
      <GlitchHeading text="Účet je smazaný" :level="1" />
      <p class="mono ok done" role="status">
        &gt; Účet i data v aplikacích jsme smazali. Potvrzení odešlo na {{ deletedEmail }}.
      </p>
      <div class="actions">
        <RouterLink to="/" class="back mono">← Zpět na web</RouterLink>
      </div>
    </div>

    <div v-else class="container">
      <SectionLabel text="// Můj účet" />
      <GlitchHeading :text="auth.user?.displayName ?? 'Účet'" :level="1" />

      <dl class="details bevel-sm">
        <div>
          <dt class="mono">E-mail</dt>
          <dd>{{ auth.user?.email }}</dd>
        </div>
        <div>
          <dt class="mono">Stav</dt>
          <dd :class="auth.user?.emailVerified ? 'ok' : 'warn'">
            {{ auth.user?.emailVerified ? 'E-mail ověřen' : 'E-mail zatím neověřen' }}
          </dd>
        </div>
      </dl>

      <!-- Rozcestník do produktů – jeden účet platí na všech subdoménách. -->
      <h2 class="apps-title">Aplikace</h2>
      <ul class="apps">
        <li v-for="project in projects.items" :key="project.id" class="app bevel-sm">
          <div>
            <p class="name">{{ project.name }}</p>
            <p class="mono tagline">{{ project.tagline }}</p>
          </div>
          <a v-if="project.url" :href="project.url" class="open">Otevřít ↗</a>
          <span v-else class="mono soon">{{ project.statusLabel }}</span>
        </li>
      </ul>

      <div class="actions">
        <CyberButton variant="ghost" :disabled="busy" @click="signOut">
          {{ busy ? 'Odhlašuji…' : 'Odhlásit se' }}
        </CyberButton>
        <RouterLink to="/" class="back mono">← Zpět na web</RouterLink>
      </div>

      <!-- Právo na výmaz (čl. 17 GDPR) – uživatel si účet smaže sám, bez žádosti e-mailem. -->
      <section class="danger bevel-sm" aria-labelledby="delete-title">
        <h2 id="delete-title" class="danger-title">Smazat účet</h2>
        <p>
          Smaže se účet, přihlášení a všechna plánování v IziWeddy, která patří jen vám –
          včetně hostů a příprav. Ze sdíleného plánování budete odebráni a ostatním zůstane.
          Smazání je okamžité a nevratné.
        </p>
        <p class="note">
          Účet, do kterého se {{ INACTIVE_ACCOUNT_RETENTION_DAYS }} dní nepřihlásíte, smažeme
          automaticky – měsíc předem vás upozorníme e-mailem. Podrobnosti v
          <RouterLink to="/ochrana-osobnich-udaju">zásadách ochrany osobních údajů</RouterLink>.
        </p>

        <button
          v-if="deleteStep === 'idle'"
          type="button"
          class="danger-button"
          @click="deleteStep = 'confirm'"
        >
          Smazat účet
        </button>

        <div v-else class="confirm" role="group" aria-label="Potvrzení smazání účtu">
          <p class="mono warn">&gt; Opravdu smazat účet {{ auth.user?.email }} natrvalo?</p>
          <p v-if="deleteError" class="mono error" role="alert">&gt; {{ deleteError }}</p>
          <div class="confirm-actions">
            <button
              type="button"
              class="danger-button"
              :disabled="deleteStep === 'deleting'"
              @click="confirmDelete"
            >
              {{ deleteStep === 'deleting' ? 'Mažu účet…' : 'Ano, smazat natrvalo' }}
            </button>
            <CyberButton
              variant="ghost"
              :disabled="deleteStep === 'deleting'"
              @click="deleteStep = 'idle'"
            >
              Zrušit
            </CyberButton>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.page {
  padding-block: 10rem var(--section-gap);
}

.details {
  display: grid;
  gap: var(--space-2);
  margin-top: var(--space-4);
  padding: var(--space-3);
  border: 1px solid var(--cp-line);
  background: var(--cp-panel);
}

dt {
  color: var(--cp-cyan);
}

dd {
  margin: 0.25rem 0 0;
  overflow-wrap: anywhere;
}

.ok {
  color: var(--cp-green);
}

.warn {
  color: var(--cp-yellow);
}

.error {
  color: var(--cp-magenta);
}

.done {
  margin-top: var(--space-3);
}

.apps-title {
  margin-top: var(--space-6);
  font-size: var(--text-h3);
}

.apps {
  display: grid;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.app {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--cp-line);
  background: var(--cp-panel);
}

.name {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.tagline {
  color: var(--cp-muted);
}

.open {
  color: var(--cp-yellow);
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
}

.soon {
  color: var(--cp-cyan);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
  margin-top: var(--space-4);
}

.back {
  color: var(--cp-muted);
  text-decoration: none;
}

.back:hover {
  color: var(--cp-yellow);
}

/* --- Nebezpečná zóna: magenta = chyba a nevratná akce, žlutá zůstává jen pro hlavní CTA --- */

.danger {
  display: grid;
  gap: var(--space-2);
  max-width: 44rem;
  margin-top: var(--space-8);
  padding: var(--space-3);
  border: 1px solid color-mix(in srgb, var(--cp-magenta) 45%, var(--cp-line));
  background: var(--cp-panel);
}

.danger-title {
  color: var(--cp-magenta);
  font-size: var(--text-h3);
}

.danger p {
  color: var(--cp-muted);
}

.danger .note {
  font-size: 0.875rem;
}

.danger a {
  color: var(--cp-cyan);
}

.danger-button {
  justify-self: start;
  min-height: var(--touch-target);
  padding: 0.6rem 1.25rem;
  border: 1px solid var(--cp-magenta);
  background: transparent;
  color: var(--cp-magenta);
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    background var(--dur-fast) var(--ease),
    color var(--dur-fast) var(--ease);
}

.danger-button:hover:not(:disabled) {
  background: var(--cp-magenta);
  color: var(--cp-black);
}

.danger-button:disabled {
  opacity: 0.6;
  cursor: progress;
}

.confirm {
  display: grid;
  gap: var(--space-2);
}

.confirm .warn {
  color: var(--cp-text);
  overflow-wrap: anywhere;
}

.confirm-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

@media (--tablet) {
  .details {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
