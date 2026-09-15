import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';

/**
 * Sleduje, která sekce je právě na obrazovce – podle toho se v navigaci
 * zvýrazní odpovídající položka (doc/wiki/domains/portal.md).
 *
 * Sleduje se skutečná pozice, ne poslední kliknutí, aby zvýraznění sedělo
 * i při ručním scrollování.
 */
export function useActiveSection(ids: string[]): Ref<string> {
  const active = ref(ids[0] ?? '');
  let observer: IntersectionObserver | undefined;

  onMounted(() => {
    if (!('IntersectionObserver' in window)) return;

    const visible = new Map<string, number>();

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }

        // Vyhraje sekce, které je vidět nejvíc.
        let best = '';
        let bestRatio = 0;
        for (const [id, ratio] of visible) {
          if (ratio > bestRatio) {
            best = id;
            bestRatio = ratio;
          }
        }

        if (best) active.value = best;
      },
      { threshold: [0.15, 0.4, 0.7], rootMargin: '-80px 0px -40% 0px' },
    );

    for (const id of ids) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
  });

  onBeforeUnmount(() => observer?.disconnect());

  return active;
}
