/**
 * Nevratný otisk údaje, který se jen porovnává – nikdy neukazuje.
 *
 * IP adresa u počítadla pokusů nebo e-mail, podle kterého se hledá čekající
 * pozvánka, se nemusí dát přečíst zpátky: stačí poznat, že jde o tutéž
 * hodnotu. Uložený otisk proto při úniku databáze nikoho neprozradí.
 *
 * Implementace používá HMAC s tajným kořením, ne holý hash: IPv4 adres jsou
 * čtyři miliardy a e-maily se dají vzít ze seznamu, takže holý SHA-256 by
 * šlo zpětně dopočítat během chvilky (doc/wiki/architecture/security.md).
 */
export interface Fingerprint {
  of(value: string): string;
}
