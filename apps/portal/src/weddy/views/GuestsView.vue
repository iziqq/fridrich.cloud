<script setup lang="ts">
import type { Guest, GuestInput, GuestStatus } from '@fridrich/weddy-shared';
import {
  AGE_GROUP_LABELS,
  GUEST_SIDE_LABELS,
  GUEST_STATUSES,
  GUEST_STATUS_LABELS,
} from '@fridrich/weddy-shared';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ApiError } from '@/weddy/api';
import BottomSheet from '@/weddy/components/BottomSheet.vue';
import ChoiceField from '@/weddy/components/ChoiceField.vue';
import EmptyState from '@/weddy/components/EmptyState.vue';
import ErrorBlock from '@/weddy/components/ErrorBlock.vue';
import FabButton from '@/weddy/components/FabButton.vue';
import FormField from '@/weddy/components/FormField.vue';
import LoadingBlock from '@/weddy/components/LoadingBlock.vue';
import StatusBadge from '@/weddy/components/StatusBadge.vue';
import { GUEST_SORT_LABELS, useGuestsStore } from '@/weddy/stores/guests';

const route = useRoute();
const store = useGuestsStore();

const weddingId = computed(() => String(route.params['weddingId'] ?? ''));

onMounted(() => store.load(weddingId.value));
watch(weddingId, (id) => store.load(id));

/* --- Formulář --- */

const sheetOpen = ref(false);
const editing = ref<Guest | null>(null);
const formErrors = ref<Record<string, string>>({});
const saving = ref(false);

const form = reactive({
  firstName: '',
  lastName: '',
  side: 'bride',
  ageGroup: 'adult',
  status: 'draft',
  note: '',
});

function openCreate(): void {
  editing.value = null;
  Object.assign(form, {
    firstName: '',
    lastName: '',
    side: 'bride',
    ageGroup: 'adult',
    status: 'draft',
    note: '',
  });
  formErrors.value = {};
  sheetOpen.value = true;
}

function openEdit(guest: Guest): void {
  editing.value = guest;
  Object.assign(form, {
    firstName: guest.firstName,
    lastName: guest.lastName,
    side: guest.side,
    ageGroup: guest.ageGroup,
    status: guest.status,
    note: guest.note ?? '',
  });
  formErrors.value = {};
  sheetOpen.value = true;
}

async function submit(): Promise<void> {
  formErrors.value = {};
  saving.value = true;

  const input = {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    side: form.side,
    ageGroup: form.ageGroup,
    status: form.status,
    note: form.note.trim() || undefined,
  } as GuestInput;

  try {
    if (editing.value) {
      await store.update(weddingId.value, editing.value.id, input);
    } else {
      await store.create(weddingId.value, input);
    }
    sheetOpen.value = false;
  } catch (cause) {
    formErrors.value =
      cause instanceof ApiError && cause.details.length > 0
        ? cause.fieldErrors
        : { form: cause instanceof ApiError ? cause.message : 'Uložení se nepodařilo.' };
  } finally {
    saving.value = false;
  }
}

async function removeGuest(guest: Guest): Promise<void> {
  const name = `${guest.firstName} ${guest.lastName}`.trim();
  if (!window.confirm(`Opravdu smazat hosta ${name}?`)) return;

  await store.remove(weddingId.value, guest.id);
  if (editing.value?.id === guest.id) sheetOpen.value = false;
}

/** Rychlá změna stavu přímo ze seznamu, bez otevírání formuláře (kap. 5.3). */
async function cycleStatus(guest: Guest): Promise<void> {
  const order: GuestStatus[] = ['draft', 'requested', 'accepted', 'rejected'];
  const next = order[(order.indexOf(guest.status) + 1) % order.length];
  if (next) await store.setStatus(weddingId.value, guest.id, next);
}

const statusOptions = GUEST_STATUSES.map((status) => ({
  value: status,
  label: GUEST_STATUS_LABELS[status],
}));
</script>

