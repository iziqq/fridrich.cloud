/**
 * Zdroj času jako závislost, ne jako `new Date()` roztroušené po doméně.
 *
 * Testy expirace tokenů a sessions pak nemusí čekat v reálném čase –
 * podstrčí se jim `FixedClock`.
 */
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

export class FixedClock implements Clock {
  constructor(private current: Date) {}

  now(): Date {
    return this.current;
  }

  advance(milliseconds: number): void {
    this.current = new Date(this.current.getTime() + milliseconds);
  }
}

export function toIso(date: Date): string {
  return date.toISOString();
}
