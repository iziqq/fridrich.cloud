<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import { weddyPath } from '@/weddy/routes';

/**
 * Uvítání pro uživatele, který ještě nemá žádné plánování.
 *
 * Místo holé hlášky „nic tu není" ukazuje, co plánovač umí – čtyři dlaždice
 * odpovídají záložkám v detailu svatby, takže po založení plánování už je
 * navigace známá.
 */
const { t } = useI18n();

const features = [
  { key: 'couple', icon: '💑' },
  { key: 'guests', icon: '👥' },
  { key: 'planning', icon: '📋' },
  { key: 'budget', icon: '💰' },
] as const;
</script>

<template>
  <section class="welcome">
    <p class="mark" aria-hidden="true">💍</p>

    <div class="intro">
      <h1>{{ t('weddy.dashboard.welcome.title') }}</h1>
      <p class="lead">{{ t('weddy.dashboard.welcome.lead') }}</p>
    </div>

    <div class="action">
      <RouterLink :to="weddyPath('/weddings/new')" class="btn btn-primary cta">
        {{ t('weddy.dashboard.welcome.cta') }}
      </RouterLink>
      <p class="note">{{ t('weddy.dashboard.welcome.note') }}</p>
    </div>

    <ul class="features">
      <li v-for="feature in features" :key="feature.key" class="feature card">
        <p class="icon" aria-hidden="true">{{ feature.icon }}</p>
        <h2>{{ t(`weddy.dashboard.welcome.features.${feature.key}.title`) }}</h2>
        <p class="text">{{ t(`weddy.dashboard.welcome.features.${feature.key}.text`) }}</p>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.welcome {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: linear-gradient(180deg, var(--rose-50), var(--sand-50));
  text-align: center;
}

.mark {
  display: grid;
  place-items: center;
  width: 3.75rem;
  height: 3.75rem;
  margin-inline: auto;
  border-radius: 999px;
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  font-size: 1.75rem;
}

h1 {
  font-family: var(--font-display);
  /* Od mobilu po notebook plynule – bez dalšího breakpointu. */
  font-size: clamp(1.75rem, 1.25rem + 2.5vw, 2.5rem);
  line-height: 1.15;
}

.lead {
  margin: var(--space-1) auto 0;
  max-width: 46ch;
  color: var(--color-muted);
}

.cta {
  min-width: min(100%, 16rem);
}

/* Globální `p` má max-width 70ch, takže bez `auto` by text seděl vlevo. */
.note {
  margin: 0.5rem auto 0;
  color: var(--color-muted);
  font-size: var(--text-xs);
}

.features {
  display: grid;
  gap: var(--space-2);
  text-align: left;
}

.feature {
  /* Karty v řádku musí být stejně vysoké, i když má popisek jiný počet řádků. */
  display: grid;
  align-content: start;
  gap: 0.15rem;
  background: color-mix(in srgb, var(--color-surface) 80%, transparent);
}

.icon {
  font-size: 1.375rem;
}

.feature h2 {
  font-size: 1.0625rem;
}

.text {
  color: var(--color-muted);
  font-size: var(--text-sm);
}

@media (--tablet) {
  .welcome {
    padding: var(--space-6) var(--space-4) var(--space-4);
  }

  .features {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (--notebook) {
  .features {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
