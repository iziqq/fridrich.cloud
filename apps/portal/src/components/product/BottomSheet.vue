<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useProductTheme } from './theme';

const props = defineProps<{ title: string }>();
const open = defineModel<boolean>('open', { required: true });

const { t } = useI18n();
const theme = useProductTheme();

const panel = ref<HTMLElement | null>(null);
let lastFocused: HTMLElement | null = null;

/*
 * Formulář na mobilu vyjíždí zespodu (doc/wiki/domains/weddy.md).
 * Zatímco je otevřený, pozadí nesmí scrollovat a fokus musí zůstat uvnitř –
 * jinak uživatel klávesnicí „propadne" pod překryv.
 */
watch(open, async (isOpen) => {
  if (isOpen) {
    lastFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    await nextTick();
    panel.value?.querySelector<HTMLElement>('input, select, textarea, button')?.focus();
  } else {
    document.body.style.removeProperty('overflow');
    lastFocused?.focus();
  }
});

function close(): void {
  open.value = false;
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    close();
    return;
  }

  if (event.key !== 'Tab' || !panel.value) return;

  const focusable = [
    ...panel.value.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ];
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) return;

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
</script>

<template>
  <!--
    Teleport posílá obsah do `body`, tedy mimo obal produktu. Bez jeho tříd by
    uvnitř neplatily tokeny ani styly tlačítek a formulář by se kreslil
    portálovým tmavým tématem (doc/wiki/architecture/frontend.md).
  -->
  <Teleport to="body">
    <div v-if="open" :class="['product', theme, 'overlay']" @keydown="onKeydown">
      <div class="backdrop" @click="close"></div>

      <div
        ref="panel"
        class="sheet"
        role="dialog"
        aria-modal="true"
        :aria-label="props.title"
      >
        <header class="head">
          <span class="grip" aria-hidden="true"></span>
          <h2>{{ props.title }}</h2>
          <button type="button" class="close" @click="close">
            <span class="visually-hidden">{{ t('weddy.components.bottomSheet.close') }}</span>
            <span aria-hidden="true">✕</span>
          </button>
        </header>

        <div class="body">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/*
 * Třída produktu nese tokeny i jeho vlastní podklad – ten by tady přes stránku
 * ležel jako neprůhledná plocha, takže ho překryv přebíjí zpátky na průhledno.
 */
.overlay {
  position: fixed;
  inset: 0;
  min-height: 0;
  z-index: 60;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background: transparent;
}

.backdrop {
  position: absolute;
  inset: 0;
  background: rgb(43 36 48 / 0.22);
  animation: fade var(--dur-base) var(--ease);
}

.sheet {
  position: relative;
  max-height: 92dvh;
  overflow-y: auto;
  border-radius: var(--radius) var(--radius) 0 0;
  background: var(--color-surface);
  box-shadow: var(--shadow-lg);
  animation: rise var(--dur-base) var(--ease);
}

.head {
  position: sticky;
  top: 0;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

.grip {
  position: absolute;
  top: 0.5rem;
  left: 50%;
  width: 2.25rem;
  height: 0.25rem;
  border-radius: 999px;
  background: var(--color-border);
  transform: translateX(-50%);
}

.head h2 {
  margin-top: 0.35rem;
  font-size: 1.25rem;
}

.close {
  display: grid;
  place-items: center;
  min-width: var(--touch-target);
  min-height: var(--touch-target);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
}

.close:hover {
  background: var(--color-surface-alt);
  color: var(--color-text);
}

.body {
  padding: var(--space-2) var(--space-2) calc(var(--space-4) + env(safe-area-inset-bottom));
}

@keyframes rise {
  from {
    transform: translateY(100%);
  }
}

@keyframes fade {
  from {
    opacity: 0;
  }
}

/* Na širší obrazovce dává větší smysl klasický dialog uprostřed. */
@media (--tablet) {
  .overlay {
    justify-content: center;
    align-items: center;
    padding: var(--space-2);
  }

  .sheet {
    width: 100%;
    max-width: 34rem;
    border-radius: var(--radius);
    animation: none;
  }

  .grip {
    display: none;
  }

  .head h2 {
    margin-top: 0;
  }
}
</style>
