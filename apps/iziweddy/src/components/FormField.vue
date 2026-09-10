<script setup lang="ts">
import { computed, useId } from 'vue';

const props = withDefaults(
  defineProps<{
    label: string;
    type?: 'text' | 'email' | 'tel' | 'date' | 'url' | 'number';
    /** Otevře na mobilu číselnou klávesnici (cena, rok). */
    numeric?: boolean;
    placeholder?: string;
    error?: string;
    hint?: string;
    required?: boolean;
    textarea?: boolean;
  }>(),
  { type: 'text', numeric: false, required: false, textarea: false },
);

const model = defineModel<string>({ required: true });

const id = useId();
const errorId = computed(() => `${id}-error`);
const hintId = computed(() => `${id}-hint`);

const describedBy = computed(() => {
  const ids: string[] = [];
  if (props.error) ids.push(errorId.value);
  if (props.hint) ids.push(hintId.value);
  return ids.length > 0 ? ids.join(' ') : undefined;
});
</script>

<template>
  <div class="field">
    <label :for="id">
      {{ label }}
      <span v-if="!required" class="optional">nepovinné</span>
    </label>

    <textarea
      v-if="textarea"
      :id="id"
      v-model="model"
      rows="3"
      :placeholder="placeholder"
      :aria-invalid="Boolean(error)"
      :aria-describedby="describedBy"
    ></textarea>

    <input
      v-else
      :id="id"
      v-model="model"
      :type="type"
      :inputmode="numeric ? 'numeric' : undefined"
      :placeholder="placeholder"
      :aria-invalid="Boolean(error)"
      :aria-describedby="describedBy"
    />

    <p v-if="hint && !error" :id="hintId" class="hint">{{ hint }}</p>
    <p v-if="error" :id="errorId" class="error">{{ error }}</p>
  </div>
</template>

<style scoped>
label {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
  margin-bottom: 0.35rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.optional {
  color: var(--color-muted);
  font-size: 0.75rem;
  font-weight: 400;
}

input,
textarea {
  width: 100%;
  min-height: var(--touch-target);
  padding: 0.65rem 0.8rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  transition: border-color var(--dur-fast) var(--ease);
}

input:focus,
textarea:focus {
  border-color: var(--color-accent);
}

input[aria-invalid='true'],
textarea[aria-invalid='true'] {
  border-color: var(--color-danger);
}

textarea {
  resize: vertical;
}

.hint,
.error {
  margin-top: 0.3rem;
  font-size: 0.8125rem;
}

.hint {
  color: var(--color-muted);
}

.error {
  color: var(--color-danger);
}
</style>
