/*
 * Sdílené jádro domény IziBudgy – schémata (tvar dat + pravidla polí), výčty,
 * katalogy hlášek (cs/en) a čisté výpočty. Jeden soubor na subdoménu.
 */
export * from './entries.js';
export * from './summary.js';
export * from './messages.js';

/* Formátování částek je společné oběma produktům – bydlí v `@fridrich/shared`. */
export { formatCurrency } from '@fridrich/shared';
