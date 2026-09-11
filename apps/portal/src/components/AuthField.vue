<script setup lang="ts">
import { computed, useId } from 'vue';

const props = withDefaults(
  defineProps<{
    label: string;
    type?: 'text' | 'email';
    autocomplete?: string;
    error?: string;
    hint?: string;
    inputmode?: 'text' | 'numeric';
    maxlength?: number;
    /** Velké řídké písmo pro přihlašovací kód, ať se dobře opisuje. */
    code?: boolean;
  }>(),
  { type: 'text', code: false },
);

const model = defineModel<string>({ required: true });

const id = useId();
const errorId = computed(() => `${id}-error`);
const hintId = computed(() => `${id}-hint`);

// Chybu i nápovědu musí předčítač spojit s polem, jinak je uživatel mine.
const describedBy = computed(() => {
  const ids: string[] = [];
  if (props.error) ids.push(errorId.value);
  if (props.hint) ids.push(hintId.value);
  return ids.length > 0 ? ids.join(' ') : undefined;
});
</script>

<template>
  <div class="field">
    <label :for="id">{{ label }}</label>
    <input
      :id="id"
      v-model="model"
      :type="type"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :maxlength="maxlength"
      :class="{ code }"
      :aria-invalid="Boolean(error)"
      :aria-describedby="describedBy"
    />
    <p v-if="hint" :id="hintId" class="hint mono">{{ hint }}</p>
    <p v-if="error" :id="errorId" class="error mono">{{ error }}</p>
  </div>
</template>

<style scoped>
label {
  display: block;
  margin-bottom: 0.35rem;
  color: var(--cp-muted);
  font-family: var(--font-mono);
  font-size: var(--text-label);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

input {
  width: 100%;
  min-height: 2.75rem;
  padding: 0.65rem 0.85rem;
  border: 1px solid var(--cp-line);
  background: var(--cp-black);
  color: var(--cp-text);
  transition: border-color var(--dur-fast) var(--ease);
}

input.code {
  font-family: var(--font-mono);
  font-size: 1.6rem;
  letter-spacing: 0.4em;
  text-align: center;
  /* Odsazení vyrovná mezeru, kterou letter-spacing přidává za poslední znak. */
  text-indent: 0.4em;
}

input:focus {
  border-color: var(--cp-yellow);
}

input[aria-invalid='true'] {
  border-color: var(--cp-magenta);
}

.hint {
  margin-top: 0.35rem;
  color: var(--cp-muted);
}

.error {
  margin-top: 0.35rem;
  color: var(--cp-magenta);
}
</style>
