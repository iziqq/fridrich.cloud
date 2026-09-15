<script setup lang="ts">
import { formatCurrency } from '@fridrich/weddy-shared';
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRouter } from 'vue-router';
import LocaleSwitcher from '@/components/LocaleSwitcher.vue';
import { currentLocale, translateMessage } from '@/i18n';
import EmptyState from '@/weddy/components/EmptyState.vue';
import ErrorBlock from '@/weddy/components/ErrorBlock.vue';
import LoadingBlock from '@/weddy/components/LoadingBlock.vue';
import { useAuthStore } from '@/identity/auth.store';
import { weddyPath } from '@/weddy/routes';
import { useWeddingStore } from './wedding.store';

const { t } = useI18n();
const weddings = useWeddingStore();
const auth = useAuthStore();
const router = useRouter();

/* Po odhlášení nemá plánovač co zobrazit, tak se jde na portál. */
async function signOut(): Promise<void> {
  await auth.signOut();
  await router.push('/');
}

onMounted(() => weddings.loadList());

/** Popisek odpočtu – po svatbě má znít jinak než před ní. */
function countdown(days: number | undefined): string | undefined {
  if (days === undefined) return undefined;
  if (days === 0) return t('weddy.dashboard.today');
  if (days < 0) return t('weddy.dashboard.daysAgo', Math.abs(days));
  return t('weddy.dashboard.daysLeft', days);
}

/* Formát data podle jazyka rozhraní – čtení `currentLocale` zajistí překreslení po přepnutí. */
function formatDate(iso: string | undefined): string {
  if (!iso) return t('weddy.dashboard.noDate');
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(currentLocale.value, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
</script>

<template>
  <main id="obsah" class="dashboard">
    <header class="head container">
      <div>
        <p class="hello">{{ auth.user?.displayName }}</p>
        <h1>{{ t('weddy.dashboard.title') }}</h1>
      </div>
      <!-- Plánovač nemá navigaci portálu, jazyk se proto přepíná přímo tady. -->
      <div class="head-actions">
        <LocaleSwitcher />
        <button type="button" class="btn btn-ghost sign-out" @click="signOut">
          {{ t('weddy.dashboard.signOut') }}
        </button>
      </div>
    </header>

    <div class="container">
      <LoadingBlock v-if="weddings.loading && weddings.summaries.length === 0" />
      <ErrorBlock v-else-if="weddings.error" :message="translateMessage(weddings.error)" />

      <EmptyState
        v-else-if="weddings.summaries.length === 0"
        icon="💍"
        :title="t('weddy.dashboard.emptyTitle')"
        :description="t('weddy.dashboard.emptyDescription')"
      >
        <RouterLink :to="weddyPath('/weddings/new')" class="btn btn-primary">{{ t('weddy.dashboard.add') }}</RouterLink>
      </EmptyState>

      <ul v-else class="list">
        <li v-for="wedding in weddings.summaries" :key="wedding.id">
          <RouterLink :to="weddyPath(`/weddings/${wedding.id}/couple`)" class="card wedding">
            <div class="title-row">
              <h2>{{ wedding.title }}</h2>
              <span v-if="countdown(wedding.daysUntilWedding)" class="countdown">
                {{ countdown(wedding.daysUntilWedding) }}
              </span>
            </div>

            <p class="couple">
              {{ wedding.groom.firstName }} &amp; {{ wedding.bride.firstName }}
            </p>
            <p class="date">{{ formatDate(wedding.weddingDate) }}</p>

            <dl class="stats">
              <div>
                <dt>{{ t('weddy.dashboard.stats.guests') }}</dt>
                <dd>{{ wedding.acceptedGuestCount }} / {{ wedding.guestCount }}</dd>
              </div>
              <div>
                <dt>{{ t('weddy.dashboard.stats.budget') }}</dt>
                <dd>{{ formatCurrency(wedding.budgetTotal, currentLocale) }}</dd>
              </div>
            </dl>
          </RouterLink>
        </li>
      </ul>

      <RouterLink v-if="weddings.summaries.length > 0" :to="weddyPath('/weddings/new')" class="btn btn-primary add">
        {{ t('weddy.dashboard.add') }}
      </RouterLink>
    </div>
  </main>
</template>

<style scoped>
.dashboard {
  padding-block: var(--space-3) var(--space-8);
}

.head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.hello {
  color: var(--color-muted);
  font-size: 0.875rem;
}

.head h1 {
  font-size: 1.75rem;
}

.head-actions {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.sign-out {
  font-size: 0.875rem;
}

.list {
  display: grid;
  gap: var(--space-2);
}

.wedding {
  display: block;
  color: inherit;
  text-decoration: none;
  transition:
    border-color var(--dur-fast) var(--ease),
    transform var(--dur-fast) var(--ease);
}

.wedding:hover {
  border-color: var(--rose-400);
  transform: translateY(-1px);
}

.title-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: baseline;
  justify-content: space-between;
}

.title-row h2 {
  font-size: 1.375rem;
}

.countdown {
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  background: var(--rose-100);
  color: var(--rose-700);
  font-size: 0.75rem;
  font-weight: 600;
}

.couple {
  margin-top: 0.15rem;
  color: var(--color-text);
}

.date {
  color: var(--color-muted);
  font-size: 0.875rem;
}

.stats {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-border);
}

dt {
  color: var(--color-muted);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

dd {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
}

.add {
  margin-top: var(--space-3);
}

@media (--tablet) {
  .list {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
