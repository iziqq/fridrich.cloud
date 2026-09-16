<script setup lang="ts">
import type { AgeGroup, Family, Guest, GuestStatus } from '@fridrich/weddy-shared';
import { GUEST_STATUSES, guestsKeys } from '@fridrich/weddy-shared';
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/http';
import { translateMessage } from '@/i18n';
import BottomSheet from '@/components/product/BottomSheet.vue';
import ChoiceField from '@/components/product/ChoiceField.vue';
import SelectField from '@/components/product/SelectField.vue';
import EmptyState from '@/components/product/EmptyState.vue';
import ErrorBlock from '@/components/product/ErrorBlock.vue';
import FabButton from '@/components/product/FabButton.vue';
import FormField from '@/components/product/FormField.vue';
import LoadingBlock from '@/components/product/LoadingBlock.vue';
import StatusBadge from '@/weddy/components/StatusBadge.vue';
import { askConfirm } from '@/components/product/confirm';
import type { CreateGuestRequest } from './endpoints/createGuest.endpoint';
import { useWeddingStore } from '@/weddy/wedding/wedding.store';
import { GUEST_SORT_LABEL_KEYS, useGuestsStore } from './guests.store';

const route = useRoute();
const store = useGuestsStore();
/* Viewer si seznam prohlédne, ale ovládání nevidí – rozhoduje role ze svatby. */
const weddings = useWeddingStore();
const { t } = useI18n();

const weddingId = computed(() => String(route.params['weddingId'] ?? ''));

/* --- Filtrování --- */

/**
 * Filtry se schovávají do popoveru pod tlačítkem, vedle něj zůstane jen
 * hledání. Na obrazovce tak drží místo seznam hostů, ne čtyři rozbalovátka.
 */
const filtersOpen = ref(false);
const filterPanel = ref<HTMLElement | null>(null);
const filterButton = ref<HTMLElement | null>(null);

/** Řazení je volba zobrazení, ne filtr – do počtu aktivních filtrů se nepočítá. */
const activeFilters = computed(() => {
  const { side, ageGroup, status } = store.filters;
  return [side, ageGroup, status].filter((value) => value !== 'all').length;
});

function toggleFilters(): void {
  filtersOpen.value = !filtersOpen.value;
}

function closeFilters(): void {
  if (!filtersOpen.value) return;
  filtersOpen.value = false;
  filterButton.value?.focus();
}

/* Klik mimo panel i Esc zavírají – popover nesmí zůstat viset přes seznam. */
function onDocumentPointerDown(event: PointerEvent): void {
  if (!filtersOpen.value) return;

  const target = event.target as Node;
  if (filterPanel.value?.contains(target) || filterButton.value?.contains(target)) return;

  filtersOpen.value = false;
}

onMounted(() => document.addEventListener('pointerdown', onDocumentPointerDown));
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocumentPointerDown));

onMounted(() => store.load(weddingId.value));
watch(weddingId, (id) => store.load(id));

/* --- Formulář --- */

const sheetOpen = ref(false);
const editing = ref<Guest | null>(null);
const formErrors = ref<Record<string, string>>({});
const saving = ref(false);

/*
 * Chyby formulářů se drží jako klíče katalogu a překládají se až při
 * vykreslení – po přepnutí jazyka se tak přeloží i chyba, která už svítí.
 */
function errorText(errors: Record<string, string>, field: string): string | undefined {
  const key = errors[field];
  return key ? translateMessage(key) : undefined;
}

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
        : { form: cause instanceof ApiError ? cause.message : 'weddy.guests.saveFailed' };
  } finally {
    saving.value = false;
  }
}

async function removeGuest(guest: Guest): Promise<void> {
  const name = `${guest.firstName} ${guest.lastName}`.trim();
  const confirmed = await askConfirm({
    title: t('weddy.guests.guest.delete'),
    message: t('weddy.guests.guest.confirmDelete', { name }),
    confirmLabel: t('weddy.guests.guest.delete'),
    danger: true,
  });
  if (!confirmed) return;

  await store.remove(weddingId.value, guest.id);
  if (editing.value?.id === guest.id) sheetOpen.value = false;
}

