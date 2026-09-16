<script setup lang="ts">
import { LOCALES, type Locale } from '@fridrich/shared';
import { useI18n } from 'vue-i18n';
import { currentLocale, setLocale } from '@/i18n';

/*
 * Přepínač jazyka – CZ | EN.
 *
 * Používá jen sémantické tokeny (`--color-*`), které definuje portál i téma
 * IziWeddy, takže stejná komponenta sedí do cyberpunkové navigace i do
 * světlého plánovače. Volba se pamatuje v prohlížeči; přihlášenému uživateli
 * ji API uloží k účtu při nejbližším požadavku (hlavička Accept-Language).
 */

const { t } = useI18n();

function choose(locale: Locale): void {
  if (locale !== currentLocale.value) setLocale(locale);
}
</script>

<template>
  <div class="locale-switcher" role="group" :aria-label="t('app.locale.label')">
    <button
      v-for="locale in LOCALES"
      :key="locale"
      type="button"
      class="option"
      :class="{ active: locale === currentLocale }"
      :aria-pressed="locale === currentLocale"
      :lang="locale"
      :title="t(`app.locale.${locale}`)"
      @click="choose(locale)"
    >
      {{ t(`app.locale.short.${locale}`) }}
    </button>
  </div>
</template>

<style scoped>
.locale-switcher {
  display: inline-flex;
  align-items: center;
}

.option {
  min-width: var(--touch-target);
  min-height: var(--touch-target);
  padding-inline: 0.25rem;
  border: 0;
  background: transparent;
  color: var(--color-muted);
  font: inherit;
  font-size: var(--text-xs);
  font-weight: 600;
  cursor: pointer;
  transition: color var(--dur-fast) var(--ease);
}

.option:hover {
  color: var(--color-text);
}

.option.active {
  color: var(--color-accent);
  cursor: default;
}
</style>
