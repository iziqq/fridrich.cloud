import type { Guest, GuestStats } from './models.js';

/** Souhrnné statistiky hostů (doc/iziweddy.md, kap. 5.3). */
export function calculateGuestStats(guests: readonly Guest[]): GuestStats {
  const stats: GuestStats = {
    total: 0,
    accepted: 0,
    requested: 0,
    draft: 0,
    rejected: 0,
    groom: 0,
    bride: 0,
    adults: 0,
    children: 0,
  };

  for (const guest of guests) {
    stats[guest.status] += 1;

    // Do „celkem" se počítají všichni kromě odmítnutých.
    if (guest.status === 'rejected') continue;

    stats.total += 1;
    stats[guest.side] += 1;
    if (guest.ageGroup === 'adult') stats.adults += 1;
    else stats.children += 1;
  }

  return stats;
}

/** Počet celých dní do svatby; záporné číslo znamená, že už proběhla. */
export function daysUntil(isoDate: string | undefined, now = new Date()): number | undefined {
  if (!isoDate) return undefined;
  const target = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(target.getTime())) return undefined;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((target.getTime() - today) / 86_400_000);
}
