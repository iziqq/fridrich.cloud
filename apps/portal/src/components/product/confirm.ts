import { ref, type Ref } from 'vue';

/*
 * Potvrzení nevratné akce.
 *
 * `window.confirm` vypadá v každém prohlížeči jinak, nese jeho jméno místo
 * našeho a na mobilu zastaví celou stránku. Dotaz proto kreslíme sami –
 * `ConfirmDialog.vue` visí jednou v `WeddyShell.vue` a tohle je jeho ovládání,
 * aby volající místo dialogu řešilo jen otázku a odpověď:
 *
 *   if (!(await askConfirm({ … }))) return;
 */
export interface ConfirmRequest {
  title: string;
  message: string;
  /** Popisek potvrzovacího tlačítka – řekne, co se stane („Smazat hosta"). */
  confirmLabel: string;
  /** Nevratná akce se odliší barvou, aby šla poznat ještě před kliknutím. */
  danger?: boolean;
}

const request = ref<ConfirmRequest | null>(null);
let answer: ((confirmed: boolean) => void) | null = null;

/** Zeptá se uživatele; vrátí `true`, když potvrdil. */
export function askConfirm(next: ConfirmRequest): Promise<boolean> {
  // Druhý dotaz přes první nepustíme – ten starý bere jako zamítnutý.
  answer?.(false);
  request.value = next;

  return new Promise<boolean>((resolve) => {
    answer = resolve;
  });
}

/** Napojení pro `ConfirmDialog.vue`; jinde se nepoužívá. */
export function useConfirmDialog(): {
  request: Ref<ConfirmRequest | null>;
  resolve: (confirmed: boolean) => void;
} {
  return {
    request,
    resolve(confirmed: boolean): void {
      answer?.(confirmed);
      answer = null;
      request.value = null;
    },
  };
}
