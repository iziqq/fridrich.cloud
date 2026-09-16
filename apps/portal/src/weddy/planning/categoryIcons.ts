import type { PlanningCategory } from '@fridrich/weddy-shared';

/*
 * Ikony sekcí přípravy.
 *
 * Typ je podle výčtu, ne `Record<string, string>` – na novou sekci by se tak
 * dala zapomenout ikona a v seznamu by zůstalo prázdné místo. Sdílí je přehled
 * plánování i soupis v balíčku, aby tatáž sekce vypadala všude stejně.
 */
export const CATEGORY_ICONS: Record<PlanningCategory, string> = {
  ceremonyVenue: '⛪',
  receptionVenue: '🥂',
  food: '🍽️',
  drinks: '🍷',
  flowers: '💐',
  decorations: '🎀',
  music: '🎵',
  suit: '🤵',
  dress: '👰',
  rings: '💍',
  bachelorParty: '🎉',
  otherActivities: '✨',
};
