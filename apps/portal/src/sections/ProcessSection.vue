<script setup lang="ts">
import CyberButton from '@/components/CyberButton.vue';
import GlitchHeading from '@/components/GlitchHeading.vue';
import SectionLabel from '@/components/SectionLabel.vue';
import { process } from '@/content/site';
import { useReveal } from '@/composables/useReveal';

const { el, visible } = useReveal();
</script>

<template>
  <section id="vyvoj" class="section" aria-labelledby="vyvoj-title">
    <div ref="el" class="container reveal" :class="{ 'is-visible': visible }">
      <SectionLabel :text="process.label" />
      <GlitchHeading :text="process.title" :level="2" />
      <span id="vyvoj-title" class="visually-hidden">{{ process.title }}</span>
      <p class="lead">{{ process.lead }}</p>

      <!-- Kroky jsou číslovaný seznam i sémanticky, ne jen vizuálně. -->
      <ol class="steps">
        <li
          v-for="(step, index) in process.steps"
          :key="step.number"
          class="step"
          :style="{ '--i': index }"
        >
          <div class="marker" aria-hidden="true">
            <span class="mono number">{{ step.number }}</span>
          </div>

          <div class="content bevel-sm">
            <h3>{{ step.title }}</h3>
            <p>{{ step.description }}</p>
            <p class="output mono">
              <span class="output-key">Výstup:</span> {{ step.output }}
            </p>
          </div>
        </li>
      </ol>

      <p class="note">{{ process.note }}</p>

      <div class="cta">
        <CyberButton href="#kontakt">Začneme prvním krokem</CyberButton>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section {
  padding-block: var(--section-gap);
  background:
    radial-gradient(ellipse 60% 50% at 50% 0%, color-mix(in srgb, var(--cp-cyan) 6%, transparent), transparent);
}

.lead {
  margin-top: var(--space-2);
  color: var(--cp-muted);
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
  background: linear-gradient(to bottom, var(--cp-yellow), var(--cp-cyan));
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
  border: 1px solid var(--cp-yellow);
  background: var(--cp-black);
}

.number {
  color: var(--cp-yellow);
  font-size: 0.8125rem;
}

.content {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--cp-line);
  background: var(--cp-panel);
  transition: border-color var(--dur-fast) var(--ease);
}

.step:hover .content {
  border-color: var(--cp-cyan);
}

.content h3 {
  color: var(--cp-text);
}

.content p {
  margin-top: var(--space-1);
  color: var(--cp-muted);
}

.output {
  margin-top: var(--space-2);
  padding-top: var(--space-1);
  border-top: 1px solid var(--cp-line);
  color: var(--cp-cyan);
}

.output-key {
  color: var(--cp-muted);
}

.note {
  margin-top: var(--space-4);
  padding-left: var(--space-2);
  border-left: 2px solid var(--cp-yellow);
  color: var(--cp-muted);
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
    background: linear-gradient(to right, var(--cp-yellow), var(--cp-cyan));
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