<template>
  <div>
    <LoadingBlock v-if="store.loading && store.guests.length === 0" />
    <ErrorBlock v-else-if="store.error" :message="store.error" />

    <template v-else>
      <!-- Souhrn nad tabulkou počítá vždy ze všech hostů, filtr ho nemění. -->
      <ul class="stats">
        <li class="stat">
          <span class="value">{{ store.stats.total }}</span>
          <span class="label">Celkem</span>
        </li>
        <li class="stat">
          <span class="value accepted">{{ store.stats.accepted }}</span>
          <span class="label">Potvrzeno</span>
        </li>
        <li class="stat">
          <span class="value requested">{{ store.stats.requested }}</span>
          <span class="label">Čeká</span>
        </li>
        <li class="stat">
          <span class="value">{{ store.stats.draft }}</span>
          <span class="label">Návrhy</span>
        </li>
      </ul>

      <dl class="split">
        <div>
          <dt>Ženich / Nevěsta</dt>
          <dd>{{ store.stats.groom }} / {{ store.stats.bride }}</dd>
        </div>
        <div>
          <dt>Dospělí / Děti</dt>
          <dd>{{ store.stats.adults }} / {{ store.stats.children }}</dd>
        </div>
        <div>
          <dt>Odmítlo</dt>
          <dd>{{ store.stats.rejected }}</dd>
        </div>
      </dl>

      <div class="filters">
        <FormField v-model="store.filters.search" label="Hledat" placeholder="Jméno hosta" />

        <div class="selects">
          <label>
            <span>Strana</span>
            <select v-model="store.filters.side">
              <option value="all">Všichni</option>
              <option value="groom">{{ GUEST_SIDE_LABELS.groom }}</option>
              <option value="bride">{{ GUEST_SIDE_LABELS.bride }}</option>
            </select>
          </label>

          <label>
            <span>Věk</span>
            <select v-model="store.filters.ageGroup">
              <option value="all">Všichni</option>
              <option value="adult">{{ AGE_GROUP_LABELS.adult }}</option>
              <option value="child">{{ AGE_GROUP_LABELS.child }}</option>
            </select>
          </label>

          <label>
            <span>Stav</span>
            <select v-model="store.filters.status">
              <option value="all">Všechny</option>
              <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>

          <!-- Řazení není filtr, proto ho „Zrušit filtry" nechává být. -->
          <label>
            <span>Řadit podle</span>
            <select v-model="store.sort">
              <option value="lastName">{{ GUEST_SORT_LABELS.lastName }}</option>
              <option value="firstName">{{ GUEST_SORT_LABELS.firstName }}</option>
            </select>
          </label>
        </div>

        <button
          v-if="store.hasActiveFilters"
          type="button"
          class="btn btn-ghost clear"
          @click="store.resetFilters()"
        >
          Zrušit filtry
        </button>
      </div>

      <EmptyState
        v-if="store.guests.length === 0"
        icon="👥"
        title="Zatím žádní hosté"
        description="Přidejte prvního hosta a začněte skládat seznam."
      />

      <EmptyState
        v-else-if="store.filtered.length === 0"
        icon="🔍"
        title="Nikdo neodpovídá filtru"
        description="Zkuste hledání zúžit jinak, nebo filtry zrušte."
      />

      <ul v-else class="guests">
        <li v-for="guest in store.filtered" :key="guest.id" class="guest card">
          <div class="who">
            <p class="name">{{ store.displayName(guest) }}</p>
            <p class="meta">
              {{ GUEST_SIDE_LABELS[guest.side] }} · {{ AGE_GROUP_LABELS[guest.ageGroup] }}
              <template v-if="guest.note"> · {{ guest.note }}</template>
            </p>
          </div>

          <div class="controls">
            <button
              type="button"
              class="status-button"
              :title="`Změnit stav (nyní ${GUEST_STATUS_LABELS[guest.status]})`"
              @click="cycleStatus(guest)"
            >
              <StatusBadge :status="guest.status" />
            </button>

            <button type="button" class="icon-button" @click="openEdit(guest)">
              <span class="visually-hidden">Upravit hosta</span>
              <span aria-hidden="true">✏️</span>
            </button>

            <button type="button" class="icon-button" @click="removeGuest(guest)">
              <span class="visually-hidden">Smazat hosta</span>
              <span aria-hidden="true">🗑️</span>
            </button>
          </div>
        </li>
      </ul>
    </template>

    <FabButton label="Host" @click="openCreate" />

    <BottomSheet v-model:open="sheetOpen" :title="editing ? 'Upravit hosta' : 'Nový host'">
      <form class="sheet-form" novalidate @submit.prevent="submit">
        <div class="row">
          <FormField
            v-model="form.firstName"
            label="Jméno"
            required
            :error="formErrors['firstName']"
          />
          <FormField
            v-model="form.lastName"
            label="Příjmení"
            required
            :error="formErrors['lastName']"
          />
        </div>

        <ChoiceField
          v-model="form.side"
          label="Strana"
          :options="[
            { value: 'groom', label: GUEST_SIDE_LABELS.groom },
            { value: 'bride', label: GUEST_SIDE_LABELS.bride },
          ]"
        />

        <ChoiceField
          v-model="form.ageGroup"
          label="Věková skupina"
          :options="[
            { value: 'adult', label: AGE_GROUP_LABELS.adult },
            { value: 'child', label: AGE_GROUP_LABELS.child },
          ]"
        />

        <ChoiceField v-model="form.status" label="Stav" :options="statusOptions" />

        <FormField v-model="form.note" label="Poznámka" textarea :error="formErrors['note']" />

        <p v-if="formErrors['form']" class="form-error" role="alert">{{ formErrors['form'] }}</p>

        <button type="submit" class="btn btn-primary" :disabled="saving">
          {{ saving ? 'Ukládám…' : 'Uložit' }}
        </button>
      </form>
    </BottomSheet>
  </div>
