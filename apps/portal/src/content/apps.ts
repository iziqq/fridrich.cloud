import { PERSONAL_DATA_COLLECTION_ENABLED } from '@fridrich/shared';
import { budgyApp } from '@/budgy/app';
import { weddyApp } from '@/weddy/app';

/**
 * Aplikace portálu.
 *
 * Úvodní stránka je rozcestník: tenhle seznam je jediné místo, kde se řídí,
 * co na ní stojí. Každý produkt si svůj popis drží u sebe (`<produkt>/app.ts`),
 * takže přidání další aplikace je nová routa, nový popis a jeden řádek tady.
 *
 * Texty (název, věta pod ním) jsou v katalogu pod `portal.apps.items.<id>`,
 * ne tady – rozhraní je česky i anglicky (CLAUDE.md, pravidlo 28).
 */
export interface PortalApp {
  /** Klíč do katalogu textů i do seznamu; zároveň `id` dlaždice. */
  id: string;
  /** Cesta v portálu. Chybí, dokud aplikace nemá co ukázat. */
  path?: string;
  status: 'live' | 'development' | 'planned';
  icon: string;
  /** Vyžaduje účet – dlaždice to řekne dřív, než uživatel klikne. */
  requiresAccount: boolean;
}

/*
 * Aplikace s účtem se bez zapnutého sběru osobních údajů nedají otevřít
 * (routy se vůbec nezaregistrují), takže dlaždice vede jen na popis a
 * neslibuje něco, co skončí na 404.
 */
function withAccess(app: PortalApp): PortalApp {
  if (!app.requiresAccount || PERSONAL_DATA_COLLECTION_ENABLED) return app;
  return { ...app, path: undefined };
}

export const portalApps: PortalApp[] = [weddyApp, budgyApp].map(withAccess);
