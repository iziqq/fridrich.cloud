import type { AgeGroup, Guest, GuestSide, GuestStatus } from '@fridrich/weddy-shared';
import { calculateGuestStats, groupIntoFamilies, guestFullName } from '@fridrich/weddy-shared';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { changeGuestStatus } from './endpoints/changeGuestStatus.endpoint';
import { createFamily, type CreateFamilyRequest } from './endpoints/createFamily.endpoint';
import { createGuest, type CreateGuestRequest } from './endpoints/createGuest.endpoint';
import { deleteFamily } from './endpoints/deleteFamily.endpoint';
import { deleteGuest } from './endpoints/deleteGuest.endpoint';
import { listGuests } from './endpoints/listGuests.endpoint';
import { updateFamily, type UpdateFamilyRequest } from './endpoints/updateFamily.endpoint';
import { updateGuest, type UpdateGuestRequest } from './endpoints/updateGuest.endpoint';

export interface GuestFilters {
  side: GuestSide | 'all';
  ageGroup: AgeGroup | 'all';
  status: GuestStatus | 'all';
  search: string;
}

function emptyFilters(): GuestFilters {
  return { side: 'all', ageGroup: 'all', status: 'all', search: '' };
}

/** Podle čeho se seznam řadí. Není to filtr – „Zrušit filtry" volbu nechá být. */
export type GuestSort = 'lastName' | 'firstName';

export const GUEST_SORT_LABELS: Record<GuestSort, string> = {
  lastName: 'Příjmení',
  firstName: 'Jméno',
};

/**
 * Porovnání dvou hostů podle zvoleného pole.
 *
 * Při shodě rozhodne to druhé jméno, ať se dva Novákovi neřadí podle toho,
 * kdy je kdo zapsal. `localeCompare` s češtinou si poradí i s diakritikou –
 * „Čermák" patří za „Cach", ne až za „Žák".
 */
function compareBy(sort: GuestSort): (a: Guest, b: Guest) => number {
  const secondary: GuestSort = sort === 'lastName' ? 'firstName' : 'lastName';

  // Členové rodiny příjmení nemívají – prázdná hodnota je řadí na začátek,
  // což je uvnitř rodiny to, co chceme.
  const key = (guest: Guest, field: GuestSort): string => guest[field] ?? '';

  return (a, b) =>
    key(a, sort).localeCompare(key(b, sort), 'cs') ||
    key(a, secondary).localeCompare(key(b, secondary), 'cs');
}

