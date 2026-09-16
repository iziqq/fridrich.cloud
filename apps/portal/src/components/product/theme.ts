import { ref, type Ref } from 'vue';

/*
 * Která produktová paleta právě platí.
 *
 * Produkty (IziWeddy, IziBudgy) běží uvnitř portálu a svůj vzhled drží třídou
 * na obalu – tokeny na `:root` by přebily portál na celém webu. Překryvy se
 * ale teleportují do `body`, tedy mimo ten obal, takže si třídu musí vzít
 * s sebou. Tady si ji ukládá shell produktu, aby ji `BottomSheet` a
 * `ConfirmDialog` nemusely hádat (doc/wiki/architecture/frontend.md).
 */
export type ProductTheme = 'weddy' | 'budgy';

const theme = ref<ProductTheme>('weddy');

/** Zavolá shell produktu, když se namontuje. */
export function useProductTheme(active?: ProductTheme): Ref<ProductTheme> {
  if (active) theme.value = active;
  return theme;
}
