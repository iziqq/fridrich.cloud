<script setup lang="ts">
import type { PlanningCategory } from '@fridrich/weddy-shared';
import { PLANNING_CATEGORY_LABELS, formatCurrency } from '@fridrich/weddy-shared';
import { computed, onMounted, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import ErrorBlock from '@/weddy/components/ErrorBlock.vue';
import LoadingBlock from '@/weddy/components/LoadingBlock.vue';
import { weddyPath } from '@/weddy/routes';
import { usePlanningStore } from './planning.store';

const route = useRoute();
const store = usePlanningStore();

const weddingId = computed(() => String(route.params['weddingId'] ?? ''));

onMounted(() => store.load(weddingId.value));
watch(weddingId, (id) => store.load(id));

// Typ podle výčtu, ne `Record<string, string>` – jinak by se na novou sekci
// dala zapomenout ikona a v seznamu by zůstalo prázdné místo.
const ICONS: Record<PlanningCategory, string> = {
  ceremonyVenue: '⛪',
  receptionVenue: '🥂',
  food: '🍽️',
  drinks: '🍷',
  flowers: '💐',
  decorations: '🎀',
  suit: '🤵',
  dress: '👰',
  rings: '💍',
  bachelorParty: '🎉',
  otherActivities: '✨',
};
</script>

<template>
  <div>
    <LoadingBlock v-if="store.loading && store.items.length === 0" />
    <ErrorBlock v-else-if="store.error" :message="store.error" />

    <template v-else>
      <p class="lead">
        Osm oblastí přípravy. V každé si můžete držet víc variant a rozhodnout se později.
      </p>

      <ul class="sections">
        <li v-for="section in store.overview" :key="section.category">
          <RouterLink
            :to="weddyPath(`/weddings/${weddingId}/planning/${section.category}`)"
            class="section card"
          >
            <span class="icon" aria-hidden="true">{{ ICONS[section.category] }}</span>

            <span class="text">
              <span class="name">{{ PLANNING_CATEGORY_LABELS[section.category] }}</span>
              <span class="meta">
                <template v-if="section.itemCount === 0">Zatím prázdné</template>
                <template v-else>
                  {{ section.itemCount }}
                  {{ section.itemCount === 1 ? 'položka' : section.itemCount < 5 ? 'položky' : 'položek' }}
                  · {{ section.acceptedCount }} schváleno
                </template>
              </span>
            </span>

            <span class="total">{{ section.total > 0 ? formatCurrency(section.total) : '—' }}</span>
          </RouterLink>
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
.lead {
  margin-bottom: var(--space-2);
  color: var(--color-muted);
}

.sections {
  display: grid;
  gap: 0.5rem;
}

.section {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--space-2);
  align-items: center;
  min-height: var(--touch-target);
  padding: var(--space-1) var(--space-2);
  color: inherit;
  text-decoration: none;
  transition:
    border-color var(--dur-fast) var(--ease),
    transform var(--dur-fast) var(--ease);
}

.section:hover {
  border-color: var(--rose-400);
  transform: translateY(-1px);
}

.icon {
  font-size: 1.5rem;
}

.name {
  display: block;
  font-weight: 600;
}

.meta {
  display: block;
  color: var(--color-muted);
  font-size: 0.8125rem;
}

.total {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  white-space: nowrap;
}

@media (--tablet) {
  .sections {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
