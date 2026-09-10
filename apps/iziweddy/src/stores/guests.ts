import type { AgeGroup, Guest, GuestInput, GuestSide, GuestStatus } from '@fridrich/weddy-shared';
import { calculateGuestStats } from '@fridrich/weddy-shared';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { guestsApi } from '@/api';

export interface GuestFilters {
  side: GuestSide | 'all';
  ageGroup: AgeGroup | 'all';
  status: GuestStatus | 'all';
  search: string;
}

function emptyFilters(): GuestFilters {
  return { side: 'all', ageGroup: 'all', status: 'all', search: '' };
}

/** Vyhledávání nesmí padat na diakritice – „Novak" musí najít „Novák". */
function normalize(value: string): string {
  return value
    .toLocaleLowerCase('cs-CZ')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

export const useGuestsStore = defineStore('guests', () => {
  const guests = ref<Guest[]>([]);
  const filters = ref<GuestFilters>(emptyFilters());
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
        return normalize(`${guest.firstName} ${guest.lastName}`).includes(needle);
      })
      .sort((a, b) => a.lastName.localeCompare(b.lastName, 'cs'));
  });

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
      const response = await guestsApi.list(weddingId);
      guests.value = response.guests;
      loadedWeddingId.value = weddingId;
    } catch (cause) {
      error.value = (cause as Error).message;
    } finally {
      loading.value = false;
    }
  }

  async function create(weddingId: string, input: GuestInput): Promise<void> {
    const guest = await guestsApi.create(weddingId, input);
    guests.value = [...guests.value, guest];
  }

  async function update(weddingId: string, guestId: string, input: GuestInput): Promise<void> {
    const guest = await guestsApi.update(weddingId, guestId, input);
    guests.value = guests.value.map((existing) => (existing.id === guestId ? guest : existing));
  }

  async function setStatus(weddingId: string, guestId: string, status: GuestStatus): Promise<void> {
    const previous = guests.value;
    // Optimistická změna – seznam zůstane svižný i na pomalém připojení.
    guests.value = guests.value.map((guest) =>
      guest.id === guestId ? { ...guest, status } : guest,
    );

    try {
      const updated = await guestsApi.setStatus(weddingId, guestId, status);
      guests.value = guests.value.map((guest) => (guest.id === guestId ? updated : guest));
    } catch (cause) {
      guests.value = previous;
      throw cause;
    }
  }

  async function remove(weddingId: string, guestId: string): Promise<void> {
    await guestsApi.remove(weddingId, guestId);
    guests.value = guests.value.filter((guest) => guest.id !== guestId);
  }

  function resetFilters(): void {
    filters.value = emptyFilters();
  }

  return {
    guests,
    filters,
    filtered,
    stats,
    hasActiveFilters,
    loading,
    error,
    load,
    create,
    update,
    setStatus,
    remove,
    resetFilters,
  };
});