/** Rychlá změna stavu přímo ze seznamu, bez otevírání formuláře (doc/wiki/domains/weddyGuests.md). */
async function cycleStatus(guest: Guest): Promise<void> {
  const order: GuestStatus[] = ['draft', 'requested', 'accepted', 'rejected'];
  const next = order[(order.indexOf(guest.status) + 1) % order.length];
  if (next) await store.setStatus(weddingId.value, guest.id, next);
}

// Volby jsou `computed`, aby se popisky přeložily i po přepnutí jazyka.
const statusOptions = computed(() =>
  GUEST_STATUSES.map((status) => ({
    value: status,
    label: t(guestsKeys.status[status]),
  })),
);

const sideOptions = computed(() => [
  { value: 'groom', label: t(guestsKeys.side.groom) },
  { value: 'bride', label: t(guestsKeys.side.bride) },
]);

const ageOptions = computed(() => [
  { value: 'adult', label: t(guestsKeys.ageGroup.adult) },
  { value: 'child', label: t(guestsKeys.ageGroup.child) },
]);

/*
 * Volby filtrů mají navíc „vše" a vlastní rozbalovátko je chce jako pole,
 * ne jako <option> v šabloně.
 */
const sideFilterOptions = computed(() => [
  { value: 'all', label: t('weddy.guests.filters.allPeople') },
  ...sideOptions.value,
]);

const ageFilterOptions = computed(() => [
  { value: 'all', label: t('weddy.guests.filters.allPeople') },
  ...ageOptions.value,
]);

const statusFilterOptions = computed(() => [
  { value: 'all', label: t('weddy.guests.filters.allStatuses') },
  ...statusOptions.value,
]);

const sortOptions = computed(() => [
  { value: 'lastName', label: t(GUEST_SORT_LABEL_KEYS.lastName) },
  { value: 'firstName', label: t(GUEST_SORT_LABEL_KEYS.firstName) },
]);

function statusTitle(guest: Guest): string {
  return t('weddy.guests.list.changeStatus', { status: t(guestsKeys.status[guest.status]) });
}

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

/**
 * Souhrn, který dává smysl i u sbalené rodiny.
 * České tvary (1 člen, 2–4 členové, 5+ členů) řeší plurály katalogu.
 */
function familySummary(family: Family): string {
  const children = family.members.filter((member) => member.ageGroup === 'child').length;
  const parts = [t('weddy.guests.family.memberCount', family.members.length)];

  if (children > 0) parts.push(t('weddy.guests.family.childCount', children));
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
        : { form: cause instanceof ApiError ? cause.message : 'weddy.guests.saveFailed' };
  } finally {
    savingFamily.value = false;
  }
}

async function removeFamily(family: Family): Promise<void> {
  const count = family.members.length;
  const confirmed = await askConfirm({
    title: t('weddy.guests.family.delete'),
    message: t('weddy.guests.family.confirmDelete', { name: family.name, n: count }, count),
    confirmLabel: t('weddy.guests.family.delete'),
    danger: true,
  });
  if (!confirmed) return;

  await store.removeFamily(weddingId.value, family.id);
  if (editingFamily.value?.id === family.id) familySheetOpen.value = false;
}
</script>

