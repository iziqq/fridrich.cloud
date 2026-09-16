<script setup lang="ts">
import { useId } from 'vue';

defineProps<{
  label: string;
  options: readonly { value: string; label: string }[];
}>();

const model = defineModel<string>({ required: true });

const name = useId();
</script>

<template>
  <fieldset class="field">
    <legend>{{ label }}</legend>

    <!--
      Přepínače místo <select>: možností jsou dvě až čtyři, takže je lepší
      je mít vidět naráz než schované v rozbalovací nabídce.
    -->
    <div class="options">
      <label v-for="option in options" :key="option.value" class="option">
        <input
          v-model="model"
          type="radio"
          :name="name"
          :value="option.value"
          class="visually-hidden"
        />
        <span>{{ option.label }}</span>
      </label>
    </div>
  </fieldset>
</template>

<style scoped>
.field {
  padding: 0;
  border: 0;
}

legend {
  margin-bottom: 0.35rem;
  padding: 0;
  font-size: 0.875rem;
  font-weight: 600;
}

.options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.option {
  flex: 1 1 auto;
  min-width: 6rem;
}

.option span {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: var(--touch-target);
  padding: 0.5rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  font-size: 0.9375rem;
  text-align: center;
  cursor: pointer;
  transition:
    border-color var(--dur-fast) var(--ease),
    background-color var(--dur-fast) var(--ease),
    color var(--dur-fast) var(--ease);
}

.option input:checked + span {
  border-color: var(--color-accent);
  background: var(--color-accent-wash);
  color: var(--color-accent-strong);
  font-weight: 600;
}

/* Fokus musí být vidět, i když je samotný přepínač skrytý. */
.option input:focus-visible + span {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
</style>
