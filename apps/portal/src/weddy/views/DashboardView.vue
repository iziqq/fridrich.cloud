<script setup lang="ts">
import { formatCurrency } from '@fridrich/weddy-shared';
import { onMounted } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import EmptyState from '@/weddy/components/EmptyState.vue';
import ErrorBlock from '@/weddy/components/ErrorBlock.vue';
import LoadingBlock from '@/weddy/components/LoadingBlock.vue';
import { useAuthStore } from '@/stores/auth';
import { useWeddingsStore } from '@/weddy/stores/weddings';
import { weddyPath } from '@/weddy/routes';

const weddings = useWeddingsStore();
const auth = useAuthStore();
const router = useRouter();

/* Po odhlášení nemá plánovač co zobrazit, tak se jde na portál. */
async function signOut(): Promise<void> {
  await auth.logout();
  await router.push('/');
}

onMounted(() => weddings.loadList());

/** Popisek odpočtu – po svatbě má znít jinak než před ní. */
function countdown(days: number | undefined): string | undefined {
  if (days === undefined) return undefined;
  if (days === 0) return 'Dnes je ten den!';
  if (days < 0) return `Před ${Math.abs(days)} dny`;
  return `Zbývá ${days} dní`;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return 'Datum zatím není';
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('cs-CZ', {
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
        <h1>Vaše plánování</h1>
      </div>
      <button type="button" class="btn btn-ghost sign-out" @click="signOut">
        Odhlásit se
      </button>
    </header>

    <div class="container">
      <LoadingBlock v-if="weddings.loading && weddings.summaries.length === 0" />
      <ErrorBlock v-else-if="weddings.error" :message="weddings.error" />

      <EmptyState
        v-else-if="weddings.summaries.length === 0"
        icon="💍"
        title="Zatím tu nic není"
        description="Založte první plánování a začněte skládat svatbu dohromady."
      >
        <RouterLink :to="weddyPath('/weddings/new')" class="btn btn-primary">Přidat plánování</RouterLink>
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
                <dt>Hosté</dt>
                <dd>{{ wedding.acceptedGuestCount }} / {{ wedding.guestCount }}</dd>
              </div>
              <div>
                <dt>Rozpočet</dt>
                <dd>{{ formatCurrency(wedding.budgetTotal) }}</dd>
              </div>
            </dl>
          </RouterLink>
        </li>
      </ul>

      <RouterLink v-if="weddings.summaries.length > 0" :to="weddyPath('/weddings/new')" class="btn btn-primary add">
        Přidat plánování
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

@media (min-width: 720px) {
  .list {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
