import { useI18n } from 'vue-i18n';
import { currentLocale } from '@/i18n';

/**
 * Formátování data a odpočtu pro obrazovky subdomény `wedding`.
 *
 * Používá to dashboard i souhrn jednoho plánování – kdyby si každý počítal
 * odpočet sám, rozešly by se hlášky i tvar data.
 */
export function useWeddingFormats() {
  const { t } = useI18n();

  /** Popisek odpočtu – po svatbě má znít jinak než před ní. */
  function countdown(days: number | undefined): string | undefined {
    if (days === undefined) return undefined;
    if (days === 0) return t('weddy.dashboard.today');
    if (days < 0) return t('weddy.dashboard.daysAgo', Math.abs(days));
    return t('weddy.dashboard.daysLeft', days);
  }

  /* Formát data podle jazyka rozhraní – čtení `currentLocale` zajistí překreslení po přepnutí. */
  function formatDate(iso: string | undefined): string {
    if (!iso) return t('weddy.dashboard.noDate');
    return new Date(`${iso}T00:00:00Z`).toLocaleDateString(currentLocale.value, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }

  return { countdown, formatDate };
}
