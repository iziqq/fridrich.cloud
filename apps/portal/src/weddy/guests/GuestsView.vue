<script setup lang="ts">
import type { AgeGroup, Family, Guest, GuestStatus } from '@fridrich/weddy-shared';
import {
  AGE_GROUP_LABELS,
  GUEST_SIDE_LABELS,
  GUEST_STATUSES,
  GUEST_STATUS_LABELS,
} from '@fridrich/weddy-shared';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/http';
import BottomSheet from '@/weddy/components/BottomSheet.vue';
import ChoiceField from '@/weddy/components/ChoiceField.vue';
import EmptyState from '@/weddy/components/EmptyState.vue';
import ErrorBlock from '@/weddy/components/ErrorBlock.vue';
import FabButton from '@/weddy/components/FabButton.vue';
import FormField from '@/weddy/components/FormField.vue';
import LoadingBlock from '@/weddy/components/LoadingBlock.vue';
import StatusBadge from '@/weddy/components/StatusBadge.vue';
import type { CreateGuestRequest } from './endpoints/createGuest.endpoint';
import { GUEST_SORT_LABELS, useGuestsStore } from './guests.store';

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
  } as CreateGuestRequest;

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

/** Rychlá změna stavu přímo ze seznamu, bez otevírání formuláře (doc/wiki/domains/weddyGuests.md). */
async function cycleStatus(guest: Guest): Promise<void> {
  const order: GuestStatus[] = ['draft', 'requested', 'accepted', 'rejected'];
  const next = order[(order.indexOf(guest.status) + 1) % order.length];
  if (next) await store.setStatus(weddingId.value, guest.id, next);
}

const statusOptions = GUEST_STATUSES.map((status) => ({
  value: status,
  label: GUEST_STATUS_LABELS[status],
}));

const sideOptions = [
  { value: 'groom', label: GUEST_SIDE_LABELS.groom },
  { value: 'bride', label: GUEST_SIDE_LABELS.bride },
];

const ageOptions = [
  { value: 'adult', label: AGE_GROUP_LABELS.adult },
  { value: 'child', label: AGE_GROUP_LABELS.child },
];

/* --- Rodina --- */

interface MemberRow {
  id?: string;
  firstName: string;
  ageGroup: AgeGroup;
}

/*
 * Sbalené rodiny.
 *
 * Výchozí stav je sbalený – deset rodin po čtyřech členech je čtyřicet řádků
 * a přehled se ztratí. V hlavičce proto zůstává souhrn, aby i sbalená rodina
 * něco říkala.
 */
const expandedFamilies = ref(new Set<string>());

function toggleFamily(familyId: string): void {
  const next = new Set(expandedFamilies.value);
  if (!next.delete(familyId)) next.add(familyId);
  expandedFamilies.value = next;
}

/*
 * Při hledání a filtrování se rozbalí všechno. Shoda schovaná ve sbalené
 * rodině by vypadala, že host neexistuje.
 */
function isFamilyOpen(familyId: string): boolean {
  return store.hasActiveFilters || expandedFamilies.value.has(familyId);
}

/** České tvary: 1 člen, 2–4 členové, 5+ členů. */
function plural(count: number, one: string, few: string, many: string): string {
  if (count === 1) return `${count} ${one}`;
  if (count >= 2 && count <= 4) return `${count} ${few}`;
  return `${count} ${many}`;
}

/** Souhrn, který dává smysl i u sbalené rodiny. */
function familySummary(family: Family): string {
  const children = family.members.filter((member) => member.ageGroup === 'child').length;
  const parts = [plural(family.members.length, 'člen', 'členové', 'členů')];

  if (children > 0) parts.push(plural(children, 'dítě', 'děti', 'dětí'));
  return parts.join(' · ');
}

const familySheetOpen = ref(false);
const editingFamily = ref<Family | null>(null);
const familyErrors = ref<Record<string, string>>({});
const savingFamily = ref(false);

const familyForm = reactive({
  name: '',
  side: 'groom',
  members: [] as MemberRow[],
});

function emptyMember(): MemberRow {
  return { firstName: '', ageGroup: 'adult' };
}

function openCreateFamily(): void {
  editingFamily.value = null;
  Object.assign(familyForm, { name: '', side: 'groom', members: [emptyMember(), emptyMember()] });
  familyErrors.value = {};
  familySheetOpen.value = true;
}

