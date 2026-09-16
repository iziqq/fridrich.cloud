/**
 * Osobní údaje (GDPR) – vypínač sběru, verze právních dokumentů a lhůty uchování.
 *
 * Hodnoty čte frontend (texty zásad a podmínek) i API (registrace, mazání
 * starých dat), takže lhůta uvedená v dokumentu je vždy ta, kterou kód
 * opravdu dodržuje. Postup a důvody: doc/wiki/architecture/personalData.md.
 */

/**
 * Sběr osobních údajů přes web.
 *
 * Vypnutý stav skryje kontaktní formulář, registraci, přihlášení a IziWeddy
 * a API ty endpointy vůbec nezaregistruje – skrytý formulář by nestačil,
 * endpoint by šel zavolat přímo. Zapnutý jen se zveřejněnými zásadami
 * ochrany osobních údajů a obchodními podmínkami.
 */
export const PERSONAL_DATA_COLLECTION_ENABLED: boolean = true;

/** Verze obchodních podmínek; u účtu se ukládá, se kterou uživatel souhlasil. */
export const TERMS_VERSION = '2026-09-15';

/** Verze zásad ochrany osobních údajů. */
export const PRIVACY_POLICY_VERSION = '2026-09-16';

/** Zpráva z kontaktního formuláře se smaže tolik dní po přijetí (TTL v databázi). */
export const CONTACT_MESSAGE_RETENTION_DAYS = 365;

/** Účet bez přihlášení po tolik dní se smaže i s daty v aplikacích. */
export const INACTIVE_ACCOUNT_RETENTION_DAYS = 365;

/** Nepřijatá pozvánka do plánování se smaže po tolika dnech (TTL v databázi). */
export const WEDDING_INVITATION_RETENTION_DAYS = 30;

/** Tolik dní před smazáním neaktivního účtu přijde upozornění e-mailem. */
export const INACTIVE_ACCOUNT_WARNING_DAYS = 30;