</template>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.stat {
  padding: var(--space-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  text-align: center;
}

.stat .value {
  display: block;
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.1;
}

.stat .value.accepted {
  color: var(--color-success);
}

.stat .value.requested {
  color: var(--amber-500);
}

.stat .label {
  color: var(--color-muted);
  font-size: 0.6875rem;
}

.split {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-2);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--sand-100);
}

.split dt {
  color: var(--color-muted);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
}

.split dd {
  margin: 0;
  font-weight: 600;
}

.filters {
  margin-top: var(--space-3);
}

.selects {
  display: grid;
  /* Sloupců je tolik, kolik se jich vejde – na mobilu dva, na tabletu čtyři. */
  grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
  gap: 0.5rem;
  margin-top: var(--space-1);
}

.selects label {
  display: block;
}

.selects span {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

select {
  width: 100%;
  min-height: var(--touch-target);
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.clear {
  margin-top: var(--space-1);
  font-size: 0.875rem;
}

.guests {
  display: grid;
  gap: 0.5rem;
  margin-top: var(--space-2);
}

/* Na mobilu karty, na širších displejích hutnější řádky (kap. 5.3). */
.guest {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  align-items: center;
  justify-content: space-between;
  padding: var(--space-1) var(--space-2);
}

.name {
  font-weight: 600;
}

.meta {
  color: var(--color-muted);
  font-size: 0.8125rem;
}

.controls {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.status-button,
.icon-button {
  display: grid;
  place-items: center;
  min-width: var(--touch-target);
  min-height: var(--touch-target);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  cursor: pointer;
}

.status-button {
  min-width: auto;
  padding-inline: 0.25rem;
}

.status-button:hover,
.icon-button:hover {
  background: var(--sand-100);
}

.sheet-form {
  display: grid;
  gap: var(--space-2);
}

.row {
  display: grid;
  gap: var(--space-2);
}

.form-error {
  color: var(--color-danger);
}

@media (min-width: 560px) {
  .row {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
