<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useProductTheme } from './theme';
import { useConfirmDialog } from './confirm';

/*
 * Dialog k `askConfirm` (confirm.ts). Visí jednou v `WeddyShell.vue`, takže
 * se o něj obrazovky nestarají – jen se ptají.
 */
const { request, resolve } = useConfirmDialog();
const { t } = useI18n();
const theme = useProductTheme();

const cancelButton = ref<HTMLElement | null>(null);
const panel = ref<HTMLElement | null>(null);
let lastFocused: HTMLElement | null = null;

/*
 * Fokus míří na „Zrušit": dotaz se ptá na nevratnou věc, takže Enter hned po
 * otevření nemá nic smazat. Pozadí mezitím nescrolluje.
 */
watch(request, async (open) => {
  if (open) {
    lastFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    await nextTick();
    cancelButton.value?.focus();
  } else {
    document.body.style.removeProperty('overflow');
    lastFocused?.focus();
  }
});

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.stopPropagation();
    resolve(false);
    return;
  }

  if (event.key !== 'Tab' || !panel.value) return;

  const focusable = [...panel.value.querySelectorAll<HTMLElement>('button:not([disabled])')];
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
  <!-- Teleport míří mimo obal produktu, proto si jeho třídy nese s sebou. -->
  <Teleport to="body">
    <div v-if="request" :class="['product', theme, 'overlay']" @keydown="onKeydown">
      <div class="backdrop" @click="resolve(false)"></div>

      <div
        ref="panel"
        class="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        <h2 id="confirm-title">{{ request.title }}</h2>
        <p id="confirm-message">{{ request.message }}</p>

        <div class="actions">
          <button ref="cancelButton" type="button" class="btn btn-secondary" @click="resolve(false)">
            {{ t('weddy.components.confirm.cancel') }}
          </button>
          <button
            type="button"
            class="btn"
            :class="request.danger ? 'btn-danger' : 'btn-primary'"
            @click="resolve(true)"
          >
            {{ request.confirmLabel }}
          </button>
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
  z-index: 70;
  display: grid;
  place-items: center;
  padding: var(--space-2);
  background: transparent;
}

.backdrop {
  position: absolute;
  inset: 0;
  background: rgb(43 36 48 / 0.22);
  animation: fade var(--dur-base) var(--ease);
}

.dialog {
  position: relative;
  width: 100%;
  max-width: 26rem;
  padding: var(--space-3);
  border-radius: var(--radius);
  background: var(--color-surface);
  box-shadow: var(--shadow-lg);
  animation: pop var(--dur-base) var(--ease);
}

h2 {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
}

p {
  margin: 0;
  color: var(--color-muted);
  line-height: 1.5;
}

/*
 * Tlačítka pod sebou na mobilu: na úzké obrazovce se dvě vedle sebe zúží tak,
 * že se popisek zlomí. Potvrzení je první ve vizuálním pořadí zprava.
 */
.actions {
  display: flex;
  flex-direction: column-reverse;
  gap: 0.5rem;
  margin-top: var(--space-2);
}

.actions .btn {
  width: 100%;
}

@media (--tablet) {
  .actions {
    flex-direction: row;
    justify-content: flex-end;
  }

  .actions .btn {
    width: auto;
  }
}

@keyframes pop {
  from {
    opacity: 0;
    transform: scale(0.97);
  }
}

@keyframes fade {
  from {
    opacity: 0;
  }
}
</style>