<template>
  <div>
    <LoadingBlock v-if="store.loading && store.guests.length === 0" />
    <ErrorBlock v-else-if="store.error" :message="translateMessage(store.error)" />

    <template v-else>
      <!-- Souhrn nad tabulkou počítá vždy ze všech hostů, filtr ho nemění. -->
      <ul class="stats">
        <li class="stat">
          <span class="value">{{ store.stats.total }}</span>
          <span class="label">{{ t('weddy.guests.stats.total') }}</span>
        </li>
        <li class="stat">
          <span class="value accepted">{{ store.stats.accepted }}</span>
          <span class="label">{{ t('weddy.guests.stats.accepted') }}</span>
        </li>
        <li class="stat">
          <span class="value requested">{{ store.stats.requested }}</span>
          <span class="label">{{ t('weddy.guests.stats.requested') }}</span>
        </li>
        <li class="stat">
          <span class="value">{{ store.stats.draft }}</span>
          <span class="label">{{ t('weddy.guests.stats.draft') }}</span>
        </li>
      </ul>

      <dl class="split">
        <div>
          <dt>{{ t('weddy.guests.stats.sides') }}</dt>
          <dd>{{ store.stats.groom }} / {{ store.stats.bride }}</dd>
        </div>
        <div>
          <dt>{{ t('weddy.guests.stats.ageGroups') }}</dt>
          <dd>{{ store.stats.adults }} / {{ store.stats.children }}</dd>
        </div>
        <div>
          <dt>{{ t('weddy.guests.stats.rejected') }}</dt>
          <dd>{{ store.stats.rejected }}</dd>
        </div>
      </dl>

      <div class="toolbar">
        <div class="filter" @keydown.esc="closeFilters">
          <button
            ref="filterButton"
            type="button"
            class="btn btn-secondary filter-button"
            :aria-expanded="filtersOpen"
            aria-controls="guest-filters"
            :aria-label="
              activeFilters > 0
                ? t('weddy.guests.filters.buttonActive', { n: activeFilters })
                : undefined
            "
            @click="toggleFilters"
          >
            <span aria-hidden="true">☰</span>
            {{ t('weddy.guests.filters.button') }}
            <span v-if="activeFilters > 0" class="filter-count" aria-hidden="true">{{ activeFilters }}</span>
          </button>

          <div
            v-if="filtersOpen"
            id="guest-filters"
            ref="filterPanel"
            class="popover card"
            role="dialog"
            :aria-label="t('weddy.guests.filters.button')"
          >
            <div class="selects">
              <SelectField
                v-model="store.filters.side"
                :label="t('weddy.guests.filters.side')"
                :options="sideFilterOptions"
              />

              <SelectField
                v-model="store.filters.ageGroup"
                :label="t('weddy.guests.filters.ageGroup')"
                :options="ageFilterOptions"
              />

              <SelectField
                v-model="store.filters.status"
                :label="t('weddy.guests.filters.status')"
                :options="statusFilterOptions"
              />

              <!-- Řazení není filtr, proto ho „Zrušit filtry" nechává být. -->
              <SelectField
                v-model="store.sort"
                :label="t('weddy.guests.filters.sort')"
                :options="sortOptions"
              />
            </div>

            <button
              v-if="store.hasActiveFilters"
              type="button"
              class="btn btn-ghost clear"
              @click="store.resetFilters()"
            >
              {{ t('weddy.guests.filters.clear') }}
            </button>
          </div>
        </div>

        <!-- Hledá i podle názvu rodiny, takže „Novákovi" najde celou rodinu. -->
        <label class="search">
          <span class="visually-hidden">{{ t('weddy.guests.filters.search') }}</span>
          <input
            v-model="store.filters.search"
            type="search"
            :placeholder="t('weddy.guests.filters.searchPlaceholder')"
          />
        </label>
      </div>

      <EmptyState
        v-if="store.guests.length === 0"
        icon="👥"
        :title="t('weddy.guests.empty.noGuestsTitle')"
        :description="t('weddy.guests.empty.noGuestsDescription')"
      />

      <EmptyState
        v-else-if="store.filtered.length === 0"
        icon="🔍"
        :title="t('weddy.guests.empty.noMatchTitle')"
        :description="t('weddy.guests.empty.noMatchDescription')"
      />

      <!--
        Strana není štítek u jména, ale celá sekce. Uvnitř stojí rodiny
        jako jeden blok a pod nimi jednotlivci (doc/wiki/domains/weddyGuests.md).
      -->
      <template v-else>
        <div class="sides">
          <section v-for="group in store.sections" :key="group.side" class="side">
            <h2 class="side-head">
              <span>{{ t(guestsKeys.side[group.side]) }}</span>
              <span class="count mono">{{ group.count }}</span>
            </h2>

            <p v-if="group.count === 0" class="side-empty">{{ t('weddy.guests.list.sideEmpty') }}</p>

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
                  <button
                    v-if="weddings.canEdit"
                    type="button"
                    class="icon-button"
                    @click="openEditFamily(family)"
                  >
                    <span class="visually-hidden">{{ t('weddy.guests.family.edit') }}</span>
                    <span aria-hidden="true">✏️</span>
                  </button>
                  <button
                    v-if="weddings.canEdit"
                    type="button"
                    class="icon-button"
                    @click="removeFamily(family)"
                  >
                    <span class="visually-hidden">{{ t('weddy.guests.family.delete') }}</span>
                    <span aria-hidden="true">🗑️</span>
                  </button>
                </div>
              </header>

              <ul v-show="isFamilyOpen(family.id)" :id="`family-${family.id}`" class="members">
                <li v-for="guest in family.members" :key="guest.id" class="member">
                  <div class="who">
                    <p class="name">{{ store.displayName(guest) }}</p>
                    <p class="meta">
                      {{ t(guestsKeys.ageGroup[guest.ageGroup]) }}
                      <template v-if="guest.note"> · {{ guest.note }}</template>
                    </p>
                  </div>
                  <button
                    type="button"
                    class="status-button"
                    :title="statusTitle(guest)"
                    :disabled="!weddings.canEdit"
                    @click="cycleStatus(guest)"
                  >
                    <StatusBadge kind="guest" :status="guest.status" />
                  </button>
                </li>
              </ul>
            </article>

            <ul v-if="group.solo.length > 0" class="guests">
              <li v-for="guest in group.solo" :key="guest.id" class="guest card">
                <div class="who">
                  <p class="name">{{ store.displayName(guest) }}</p>
                  <p class="meta">
                    {{ t(guestsKeys.ageGroup[guest.ageGroup]) }}
                    <template v-if="guest.note"> · {{ guest.note }}</template>
                  </p>
                </div>

                <div class="controls">
                  <button
                    type="button"
                    class="status-button"
                    :title="statusTitle(guest)"
                    :disabled="!weddings.canEdit"
                    @click="cycleStatus(guest)"
                  >
                    <StatusBadge kind="guest" :status="guest.status" />
                  </button>

                  <button
                    v-if="weddings.canEdit"
                    type="button"
                    class="icon-button"
                    @click="openEdit(guest)"
                  >
                    <span class="visually-hidden">{{ t('weddy.guests.guest.edit') }}</span>
                    <span aria-hidden="true">✏️</span>
                  </button>

                  <button
                    v-if="weddings.canEdit"
                    type="button"
                    class="icon-button"
                    @click="removeGuest(guest)"
                  >
                    <span class="visually-hidden">{{ t('weddy.guests.guest.delete') }}</span>
                    <span aria-hidden="true">🗑️</span>
                  </button>
                </div>
              </li>
            </ul>
          </section>
        </div>
      </template>
    </template>

    <div v-if="weddings.canEdit" class="actions-fab">
      <button type="button" class="btn add-family" @click="openCreateFamily">
        {{ t('weddy.guests.family.add') }}
      </button>
      <FabButton :label="t('weddy.guests.guest.add')" @click="openCreate" />
    </div>

    <BottomSheet
      v-model:open="sheetOpen"
      :title="editing ? t('weddy.guests.guest.edit') : t('weddy.guests.guest.new')"
    >
      <form class="sheet-form" novalidate @submit.prevent="submit">
        <div class="row">
          <FormField
            v-model="form.firstName"
            :label="t('weddy.guests.guest.form.firstName')"
            required
            :error="errorText(formErrors, 'firstName')"
          />
          <FormField
            v-model="form.lastName"
            :label="t('weddy.guests.guest.form.lastName')"
            required
            :error="errorText(formErrors, 'lastName')"
          />
        </div>

        <ChoiceField
          v-model="form.side"
          :label="t('weddy.guests.guest.form.side')"
          :options="sideOptions"
        />

        <ChoiceField
          v-model="form.ageGroup"
          :label="t('weddy.guests.guest.form.ageGroup')"
          :options="ageOptions"
        />

        <ChoiceField
          v-model="form.status"
          :label="t('weddy.guests.guest.form.status')"
          :options="statusOptions"
        />

        <FormField
          v-model="form.note"
          :label="t('weddy.guests.guest.form.note')"
          textarea
          :error="errorText(formErrors, 'note')"
        />

        <p v-if="formErrors['form']" class="form-error" role="alert">
          {{ errorText(formErrors, 'form') }}
        </p>

        <button type="submit" class="btn btn-primary" :disabled="saving">
          {{ saving ? t('weddy.guests.saving') : t('weddy.guests.save') }}
        </button>
      </form>
    </BottomSheet>
    <BottomSheet
      v-model:open="familySheetOpen"
      :title="editingFamily ? t('weddy.guests.family.edit') : t('weddy.guests.family.new')"
    >
      <form class="sheet-form" novalidate @submit.prevent="submitFamily">
        <FormField
          v-model="familyForm.name"
          :label="t('weddy.guests.family.form.name')"
          :placeholder="t('weddy.guests.family.form.namePlaceholder')"
          required
          :error="errorText(familyErrors, 'name')"
        />

        <!-- Strana se volí pro rodinu jako celek, věk u každého člena zvlášť. -->
        <ChoiceField
          v-model="familyForm.side"
          :label="t('weddy.guests.family.form.side')"
          :options="sideOptions"
        />

        <fieldset class="members-field">
          <legend>{{ t('weddy.guests.family.form.members') }}</legend>

          <div v-for="(member, index) in familyForm.members" :key="index" class="member-row">
            <FormField
              v-model="member.firstName"
              :label="t('weddy.guests.family.form.memberFirstName')"
            />
            <ChoiceField
              v-model="member.ageGroup"
              :label="t('weddy.guests.family.form.memberAgeGroup')"
              :options="ageOptions"
            />
            <button
              type="button"
              class="icon-button remove"
              :disabled="familyForm.members.length === 1"
              @click="removeMember(index)"
            >
              <span class="visually-hidden">{{ t('weddy.guests.family.form.removeMember') }}</span>
              <span aria-hidden="true">✕</span>
            </button>
          </div>

          <p v-if="familyErrors['members']" class="form-error" role="alert">
            {{ errorText(familyErrors, 'members') }}
          </p>

          <button type="button" class="btn btn-secondary" @click="addMember">
            {{ t('weddy.guests.family.form.addMember') }}
          </button>
        </fieldset>

        <p v-if="familyErrors['form']" class="form-error" role="alert">
          {{ errorText(familyErrors, 'form') }}
        </p>

        <button type="submit" class="btn btn-primary" :disabled="savingFamily">
          {{ savingFamily ? t('weddy.guests.saving') : t('weddy.guests.family.form.submit') }}
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
  font-size: var(--text-xs);
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
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
}

