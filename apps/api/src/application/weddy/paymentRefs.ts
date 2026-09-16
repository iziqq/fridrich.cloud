/*
 * Odkazy, pod kterými rozpočet zná platby plánování (port `PaymentLedger`).
 *
 * Zvlášť od use-casů, protože je potřebuje plánování (položky, balíčky) i
 * smazání celé svatby – a ty dva moduly se navzájem importovat nemají.
 * Tvar se nesmí měnit: podle něj rozpočet najde už zapsané platby.
 */

/** Stálý odkaz na položku – podle něj rozpočet své zápisy najde i po změnách. */
export function itemRef(weddingId: string, itemId: string): string {
  return `wedding:${weddingId}:item:${itemId}`;
}

export function bundleRef(weddingId: string, bundleId: string): string {
  return `wedding:${weddingId}:bundle:${bundleId}`;
}

/** Předpona všech odkazů jednoho plánování – pro jeho smazání. */
export function weddingRefPrefix(weddingId: string): string {
  return `wedding:${weddingId}:`;
}
