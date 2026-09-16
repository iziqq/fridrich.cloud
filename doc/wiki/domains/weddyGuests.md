---
title: weddy / guests – guests and families
type: domain
sources:
  - raw/iziweddySpec.md (ch. 4.2, 5.3, 7.2, 8)
  - code: packages/weddy-shared/src/guests.ts, apps/api/src/domain/weddy/guests, apps/portal/src/weddy/guests
updated: 2026-09-16
---

# `weddy / guests` – guests and families

> The guest list of one wedding with invitation status. Guests can be entered
> one by one or **a whole family at once**. A family has no record of its own –
> it is a group of guests with the same `family.id`.

## Enums

| Enum | Values (UI label) |
|---|---|
| `GuestSide` | `groom` (Ženich – groom), `bride` (Nevěsta – bride) |
| `AgeGroup` | `adult` (Dospělý – adult), `child` (Dítě – child) |
| `GuestStatus` | `draft` (Návrh – draft), `requested` (Pozván – invited), `accepted` (Přijal – accepted), `rejected` (Odmítl – declined) |

The usual flow is `draft → requested → accepted / rejected`, but **transitions
are not enforced** – the user must be able to fix a mistake.

## Guest

| Field | Rule | Default (domain) |
|---|---|---|
| `firstName` | required, 1–100 | |
| `lastName` | optional, max. 100 (left empty for family members) | |
| `side` | required | for a family member it is set by the family |
| `ageGroup` | optional in the request | `adult` |
| `status` | optional in the request | `draft` |
| `family` | `{ id, name }` – set only by the family use cases | |
| `note` | optional, max. 2000 | |

## Family

Input: name, side for the whole family, list of members (first name, age group).

- **The side belongs to the family** – `Guest.joinFamily` writes it to every
  member, so the family side cannot drift from its members and statistics stay correct.
- **The member list is complete on update:** a member with an `id` is updated,
  one without an `id` is created, anyone missing stops being a guest
  (`rewriteFamily` in `domain/weddy/guests/Family.ts`).
- **Each member** keeps their own invitation status.
- Deleting a family deletes all members. A family without members does not pass
  the schema (1–30 members, name 1–100).
- Editing a guest through the regular form **does not remove them from the family**.
- Model trade-off: renaming or moving a family rewrites all its members.

## List on screen

- A **toolbar** above the list: the *Filtry* (Filters) button on the left, the
  search field on the right. The button opens a **popover** with every filter –
  side, age group, status, sorting and *Zrušit filtry* (Clear filters) – and
  carries a badge with the number of active filters (sorting does not count).
  The popover closes on Esc, on a click outside and returns focus to the button.
  The four choices inside it are `SelectField.vue`, not `<select>`.
  Four dropdowns in a row used to push the list below the fold on a phone.
- **Search** matches the name and the family name, ignoring diacritics
  (`novakovi` finds *Novákovi* with all its members). Filtering happens on the
  client – the list of one wedding is small and the answer is instant.
- Sort by last name (default) or first name; it is not a filter, "Zrušit filtry"
  (Clear filters) keeps it. Ties are broken by the other name, compared with Czech
  collation (`Čermák` after `Cach`).
- Names are shown in sort order (`Novák Petr`).
- The side is a **section** (Groom / Bride), not a tag. Within a section families
  come first as blocks, individuals below. The two sections sit **side by side
  from tablet up** and stack on a phone, so a wide screen shows both lists at once.
- Families are **collapsed** with a summary (`4 členové · 2 děti` – 4 members · 2 children);
  all expand while searching or filtering.
- Two actions in the bottom right: *+ Host* (Add guest) as the filled primary
  pill, *+ Rodina* (Add family) as the same pill outlined in the accent colour –
  one shape, two weights, so the less usual action does not compete with the
  common one.
- Quick status change by clicking the badge (optimistic, reverted on error).
- Cards on narrow screens, denser rows on wider ones.

## Statistics (`calculateGuestStats`)

| Statistic | Calculation |
|---|---|
| `total` | everyone except `rejected` |
| `accepted`, `requested`, `draft`, `rejected` | counts by status |
| `groom`, `bride`, `adults`, `children` | split, excluding declined guests |

Always computed from **all** guests – the filter only changes the list.

## Endpoints

| Endpoint | Method and path | Request → Response |
|---|---|---|
| `listGuests` | `GET …/weddings/{weddingId}/guests` | query `side?`, `ageGroup?`, `status?` → `{ guests: Guest[], stats: GuestStats }` |
| `createGuest` | `POST …/guests` | `GuestInput` → `201 Guest` |
| `updateGuest` | `PUT …/guests/{guestId}` | `GuestInput` → `Guest` |
| `changeGuestStatus` | `PATCH …/guests/{guestId}/status` | `{ status }` → `Guest` |
| `deleteGuest` | `DELETE …/guests/{guestId}` | → `204` |
| `createFamily` | `POST …/families` | `FamilyInput` → `201 Family` |
| `updateFamily` | `PUT …/families/{familyId}` | `FamilyInput` (members with `id`) → `Family` |
| `deleteFamily` | `DELETE …/families/{familyId}` | → `204` |

Prefix `…` = `/api/weddy/weddings/{weddingId}`. There is no read endpoint for
families – they are assembled from the list via `groupIntoFamilies()`.

```jsonc
// POST /api/weddy/weddings/{weddingId}/families
{
  "name": "Novákovi",
  "side": "groom",
  "members": [
    { "firstName": "Josef", "ageGroup": "adult" },
    { "firstName": "Themos", "ageGroup": "child" }
  ]
}
```

## Code

| Layer | File |
|---|---|
| Shared kernel | `packages/weddy-shared/src/guests.ts` – enums, `GuestSchema`, `GuestInputSchema`, `FamilyInputSchema`, `FamilySchema`, `GuestStatsSchema`, `calculateGuestStats`, `groupIntoFamilies`, `guestFullName` |
| Domain | `apps/api/src/domain/weddy/guests/Guest.ts`, `Family.ts`, `GuestRepository.ts` |
| Use cases | `apps/api/src/application/weddy/guests.ts` (guests and families) |
| Endpoints | `apps/api/src/endpoints/weddy/guests/`, `apps/portal/src/weddy/guests/endpoints/` |
| Store | `guests.store.ts` – `filters`, `sort`, `filtered`, `sections`, `stats`, `create`, `update`, `setStatus`, `remove`, `addFamily`, `editFamily`, `removeFamily` |
| UI | `GuestsView.vue` |
| Storage | container `guests`, PK `/weddingId` |

## Related

- [weddy](weddy.md) · [wedding](weddyWedding.md)