.split dd {
  margin: 0;
  font-weight: 600;
}

/* Vlevo filtr, vpravo hledání – na mobilu hledání pod tlačítkem. */
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-top: var(--space-3);
}

.filter {
  position: relative;
}

.filter-button {
  gap: 0.4rem;
}

/*
 * Počítadlo aktivních filtrů. Nesmí se jmenovat `.badge`: scoped styl se
 * v Vue propisuje i na kořen dceřiné komponenty, takže by přebarvil
 * `StatusBadge` u každého hosta na růžovo a usekl mu text pevnou výškou.
 */
.filter-count {
  display: grid;
  place-items: center;
  min-width: 1.25rem;
  min-height: 1.25rem;
  padding-inline: 0.3rem;
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-size: var(--text-xs);
}

/*
 * Panel visí pod tlačítkem, ne přes celou obrazovku – na mobilu se ale musí
 * vejít do okna, proto ta horní mez šířky.
 */
.popover {
  position: absolute;
  top: calc(100% + 0.4rem);
  left: 0;
  z-index: 30;
  width: max(16rem, min(22rem, calc(100vw - 2 * var(--gutter))));
  box-shadow: var(--shadow-md);
}

.search {
  flex: 1 1 12rem;
}

.search input {
  width: 100%;
  min-height: var(--touch-target);
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.selects {
  display: grid;
  /* Dva sloupce se do popoveru vejdou i na mobilu. */
  grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
  gap: 0.5rem;
}

.clear {
  margin-top: var(--space-1);
  font-size: var(--text-sm);
}

/* Ženich a nevěsta vedle sebe od tabletu; na mobilu pod sebou. */
.sides {
  display: grid;
  gap: var(--space-3);
  margin-top: var(--space-3);
  align-items: start;
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
  font-size: var(--text-sm);
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
  font-size: var(--text-xs);
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

/* Druhá akce vedle FABu: stejný tvar i barva, jen obtažená místo vyplněné. */
.add-family {
  border-color: var(--color-accent);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-accent);
  box-shadow: var(--shadow-md);
}

.add-family:hover {
  background: var(--rose-50);
  color: var(--rose-700);
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
  font-size: var(--text-xs);
}

.controls {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.status-button:disabled {
  cursor: default;
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

  .sides {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
