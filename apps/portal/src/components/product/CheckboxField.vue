<script setup lang="ts">
import { useId } from 'vue';

/**
 * Zaškrtávací pole.
 *
 * Nativní čtvereček je malý a v každém prohlížeči jiný, takže je skrytý a
 * místo něj se kreslí vlastní – celý řádek s popiskem je přitom klikací,
 * takže se dá trefit palcem (44 px) i na telefonu.
 */
defineProps<{ label: string; hint?: string }>();
const model = defineModel<boolean>({ required: true });

const id = useId();
</script>

<template>
  <label class="checkbox" :for="id">
    <input :id="id" v-model="model" type="checkbox" class="visually-hidden" />
    <span class="box" aria-hidden="true">
      <svg viewBox="0 0 12 10"><path d="M1 5.5 4.2 8.5 11 1.5" /></svg>
    </span>
    <span class="text">
      <span class="label">{{ label }}</span>
      <span v-if="hint" class="hint">{{ hint }}</span>
    </span>
  </label>
</template>

<style scoped>
.checkbox {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  min-height: var(--touch-target);
  cursor: pointer;
}

.box {
  display: grid;
  flex: none;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  border: 1.5px solid var(--color-border);
  border-radius: 0.4rem;
  background: var(--color-surface);
  transition:
    background-color var(--dur-fast) var(--ease),
    border-color var(--dur-fast) var(--ease);
}

.box svg {
  width: 0.75rem;
  fill: none;
  stroke: var(--color-on-accent);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0;
}

.checkbox:hover .box {
  border-color: var(--color-accent-muted);
}

input:checked + .box {
  border-color: var(--color-accent);
  background: var(--color-accent);
}

input:checked + .box svg {
  opacity: 1;
}

/* Fokus musí být vidět, i když je samotné pole skryté. */
input:focus-visible + .box {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.text {
  display: grid;
}

.label {
  font-weight: 600;
}

.hint {
  color: var(--color-muted);
  font-size: var(--text-xs);
}
</style>