function openEditFamily(family: Family): void {
  editingFamily.value = family;
  Object.assign(familyForm, {
    name: family.name,
    side: family.side,
    members: family.members.map((member) => ({
      id: member.id,
      firstName: member.firstName,
      ageGroup: member.ageGroup,
    })),
  });
  familyErrors.value = {};
  familySheetOpen.value = true;
}

function addMember(): void {
  familyForm.members.push(emptyMember());
}

function removeMember(index: number): void {
  familyForm.members.splice(index, 1);
}

async function submitFamily(): Promise<void> {
  familyErrors.value = {};
  savingFamily.value = true;

  // Prázdné řádky jsou jen nedopsané kolonky, ne chyba – zahodí se.
  const input = {
    name: familyForm.name.trim(),
    side: familyForm.side,
    members: familyForm.members
      .filter((member) => member.firstName.trim() !== '')
      .map((member) => ({
        ...(member.id ? { id: member.id } : {}),
        firstName: member.firstName.trim(),
        ageGroup: member.ageGroup,
      })),
  } as Parameters<typeof store.addFamily>[1];

  try {
    if (editingFamily.value) {
      await store.editFamily(weddingId.value, editingFamily.value.id, input);
    } else {
      await store.addFamily(weddingId.value, input);
    }
    familySheetOpen.value = false;
  } catch (cause) {
    familyErrors.value =
      cause instanceof ApiError && cause.details.length > 0
        ? cause.fieldErrors
        : { form: cause instanceof ApiError ? cause.message : 'Uložení se nepodařilo.' };
  } finally {
    savingFamily.value = false;
  }
}

async function removeFamily(family: Family): Promise<void> {
  const count = family.members.length;
  if (!window.confirm(`Opravdu smazat rodinu ${family.name} včetně ${count} členů?`)) return;

  await store.removeFamily(weddingId.value, family.id);
  if (editingFamily.value?.id === family.id) familySheetOpen.value = false;
}
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

      <!--
        Strana není štítek u jména, ale celá sekce. Uvnitř stojí rodiny
        jako jeden blok a pod nimi jednotlivci (doc/wiki/domains/weddyGuests.md).
      -->
      <template v-else>
        <section v-for="group in store.sections" :key="group.side" class="side">
          <h2 class="side-head">
            <span>{{ GUEST_SIDE_LABELS[group.side] }}</span>
            <span class="count mono">{{ group.count }}</span>
          </h2>

          <p v-if="group.count === 0" class="side-empty">Zatím nikdo</p>

          <article v-for="family in group.families" :key="family.id" class="family">
            <header class="family-head">
              <!--
                Sbalovací tlačítko nesmí obalit i akce – tlačítko v tlačítku
                je neplatné HTML a klávesnice se v něm ztratí.
              -->
              <button
                type="button"
                class="family-toggle"
                :aria-expanded="isFamilyOpen(family.id)"
                :aria-controls="`family-${family.id}`"
                @click="toggleFamily(family.id)"
              >
                <span class="chevron" :class="{ open: isFamilyOpen(family.id) }" aria-hidden="true">
                  ▸
                </span>
                <span class="family-text">
                  <span class="family-name">{{ family.name }}</span>
                  <span class="meta">{{ familySummary(family) }}</span>
                </span>
              </button>
              <div class="controls">
                <button type="button" class="icon-button" @click="openEditFamily(family)">
                  <span class="visually-hidden">Upravit rodinu</span>
                  <span aria-hidden="true">✏️</span>
                </button>
                <button type="button" class="icon-button" @click="removeFamily(family)">
                  <span class="visually-hidden">Smazat rodinu</span>
                  <span aria-hidden="true">🗑️</span>
                </button>
              </div>
            </header>

            <ul v-show="isFamilyOpen(family.id)" :id="`family-${family.id}`" class="members">
              <li v-for="guest in family.members" :key="guest.id" class="member">
                <div class="who">
                  <p class="name">{{ store.displayName(guest) }}</p>
                  <p class="meta">
                    {{ AGE_GROUP_LABELS[guest.ageGroup] }}
                    <template v-if="guest.note"> · {{ guest.note }}</template>
                  </p>
                </div>
                <button
                  type="button"
                  class="status-button"
                  :title="`Změnit stav (nyní ${GUEST_STATUS_LABELS[guest.status]})`"
                  @click="cycleStatus(guest)"
                >
                  <StatusBadge :status="guest.status" />
                </button>
              </li>
            </ul>
          </article>

          <ul v-if="group.solo.length > 0" class="guests">
            <li v-for="guest in group.solo" :key="guest.id" class="guest card">
              <div class="who">
                <p class="name">{{ store.displayName(guest) }}</p>
                <p class="meta">
                  {{ AGE_GROUP_LABELS[guest.ageGroup] }}
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
        </section>
      </template>
    </template>

    <div class="actions-fab">
      <button type="button" class="btn btn-secondary" @click="openCreateFamily">+ Rodina</button>
      <FabButton label="Host" @click="openCreate" />
    </div>

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
    <BottomSheet
      v-model:open="familySheetOpen"
      :title="editingFamily ? 'Upravit rodinu' : 'Nová rodina'"
    >
      <form class="sheet-form" novalidate @submit.prevent="submitFamily">
        <FormField
          v-model="familyForm.name"
          label="Název rodiny"
          placeholder="Novákovi"
          required
          :error="familyErrors['name']"
        />

        <!-- Strana se volí pro rodinu jako celek, věk u každého člena zvlášť. -->
        <ChoiceField v-model="familyForm.side" label="Strana" :options="sideOptions" />

        <fieldset class="members-field">
          <legend>Členové</legend>

          <div v-for="(member, index) in familyForm.members" :key="index" class="member-row">
            <FormField v-model="member.firstName" label="Jméno" />
            <ChoiceField v-model="member.ageGroup" label="Věk" :options="ageOptions" />
            <button
              type="button"
              class="icon-button remove"
              :disabled="familyForm.members.length === 1"
              @click="removeMember(index)"
            >
              <span class="visually-hidden">Odebrat člena</span>
              <span aria-hidden="true">✕</span>
            </button>
          </div>

          <p v-if="familyErrors['members']" class="form-error" role="alert">
            {{ familyErrors['members'] }}
          </p>

          <button type="button" class="btn btn-secondary" @click="addMember">
            + Další člen
          </button>
        </fieldset>

        <p v-if="familyErrors['form']" class="form-error" role="alert">
          {{ familyErrors['form'] }}
        </p>

        <button type="submit" class="btn btn-primary" :disabled="savingFamily">
          {{ savingFamily ? 'Ukládám…' : 'Uložit rodinu' }}
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

