<script setup lang="ts">
import AppButton from '@/components/AppButton.vue';
import SectionHeading from '@/components/SectionHeading.vue';
import SectionLabel from '@/components/SectionLabel.vue';
import { useI18n } from 'vue-i18n';
import { processSteps } from '@/content/site';
import { useReveal } from '@/composables/useReveal';

const { t } = useI18n();
const { el, visible } = useReveal();
</script>

<template>
  <section id="vyvoj" class="section" aria-labelledby="vyvoj-title">
    <div ref="el" class="container reveal" :class="{ 'is-visible': visible }">
      <SectionLabel :text="t('portal.process.label')" />
      <SectionHeading :text="t('portal.process.title')" :level="2" />
      <span id="vyvoj-title" class="visually-hidden">{{ t('portal.process.title') }}</span>
      <p class="lead">{{ t('portal.process.lead') }}</p>

      <!-- Kroky jsou číslovaný seznam i sémanticky, ne jen vizuálně. -->
      <ol class="steps">
        <li
          v-for="(step, index) in processSteps"
          :key="step.id"
          class="step"
          :style="{ '--i': index }"
        >
          <div class="marker" aria-hidden="true">
            <span class="mono number">{{ step.number }}</span>
          </div>

          <div class="content glass">
            <h3>{{ t(`portal.process.steps.${step.id}.title`) }}</h3>
            <p>{{ t(`portal.process.steps.${step.id}.description`) }}</p>
            <p class="output mono">
              <span class="output-key">{{ t('portal.process.outputLabel') }}</span>
              {{ t(`portal.process.steps.${step.id}.output`) }}
            </p>
          </div>
        </li>
      </ol>

      <p class="note">{{ t('portal.process.note') }}</p>

      <div class="cta">
        <AppButton href="#kontakt">{{ t('portal.process.cta') }}</AppButton>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section {
  padding-block: var(--section-gap);
  background:
    radial-gradient(ellipse 60% 50% at 50% 0%, color-mix(in srgb, var(--color-accent-soft) 6%, transparent), transparent);
}

.lead {
  margin-top: var(--space-2);
  color: var(--color-muted);
}

/* --- Mobil: svislá osa --- */

.steps {
  position: relative;
  margin-top: var(--space-6);
  padding-left: 2.5rem;
}

.steps::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 1.125rem;
  width: 1px;
  background: linear-gradient(to bottom, var(--color-accent), var(--color-accent-soft));
  opacity: 0.4;
}

.step {
  position: relative;
  padding-bottom: var(--space-4);
}

.step:last-child {
  padding-bottom: 0;
}

.marker {
  position: absolute;
  top: 0;
  left: -2.5rem;
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid color-mix(in srgb, var(--color-accent) 60%, transparent);
  border-radius: 50%;
  background: var(--color-bg);
  box-shadow: 0 0 18px -4px var(--color-accent-glow);
}

.number {
  color: var(--color-accent);
  font-size: 0.8125rem;
}

.content {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  transition: border-color var(--dur-fast) var(--ease);
}

.step:hover .content {
  border-color: var(--color-accent-soft);
}

.content h3 {
  color: var(--color-text);
}

.content p {
  margin-top: var(--space-1);
  color: var(--color-muted);
}

.output {
  margin-top: var(--space-2);
  padding-top: var(--space-1);
  border-top: 1px solid var(--color-border);
  color: var(--color-accent-soft);
}

.output-key {
  color: var(--color-muted);
}

.note {
  margin-top: var(--space-4);
  padding-left: var(--space-2);
  border-left: 2px solid var(--color-accent);
  color: var(--color-muted);
}

.cta {
  margin-top: var(--space-4);
}

/* --- Notebook: vodorovný stepper ve dvou řadách po třech krocích --- */

/*
 * Šest sloupců se na 1024 px nevejde – mono slova jako „Proklikatelné" jsou
 * širší než sloupec a stránka přetékala do strany. Tři sloupce drží popisy
 * čitelné na každé šířce notebooku; spojnici proto kreslí každý krok zvlášť
 * (od své značky k další), aby řady nepropojovala čára přes celý seznam.
 */
@media (--notebook) {
  .steps {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: calc(3rem + var(--space-3)) var(--space-2);
    padding-left: 0;
    padding-top: 3rem;
  }

  .steps::before {
    display: none;
  }

  .step {
    padding-bottom: 0;
  }

  .step::before {
    content: '';
    position: absolute;
    top: -1.875rem;
    right: calc(var(--space-2) * -1);
    left: 2.25rem;
    height: 1px;
    background: linear-gradient(to right, var(--color-accent), var(--color-accent-soft));
    opacity: 0.4;
  }

  .step:nth-child(3n)::before,
  .step:last-child::before {
    right: 0;
  }

  .marker {
    top: -3rem;
    left: 0;
  }

  .content {
    height: 100%;
  }
}
</style>
