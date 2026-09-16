<script setup lang="ts">
import AppButton from '@/components/AppButton.vue';
import { useI18n } from 'vue-i18n';
import { hero } from '@/content/site';

const { t } = useI18n();
</script>

<template>
  <section class="hero" aria-labelledby="hero-title">
    <!-- Záře za nadpisem – sklo panelu níž má co rozostřit. -->
    <div class="halo" aria-hidden="true"></div>

    <div class="container inner">
      <p class="mono eyebrow">{{ hero.eyebrow }}</p>

      <h1 id="hero-title" class="title">{{ hero.title }}</h1>

      <p class="subtitle text-gradient">{{ t('portal.hero.subtitle') }}</p>
      <p class="lead">{{ t('portal.hero.lead') }}</p>

      <div class="actions">
        <AppButton href="#kontakt">{{ t('portal.hero.primaryAction') }}</AppButton>
        <AppButton href="#vyvoj" variant="ghost">{{ t('portal.hero.secondaryAction') }}</AppButton>
      </div>

      <ul class="stack glass" :aria-label="t('portal.hero.stackLabel')">
        <li v-for="tech in hero.stack" :key="tech">{{ tech }}</li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 100svh;
  padding-block: 8rem var(--space-8);
  overflow: hidden;
}

.halo {
  position: absolute;
  top: 18%;
  left: 50%;
  width: min(70rem, 140vw);
  aspect-ratio: 2 / 1;
  transform: translateX(-50%);
  background: radial-gradient(closest-side, rgb(255 122 26 / 0.28), transparent);
  filter: blur(40px);
  pointer-events: none;
}

.inner {
  position: relative;
}

.eyebrow {
  color: var(--color-muted);
}

.title {
  margin-top: var(--space-2);
  font-size: clamp(2.75rem, 1.4rem + 7vw, 6rem);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1.02;
}

.subtitle {
  margin-top: var(--space-1);
  font-size: clamp(1.5rem, 1rem + 2.4vw, 2.75rem);
  font-weight: 650;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.lead {
  margin-top: var(--space-3);
  max-width: 46ch;
  color: var(--color-muted);
  font-size: clamp(1.0625rem, 1rem + 0.3vw, 1.25rem);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

/* Technologie jako jedna skleněná lišta – na mobilu se zalomí do řádků. */
.stack {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  width: fit-content;
  max-width: 100%;
  margin-top: var(--space-6);
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius-lg);
  color: var(--color-muted);
  font-size: var(--text-sm);
  font-weight: 500;
}
</style>
