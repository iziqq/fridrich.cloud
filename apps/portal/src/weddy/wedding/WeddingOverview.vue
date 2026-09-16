<script setup lang="ts">
import {
  PLANNING_CATEGORIES,
  canManageWeddingSettings,
  formatCurrency,
  type WeddingSummary,
} from '@fridrich/weddy-shared';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import { currentLocale } from '@/i18n';
import { weddyPath } from '@/weddy/routes';
import { useWeddingFormats } from './weddingFormats';

/**
 * Souhrn jednoho plánování na dashboardu.
 *
 * Kdo má jedinou svatbu, nepotřebuje rozcestník se seznamem o jedné položce –
 * vidí rovnou stav příprav a odtud skočí do záložky, kterou potřebuje.
 */
const props = defineProps<{ summary: WeddingSummary }>();

const { t } = useI18n();
const { countdown, formatDate } = useWeddingFormats();

const sectionTotal = PLANNING_CATEGORIES.length;

const decidedShare = computed(
  () => `${Math.round((props.summary.decidedSectionCount / sectionTotal) * 100)}%`,
);

/* Stejné rozcestí jako záložky v detailu – Nastavení jen pro admina. */
const links = computed(() => {
  const base = [
    { key: 'couple', icon: '💑', to: weddyPath(`/weddings/${props.summary.id}/couple`) },
    { key: 'guests', icon: '👥', to: weddyPath(`/weddings/${props.summary.id}/guests`) },
    { key: 'planning', icon: '📋', to: weddyPath(`/weddings/${props.summary.id}/planning`) },
    { key: 'budget', icon: '💰', to: weddyPath(`/weddings/${props.summary.id}/budget`) },
  ];

  if (!canManageWeddingSettings(props.summary.role)) return base;

  return [
    ...base,
    { key: 'settings', icon: '⚙️', to: weddyPath(`/weddings/${props.summary.id}/settings`) },
  ];
});
</script>

<template>
  <section class="overview">
    <header class="intro">
      <h1>{{ summary.title }}</h1>
      <p class="couple">{{ summary.groom.firstName }} &amp; {{ summary.bride.firstName }}</p>

      <p class="meta">
        <span>{{ formatDate(summary.weddingDate) }}</span>
        <span v-if="countdown(summary.daysUntilWedding)" class="countdown">
          {{ countdown(summary.daysUntilWedding) }}
        </span>
      </p>
    </header>

    <dl class="stats">
      <div class="stat card">
        <dt>{{ t('weddy.dashboard.stats.guests') }}</dt>
        <dd>
          <span class="value">{{ summary.acceptedGuestCount }} / {{ summary.guestCount }}</span>
          <span class="hint">{{ t('weddy.dashboard.stats.guestsHint') }}</span>
        </dd>
      </div>

      <div class="stat card">
        <dt>{{ t('weddy.dashboard.stats.budget') }}</dt>
        <dd>
          <span class="value">{{ formatCurrency(summary.budgetTotal, currentLocale) }}</span>
          <span class="hint">{{ t('weddy.dashboard.stats.budgetHint') }}</span>
        </dd>
      </div>

      <div class="stat card">
        <dt>{{ t('weddy.dashboard.stats.sections') }}</dt>
        <dd>
          <span class="value">{{ summary.decidedSectionCount }} / {{ sectionTotal }}</span>
          <span
            class="bar"
            role="img"
            :aria-label="
              t('weddy.dashboard.stats.sectionsProgress', {
                decided: summary.decidedSectionCount,
                total: sectionTotal,
              })
            "
          >
            <span class="fill" :style="{ width: decidedShare }"></span>
          </span>
        </dd>
      </div>
    </dl>

    <nav class="links" :aria-label="t('weddy.layout.sections')">
      <RouterLink v-for="link in links" :key="link.key" :to="link.to" class="link card">
        <span class="link-icon" aria-hidden="true">{{ link.icon }}</span>
        <span>{{ t(`weddy.layout.tabs.${link.key}`) }}</span>
      </RouterLink>
    </nav>
  </section>
</template>

<style scoped>
.overview {
  display: grid;
  gap: var(--space-2);
}

.intro {
  padding: var(--space-4) var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: linear-gradient(180deg, var(--rose-50), var(--sand-50));
  text-align: center;
}

h1 {
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 1.25rem + 2.5vw, 2.5rem);
  line-height: 1.15;
}

/* Globální `p` má max-width 70ch – bez `auto` by odstavec seděl vlevo, ne na střed. */
.couple {
  margin: 0.15rem auto 0;
  color: var(--rose-700);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  margin: var(--space-1) auto 0;
  color: var(--color-muted);
  font-size: var(--text-sm);
}

.countdown {
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: var(--rose-100);
  color: var(--rose-700);
  font-size: var(--text-xs);
  font-weight: 600;
}

.stats {
  display: grid;
  gap: var(--space-2);
}

.stat {
  display: grid;
  gap: 0.35rem;
}

dt {
  color: var(--color-muted);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

dd {
  display: grid;
  gap: 0.35rem;
  margin: 0;
}

.value {
  font-family: var(--font-display);
  font-size: 1.625rem;
  font-weight: 600;
  line-height: 1.1;
}

.hint {
  color: var(--color-muted);
  font-size: var(--text-xs);
}

.bar {
  overflow: hidden;
  height: 0.4rem;
  border-radius: 999px;
  background: var(--sand-100);
}

.fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--sage-500);
}

.links {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
}

.link {
  display: grid;
  gap: 0.25rem;
  place-items: center;
  min-height: 5rem;
  color: inherit;
  font-weight: 600;
  text-align: center;
  text-decoration: none;
  transition:
    border-color var(--dur-fast) var(--ease),
    transform var(--dur-fast) var(--ease);
}

.link:hover {
  border-color: var(--rose-400);
  color: var(--color-accent);
  transform: translateY(-1px);
}

.link-icon {
  font-size: 1.5rem;
}

/* Lichý počet odkazů (admin jich má pět) – poslední zabere celý řádek. */
.link:last-child:nth-child(odd) {
  grid-column: span 2;
}

@media (--tablet) {
  .intro {
    padding: var(--space-6) var(--space-4);
  }

  .stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .links {
    /* Čtyři odkazy, nebo pět s Nastavením – šířku dopočítá auto-columns. */
    grid-auto-flow: column;
    grid-auto-columns: minmax(0, 1fr);
  }

  .link:last-child:nth-child(odd) {
    grid-column: auto;
  }
}
</style>
