<script setup lang="ts">
import CyberButton from '@/components/CyberButton.vue';
import { useI18n } from 'vue-i18n';
import { hero } from '@/content/site';

const { t } = useI18n();
</script>

<template>
  <section class="hero scanlines noise" aria-labelledby="hero-title">
    <div class="grid-layer" aria-hidden="true"></div>

    <div class="container inner">
      <p class="mono eyebrow">{{ hero.eyebrow }}</p>

      <h1 id="hero-title" class="title">
        <span class="glitch is-visible" :data-text="hero.title">{{ hero.title }}</span>
      </h1>

      <p class="subtitle">{{ t('portal.hero.subtitle') }}</p>
      <p class="lead">{{ t('portal.hero.lead') }}</p>

      <div class="actions">
        <CyberButton href="#kontakt">{{ t('portal.hero.primaryAction') }}</CyberButton>
        <CyberButton href="#vyvoj" variant="ghost">{{ t('portal.hero.secondaryAction') }}</CyberButton>
      </div>

      <ul class="stack mono" :aria-label="t('portal.hero.stackLabel')">
        <li v-for="tech in hero.stack" :key="tech">{{ tech }}</li>
      </ul>
    </div>

    <!-- HUD rohové značky -->
    <span class="corner tl" aria-hidden="true"></span>
    <span class="corner br" aria-hidden="true"></span>
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

.grid-layer {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, var(--cp-line) 1px, transparent 1px),
    linear-gradient(to bottom, var(--cp-line) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent 75%);
}

.inner {
  position: relative;
}

.eyebrow {
  color: var(--cp-cyan);
}

.title {
  margin-block: var(--space-2) 0;
}

.subtitle {
  margin-top: var(--space-1);
  color: var(--cp-yellow);
  font-family: var(--font-display);
  font-size: clamp(1.25rem, 0.9rem + 1.8vw, 2rem);
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.lead {
  margin-top: var(--space-3);
  max-width: 46ch;
  color: var(--cp-muted);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.stack {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-6);
  color: var(--cp-muted);
}

.stack li:not(:last-child)::after {
  content: ' ·';
  color: var(--cp-line);
}

.corner {
  position: absolute;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid var(--cp-yellow);
  opacity: 0.5;
}

.corner.tl {
  top: 5.5rem;
  left: var(--gutter);
  border-right: 0;
  border-bottom: 0;
}

.corner.br {
  right: var(--gutter);
  bottom: var(--space-4);
  border-top: 0;
  border-left: 0;
}
</style>