/** Vyhledávání nesmí padat na diakritice – „Novak" musí najít „Novák". */
function normalize(value: string): string {
  return value
    .toLocaleLowerCase('cs-CZ')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

/**
 * Stav subdomény `guests` – hosté, rodiny, filtry a řazení.
 *
 * Akce se jmenují podle změny stavu (`addFamily`), ne podle endpointu
 * (`createFamily`), který volají.
 */
export const useGuestsStore = defineStore('guests', () => {
  const guests = ref<Guest[]>([]);
  const filters = ref<GuestFilters>(emptyFilters());
  const sort = ref<GuestSort>('lastName');
  const loading = ref(false);
  const error = ref<string | null>(null);
  const loadedWeddingId = ref<string | null>(null);

  /** Statistiky se počítají ze všech hostů – filtr je neovlivňuje. */
  const stats = computed(() => calculateGuestStats(guests.value));

  const filtered = computed(() => {
    const { side, ageGroup, status, search } = filters.value;
    const needle = normalize(search.trim());

    return guests.value
      .filter((guest) => {
        if (side !== 'all' && guest.side !== side) return false;
        if (ageGroup !== 'all' && guest.ageGroup !== ageGroup) return false;
        if (status !== 'all' && guest.status !== status) return false;
        if (needle === '') return true;
        // Hledá se i podle rodiny, ať „Novákovi" najde celou rodinu.
        return normalize(`${guestFullName(guest)} ${guest.family?.name ?? ''}`).includes(needle);
      })
      .sort(compareBy(sort.value));
  });

  /**
   * Jméno v pořadí, ve kterém se seznam řadí.
   *
   * Bez toho vypadá řazení podle příjmení rozbitě: oko čte první slovo,
   * takže „Jana Adamová, Petr Novák" působí jako náhodné pořadí.
   */
  function displayName(guest: Guest): string {
    if (!guest.lastName) return guest.firstName;

    return sort.value === 'lastName'
      ? `${guest.lastName} ${guest.firstName}`
      : `${guest.firstName} ${guest.lastName}`;
  }

  /**
   * Filtrovaní hosté rozdělení podle strany a uvnitř podle rodin.
   *
   * Strana je v přehledu celá sekce, ne štítek u jména – vedle sebe stojí
   * dva samostatné seznamy (doc/wiki/domains/weddyGuests.md).
   */
  const sections = computed(() =>
    (['groom', 'bride'] as const).map((side) => ({
      side,
      ...groupIntoFamilies(filtered.value, side),
      count: filtered.value.filter((guest) => guest.side === side).length,
    })),
  );

  const hasActiveFilters = computed(() => {
    const { side, ageGroup, status, search } = filters.value;
    return side !== 'all' || ageGroup !== 'all' || status !== 'all' || search.trim() !== '';
  });

  async function load(weddingId: string, force = false): Promise<void> {
    if (!force && loadedWeddingId.value === weddingId) return;

    loading.value = true;
    error.value = null;
    try {
      // Filtruje se na klientu – seznam hostů je malý a odezva je okamžitá.
      const response = await listGuests(weddingId);
      guests.value = response.guests;
      loadedWeddingId.value = weddingId;
    } catch (cause) {
      error.value = (cause as Error).message;
    } finally {
      loading.value = false;
    }
  }

  async function create(weddingId: string, request: CreateGuestRequest): Promise<void> {
    const guest = await createGuest(weddingId, request);
    guests.value = [...guests.value, guest];
  }

  async function update(
    weddingId: string,
    guestId: string,
    request: UpdateGuestRequest,
  ): Promise<void> {
    const guest = await updateGuest(weddingId, guestId, request);
    guests.value = guests.value.map((existing) => (existing.id === guestId ? guest : existing));
  }

  async function setStatus(weddingId: string, guestId: string, status: GuestStatus): Promise<void> {
    const previous = guests.value;
    // Optimistická změna – seznam zůstane svižný i na pomalém připojení.
    guests.value = guests.value.map((guest) =>
      guest.id === guestId ? { ...guest, status } : guest,
    );

    try {
      const updated = await changeGuestStatus(weddingId, guestId, { status });
      guests.value = guests.value.map((guest) => (guest.id === guestId ? updated : guest));
    } catch (cause) {
      guests.value = previous;
      throw cause;
    }
  }

  async function remove(weddingId: string, guestId: string): Promise<void> {
    await deleteGuest(weddingId, guestId);
    guests.value = guests.value.filter((guest) => guest.id !== guestId);
  }

  async function addFamily(weddingId: string, request: CreateFamilyRequest): Promise<void> {
    const family = await createFamily(weddingId, request);
    guests.value = [...guests.value, ...family.members];
  }

  async function editFamily(
    weddingId: string,
    familyId: string,
    request: UpdateFamilyRequest,
  ): Promise<void> {
    const family = await updateFamily(weddingId, familyId, request);
    // Členů mohlo ubýt i přibýt, takže se celá rodina nahradí novým seznamem.
    guests.value = [
      ...guests.value.filter((guest) => guest.family?.id !== familyId),
      ...family.members,
    ];
  }

  async function removeFamily(weddingId: string, familyId: string): Promise<void> {
    await deleteFamily(weddingId, familyId);
    guests.value = guests.value.filter((guest) => guest.family?.id !== familyId);
  }

  function resetFilters(): void {
    filters.value = emptyFilters();
  }

  return {
    guests,
    filters,
    sort,
    filtered,
    sections,
    displayName,
    stats,
    hasActiveFilters,
    loading,
    error,
    load,
    create,
    update,
    setStatus,
    remove,
    addFamily,
    editFamily,
    removeFamily,
    resetFilters,
  };
});
