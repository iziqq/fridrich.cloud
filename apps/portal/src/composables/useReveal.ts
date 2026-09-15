import { onBeforeUnmount, onMounted, ref, shallowRef, type Ref } from 'vue';

/**
 * Přidá prvku třídu `is-visible`, jakmile se objeví ve viewportu.
 *
 * Efekt se přehraje jen jednou – pozorování se hned odpojí, takže nic neběží
 * ve smyčce mimo obrazovku (doc/wiki/domains/portal.md).
 */
export function useReveal(threshold = 0.15): {
  el: Ref<HTMLElement | null>;
  visible: Ref<boolean>;
} {
  const el = shallowRef<HTMLElement | null>(null);
  const visible = ref(false);
  let observer: IntersectionObserver | undefined;

  onMounted(() => {
    const target = el.value;
    if (!target) return;

    // Bez podpory IntersectionObserveru obsah rovnou zobrazíme.
    if (!('IntersectionObserver' in window)) {
      visible.value = true;
      return;
    }

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          visible.value = true;
          observer?.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(target);
  });

  onBeforeUnmount(() => observer?.disconnect());

  return { el, visible };
}
