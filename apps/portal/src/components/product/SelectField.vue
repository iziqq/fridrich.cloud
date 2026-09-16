<script setup lang="ts" generic="T extends string">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';

/*
 * Vlastní rozbalovací seznam místo `<select>`.
 *
 * Nabídku nativního selectu kreslí operační systém – padding, barvy ani
 * zaoblení se do ní nedostanou, takže uprostřed svatebního tématu svítila
 * šedá systémová roleta. Tohle je obyčejný `button` + `ul[role=listbox]`,
 * takže vypadá jako zbytek plánovače. Cenou je klávesnice, kterou si musíme
 * obsloužit sami (šipky, Home/End, Enter, Esc).
 *
 * Pro dvě až čtyři možnosti, které mají být vidět naráz, je lepší ChoiceField.
 */
const props = defineProps<{
  label: string;
  options: readonly { value: T; label: string }[];
  /** Popisek zůstane jen pro čtečky – když ho nese okolí (např. řádek tabulky). */
  hideLabel?: boolean;
}>();

const model = defineModel<T>({ required: true });

const id = useId();
const labelId = `${id}-label`;
const valueId = `${id}-value`;
const listId = `${id}-list`;
const optionId = (index: number): string => `${id}-option-${index}`;

const open = ref(false);
const activeIndex = ref(0);
const root = ref<HTMLElement | null>(null);
const trigger = ref<HTMLElement | null>(null);
const list = ref<HTMLElement | null>(null);

const selectedIndex = computed(() => props.options.findIndex((option) => option.value === model.value));
const selectedLabel = computed(() => props.options[selectedIndex.value]?.label ?? '');

async function openMenu(index = selectedIndex.value): Promise<void> {
  activeIndex.value = Math.max(0, index);
  open.value = true;
  await nextTick();
  list.value?.focus();
}

function closeMenu(focusTrigger = true): void {
  if (!open.value) return;
  open.value = false;
  if (focusTrigger) trigger.value?.focus();
}

function choose(index: number): void {
  const option = props.options[index];
  if (option) model.value = option.value;
  closeMenu();
}

function move(delta: number): void {
  const count = props.options.length;
  if (count === 0) return;
  activeIndex.value = (activeIndex.value + delta + count) % count;
}

function onTriggerKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    void openMenu();
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    void openMenu(props.options.length - 1);
  }
}

function onListKeydown(event: KeyboardEvent): void {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      move(1);
      break;
    case 'ArrowUp':
      event.preventDefault();
      move(-1);
      break;
    case 'Home':
      event.preventDefault();
      activeIndex.value = 0;
      break;
    case 'End':
      event.preventDefault();
      activeIndex.value = props.options.length - 1;
      break;
    case 'Enter':
    case ' ':
      event.preventDefault();
      choose(activeIndex.value);
      break;
    case 'Escape':
      /*
       * Esc patří nabídce, ne tomu, co je pod ní – jinak by zavřel rovnou
       * celý popover s filtry a uživatel by přišel i o zbytek nastavení.
       */
      event.preventDefault();
      event.stopPropagation();
      closeMenu();
      break;
    case 'Tab':
      closeMenu(false);
      break;
  }
}

/* Klik mimo zavírá; fokus nepřebíráme, uživatel míří jinam. */
function onDocumentPointerDown(event: PointerEvent): void {
  if (open.value && !root.value?.contains(event.target as Node)) closeMenu(false);
}

onMounted(() => document.addEventListener('pointerdown', onDocumentPointerDown));
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocumentPointerDown));

watch(open, (isOpen) => {
  if (isOpen) activeIndex.value = Math.max(0, selectedIndex.value);
});
</script>

<template>
  <div ref="root" class="field" :class="{ open }">
    <span :id="labelId" :class="hideLabel ? 'visually-hidden' : 'label'">{{ label }}</span>

    <button
      ref="trigger"
      type="button"
      class="trigger"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-controls="listId"
      :aria-labelledby="`${labelId} ${valueId}`"
      @click="open ? closeMenu() : openMenu()"
      @keydown="onTriggerKeydown"
    >
      <span :id="valueId" class="value">{{ selectedLabel }}</span>
      <svg class="chevron" viewBox="0 0 12 8" aria-hidden="true">
        <path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <ul
      v-if="open"
      :id="listId"
      ref="list"
      class="menu"
      role="listbox"
      tabindex="-1"
      :aria-activedescendant="optionId(activeIndex)"
      :aria-labelledby="labelId"
      @keydown="onListKeydown"
    >
      <li
        v-for="(option, index) in options"
        :id="optionId(index)"
        :key="option.value"
        class="option"
        :class="{ active: index === activeIndex, selected: option.value === model }"
        role="option"
        :aria-selected="option.value === model"
        @click="choose(index)"
        @mousemove="activeIndex = index"
      >
        <span>{{ option.label }}</span>
        <span v-if="option.value === model" class="check" aria-hidden="true">✓</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.field {
  position: relative;
}

.label {
  display: block;
  margin-bottom: 0.35rem;
  font-size: var(--text-sm);
  font-weight: 600;
}

.trigger {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: var(--touch-target);
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  font-family: inherit;
  font-size: var(--text-sm);
  text-align: left;
  cursor: pointer;
  transition:
    border-color var(--dur-fast) var(--ease),
    background-color var(--dur-fast) var(--ease);
}

.trigger:hover {
  border-color: var(--color-accent-muted);
}

.field.open .trigger {
  border-color: var(--color-accent);
}

.value {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.chevron {
  flex: none;
  width: 0.7rem;
  color: var(--color-muted);
  transition: transform var(--dur-fast) var(--ease);
}

.field.open .chevron {
  transform: rotate(180deg);
}

/*
 * Nabídka se kreslí přes obsah pod sebou, proto stín a vlastní podklad.
 * `max-height` drží dlouhý seznam (stavy, role) v rozumné výšce.
 */
.menu {
  position: absolute;
  z-index: 20;
  top: calc(100% + 0.35rem);
  right: 0;
  left: 0;
  max-height: 15rem;
  overflow-y: auto;
  margin: 0;
  padding: 0.35rem;
  list-style: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
  animation: drop var(--dur-fast) var(--ease);
}

.menu:focus-visible {
  outline: none;
}

.option {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: space-between;
  min-height: 2.5rem;
  padding: 0.5rem 0.65rem;
  border-radius: calc(var(--radius-sm) - 4px);
  font-size: var(--text-sm);
  cursor: pointer;
}

/* Zvýrazněná položka je jedna – mysl i klávesnice ukazují na totéž. */
.option.active {
  background: var(--color-surface-alt);
}

.option.selected {
  color: var(--color-accent-strong);
  font-weight: 600;
}

.option.selected.active {
  background: var(--color-accent-wash);
}

.check {
  color: var(--color-accent);
}

@keyframes drop {
  from {
    opacity: 0;
    transform: translateY(-0.25rem);
  }
}
</style>
