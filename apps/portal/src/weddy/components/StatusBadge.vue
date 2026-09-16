<script setup lang="ts">
import {
  guestsKeys,
  planningKeys,
  type GuestStatus,
  type PlanningItemStatus,
} from '@fridrich/weddy-shared';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

/*
 * `kind` je povinný: host i položka mají stav `accepted`, ale host „Přijal" a položka
 * „Schváleno" – podle samotné hodnoty stavu je rozlišit nejde.
 */
const props = defineProps<
  { kind: 'guest'; status: GuestStatus } | { kind: 'planning'; status: PlanningItemStatus }
>();

const { t } = useI18n();

// Stav se rozlišuje barvou i textem, ne jen barvou (doc/wiki/domains/weddy.md).
const label = computed(() =>
  t(props.kind === 'guest' ? guestsKeys.status[props.status] : planningKeys.status[props.status]),
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
  font-size: var(--text-xs);
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
