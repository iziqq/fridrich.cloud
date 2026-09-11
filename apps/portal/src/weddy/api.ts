import type {
  BudgetSummary,
  Family,
  FamilyInput,
  Guest,
  GuestInput,
  GuestListResponse,
  PlanningCategory,
  PlanningItem,
  PlanningItemInput,
  PlanningItemStatus,
  GuestStatus,
  Wedding,
  WeddingInput,
  WeddingSummary,
} from '@fridrich/weddy-shared';
import { http } from '@/api/client';

function query(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const serialized = search.toString();
  return serialized ? `?${serialized}` : '';
}

export const weddingsApi = {
  list: () => http.get<WeddingSummary[]>('/weddy/weddings'),
  get: (weddingId: string) => http.get<Wedding>(`/weddy/weddings/${weddingId}`),
  create: (input: WeddingInput) => http.post<Wedding>('/weddy/weddings', input),
  update: (weddingId: string, input: WeddingInput) =>
    http.put<Wedding>(`/weddy/weddings/${weddingId}`, input),
  remove: (weddingId: string) => http.delete(`/weddy/weddings/${weddingId}`),
};

export const guestsApi = {
  list: (weddingId: string) =>
    http.get<GuestListResponse>(`/weddy/weddings/${weddingId}/guests`),
  create: (weddingId: string, input: GuestInput) =>
    http.post<Guest>(`/weddy/weddings/${weddingId}/guests`, input),
  update: (weddingId: string, guestId: string, input: GuestInput) =>
    http.put<Guest>(`/weddy/weddings/${weddingId}/guests/${guestId}`, input),
  setStatus: (weddingId: string, guestId: string, status: GuestStatus) =>
    http.patch<Guest>(`/weddy/weddings/${weddingId}/guests/${guestId}/status`, { status }),
  remove: (weddingId: string, guestId: string) =>
    http.delete(`/weddy/weddings/${weddingId}/guests/${guestId}`),
};

/**
 * Rodiny se nečtou zvlášť – poskládají se ze seznamu hostů přes
 * `groupIntoFamilies()`. Endpointy jsou proto jen zápisové.
 */
export const familiesApi = {
  create: (weddingId: string, input: FamilyInput) =>
    http.post<Family>(`/weddy/weddings/${weddingId}/families`, input),
  update: (weddingId: string, familyId: string, input: FamilyInput) =>
    http.put<Family>(`/weddy/weddings/${weddingId}/families/${familyId}`, input),
  remove: (weddingId: string, familyId: string) =>
    http.delete(`/weddy/weddings/${weddingId}/families/${familyId}`),
};

export const itemsApi = {
  list: (weddingId: string, category?: PlanningCategory) =>
    http.get<PlanningItem[]>(`/weddy/weddings/${weddingId}/items${query({ category })}`),
  create: (weddingId: string, input: PlanningItemInput) =>
    http.post<PlanningItem>(`/weddy/weddings/${weddingId}/items`, input),
  update: (weddingId: string, itemId: string, input: PlanningItemInput) =>
    http.put<PlanningItem>(`/weddy/weddings/${weddingId}/items/${itemId}`, input),
  setStatus: (weddingId: string, itemId: string, status: PlanningItemStatus) =>
    http.patch<PlanningItem>(`/weddy/weddings/${weddingId}/items/${itemId}/status`, { status }),
  remove: (weddingId: string, itemId: string) =>
    http.delete(`/weddy/weddings/${weddingId}/items/${itemId}`),
};

export const budgetApi = {
  get: (weddingId: string) => http.get<BudgetSummary>(`/weddy/weddings/${weddingId}/budget`),
};

export { ApiError } from '@/api/client';
