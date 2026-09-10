<script setup lang="ts">
import {
  GUEST_STATUS_LABELS,
  PLANNING_ITEM_STATUS_LABELS,
  type GuestStatus,
  type PlanningItemStatus,
} from '@fridrich/weddy-shared';
import { computed } from 'vue';

const props = defineProps<{ status: GuestStatus | PlanningItemStatus }>();

// Stav se rozlisuje barvou i textem, ne jen barvou (doc/iziweddy.md, kap. 6.3).
const label = computed(
  () =>
    GUEST_STATUS_LABELS[props.status as GuestStatus] ??
    PLANNING_ITEM_STATUS_LABELS[props.status as PlanningItemStatus],
);
</script>

<template>
  <span class="badge" :class="status">{{ label }}</span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.55rem;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.draft {
  border-color: var(--sand-200);
  background: var(--sand-100);
  color: var(--ink-700);
}

.requested {
  border-color: #f0dcae;
  background: #fdf6e3;
  color: #8a6416;
}

.accepted {
  border-color: #bfdcc9;
  background: #eaf5ee;
  color: #386b4c;
}

.rejected {
  border-color: #eecdc7;
  background: #fbeeeb;
  color: #96412f;
}
</style>