.side {
  margin-top: var(--space-3);
}

.side-head {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: 0.4rem;
  border-bottom: 2px solid var(--color-accent);
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.side-head .count {
  color: var(--color-muted);
}

.side-empty {
  margin-top: var(--space-1);
  color: var(--color-muted);
  font-size: 0.875rem;
}

/* Rodina drží pohromadě vlastním rámečkem, ať je vidět, kam kdo patří. */
.family {
  margin-top: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.family-head {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-1) var(--space-2);
  border-bottom: 1px solid var(--color-border);
  background: var(--sand-100);
}

.family-toggle {
  display: flex;
  flex: 1;
  gap: 0.6rem;
  align-items: center;
  min-height: var(--touch-target);
  margin: calc(var(--space-1) * -1) 0 calc(var(--space-1) * -1) calc(var(--space-2) * -1);
  padding: var(--space-1) var(--space-2);
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.family-text {
  display: grid;
}

.chevron {
  color: var(--color-muted);
  transition: transform var(--dur-fast) var(--ease);
}

.chevron.open {
  transform: rotate(90deg);
}

.family-name {
  font-weight: 600;
}

.members {
  display: grid;
}

.member {
  display: flex;
  gap: var(--space-1);
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem var(--space-2);
}

.member + .member {
  border-top: 1px solid var(--color-border);
}

.members-field {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.members-field legend {
  padding-inline: 0.4rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.member-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 0.5rem;
  align-items: end;
}

.member-row .remove:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.actions-fab {
  position: fixed;
  right: var(--gutter);
  bottom: calc(var(--bottom-nav) + var(--space-2) + env(safe-area-inset-bottom));
  z-index: 40;
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

/* FabButton se pozicuje sám; uvnitř lišty musí zůstat v toku. */
.actions-fab :deep(.fab) {
  position: static;
}

.guests {
  display: grid;
  gap: 0.5rem;
  margin-top: var(--space-2);
}

/* Na mobilu karty, na širších displejích hutnější řádky (doc/wiki/domains/weddyGuests.md). */
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

@media (--tablet) {
  .row {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
