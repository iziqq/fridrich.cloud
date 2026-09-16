/**
 * Kam se propisují uhrazené platby plánování.
 *
 * Port domény weddy (CLAUDE.md, pravidlo 3): plánování samo neví, že
 * existuje IziBudgy. Řekne jen „tahle věc má teď uhrazené tyhle platby" a
 * implementace z domény budgy se propojí až v `infrastructure/container.ts`.
 */

/** Která platba to je: záloha, doplatek po záloze, nebo celá cena naráz. */
export type LedgerPart = 'deposit' | 'rest' | 'full';

export interface LedgerPayment {
  part: LedgerPart;
  /** V CZK, celé koruny, vždy kladná. */
  amount: number;
}

export interface PaymentLedger {
  /**
   * Srovná zápisy jedné položky nebo balíčku s tím, co je teď uhrazené.
   *
   * Posílá se vždy celý aktuální seznam: co v něm není, z rozpočtu zmizí,
   * co přibylo, zapíše se, a změněná částka se přepíše. Volání je proto
   * opakovatelné – po chybě stačí položku uložit znovu.
   */
  record(input: {
    /** Komu se nový zápis připíše – správce plánování. */
    ownerId: string;
    /** Stálý odkaz na položku nebo balíček, např. `wedding:w1:item:i2`. */
    ref: string;
    /** Cesta v portálu, kam zápis prokliká. */
    path: string;
    name: string;
    payments: readonly LedgerPayment[];
  }): Promise<void>;

  /**
   * Položka nebo balíček zmizely.
   *
   * Zápisy nezmizí – peníze odešly – jen se odpojí a stanou se běžnými výdaji.
   * Hledá se přesná shoda: `…:item:i1` je předponou i `…:item:i10`.
   */
  release(ref: string): Promise<void>;

  /** Zmizelo celé plánování – odpojí zápisy všech jeho položek a balíčků. */
  releaseAll(refPrefix: string): Promise<void>;
}
