import { messageKeys, requiredText, type Catalog } from '@fridrich/shared';
import * as v from 'valibot';

/*
 * Subdoména `scores` – výsledky denní hry MapTap.
 *
 * Hráč nic nevyplňuje: zkopíruje z maptap.gg text, který hra nabízí ke
 * sdílení, a ten se rozebere na datum, body za jednotlivá kola a celkový
 * výsledek. Rozebrání je tady ve sdíleném jádru schválně – formulář tak umí
 * ukázat náhled ještě před odesláním a API přitom nevěří ničemu, co přijde
 * z prohlížeče: parsuje si tentýž text znovu samo.
 *
 * Tvar textu (datum bez roku, pět kol, celkový součet pod nimi):
 *
 *   www.maptap.gg October 9
 *   94:sports_medal: 91:crown: 80:clap: 88:tada: 17:dizzy_face:
 *   Final score: 660
 */

/** Vložený text je lidská kopie z aplikace, ne dokument – delší nemá být. */
export const SCORE_TEXT_MAX = 2000;

/** Víc kol než tohle už nejsou kola, ale nedorozumění při kopírování. */
const ROUNDS_MAX = 20;

const cs = {
  textRequired: 'Vložte výsledek zkopírovaný z MapTapu',
  textTooLong: `Výsledek může mít nejvýše ${SCORE_TEXT_MAX} znaků`,
  dateMissing: 'Ve vloženém textu nevidím datum – zkopírujte i první řádek s „www.maptap.gg“',
  roundsMissing: 'Ve vloženém textu nevidím body za jednotlivá kola',
  finalMissing: 'Ve vloženém textu chybí řádek „Final score“',
  scoreExists: 'Výsledek z tohohle dne už máte zadaný',
};

const en: Catalog<typeof cs> = {
  textRequired: 'Paste the result copied from MapTap',
  textTooLong: `The result can have at most ${SCORE_TEXT_MAX} characters`,
  dateMissing: 'I cannot see a date in the pasted text – copy the first line with "www.maptap.gg" as well',
  roundsMissing: 'I cannot see the points for the individual rounds in the pasted text',
  finalMissing: 'The "Final score" line is missing from the pasted text',
  scoreExists: 'You already have a result for this day',
};

/** Hlášky a popisky subdomény `scores` – jmenný prostor `maptapShared.scores`. */
export const scoresMessages = { cs, en };
export const scoresKeys = messageKeys(cs, 'maptapShared.scores');

/* --- Odznaky kol --- */

/**
 * Žebříček smajlíků, kterým MapTap známkuje kolo – od nejhoršího k nejlepšímu.
 *
 * Opsaný z `emojiScoring` v `js/jjbasics.js` na maptap.gg (48 stupňů, 😁 je
 * tam dvakrát). Hra sdílí **skutečné smajlíky**, ne zkratky; zkratky
 * (`:crown:`) vzniknou až tím, že text projde Slackem nebo Discordem.
 * Pořadí je zachované schválně: jednou se podle něj může dát poznat, jak
 * dobré kolo bylo, i bez čísla.
 *
 * `exploding_head` (🤯) ve škále není – hra ho dává za trefu na nulu
 * kilometrů a za kola, u kterých stupeň nedopočítá.
 */
export const BADGE_EMOJI = {
  skull: '💀',
  face_vomiting: '🤮',
  alien: '👽',
  ghost: '👻',
  sob: '😭',
  scream: '😱',
  nauseated_face: '🤢',
  stuck_out_tongue_closed_eyes: '😝',
  dizzy_face: '😵',
  face_with_symbols_on_mouth: '🤬',
  pleading_face: '🥺',
  ice_cube: '🧊',
  unamused: '😒',
  snowflake: '❄',
  disappointed_relieved: '😥',
  see_no_evil: '🙈',
  sleepy: '😪',
  sleeping: '😴',
  cold_face: '🥶',
  no_mouth: '😶',
  confused: '😕',
  disappointed: '😞',
  fearful: '😨',
  worried: '😟',
  face_with_peeking_eye: '🫣',
  pensive: '😔',
  shushing_face: '🤫',
  face_with_raised_eyebrow: '🤨',
  expressionless: '😑',
  neutral_face: '😐',
  face_with_open_eyes_and_hand_over_mouth: '🫢',
  upside_down_face: '🙃',
  slightly_smiling_face: '🙂',
  grin: '😁',
  joy: '😂',
  hugging_face: '🤗',
  sun_with_face: '🌞',
  clap: '👏',
  sparkles: '✨',
  star2: '🌟',
  mortar_board: '🎓',
  tada: '🎉',
  crown: '👑',
  trophy: '🏆',
  sports_medal: '🏅',
  fire: '🔥',
  dart: '🎯',
  exploding_head: '🤯',
} as const;

export type RoundBadge = keyof typeof BADGE_EMOJI;
export const ROUND_BADGES = Object.keys(BADGE_EMOJI) as RoundBadge[];

/**
 * Jiná jména pro tytéž smajlíky.
 *
 * Každá chatovací aplikace si zkratky pojmenovala po svém – 🏅 je
 * `sports_medal`, `medal` i `medal_sports` podle toho, odkud se text
 * kopíruje. Bez tohohle by se takové kolo ukázalo jen jako číslo.
 */
const BADGE_ALIASES: Record<string, RoundBadge> = {
  medal: 'sports_medal',
  medal_sports: 'sports_medal',
  hugs: 'hugging_face',
  hugging: 'hugging_face',
  vomiting_face: 'face_vomiting',
  face_with_symbols_over_mouth: 'face_with_symbols_on_mouth',
  raised_eyebrow: 'face_with_raised_eyebrow',
  slight_smile: 'slightly_smiling_face',
  upside_down: 'upside_down_face',
};

export function isRoundBadge(value: string | undefined): value is RoundBadge {
  return value !== undefined && value in BADGE_EMOJI;
}

/* Hra sdílí smajlíky; zkratky jsou až druhá cesta, kterou text může přijít. */
const EMOJI_BADGES = new Map<string, RoundBadge>(
  (Object.entries(BADGE_EMOJI) as [RoundBadge, string][]).map(([badge, emoji]) => [emoji, badge]),
);

/** Zkratku srovná na jedno jméno, ať přišla odkudkoli. */
function normalizeBadge(shortcode: string): string {
  return BADGE_ALIASES[shortcode] ?? shortcode;
}

/* --- Rozebrání vloženého textu --- */

const MONTHS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
] as const;

/** `October 9`, `Oct 9` i `October 9, 2026` – rok hra do sdíleného textu nedává. */
const DATE_RE = new RegExp(`\\b(${MONTHS.join('|')})[a-z]*\\s+(\\d{1,2})(?:,?\\s+(\\d{4}))?\\b`, 'iu');

/** `Final score: 660`; dvojtečka je nepovinná, hra si ji může odpustit. */
const FINAL_RE = /\bfinal\s+score\s*:?\s*(\d{1,6})\b/iu;

/** Smajlík: běžný piktogram i se spojovníky, nebo vlajka ze dvou regionálních znaků. */
const EMOJI =
  '(?:\\p{Regional_Indicator}{2}|\\p{Extended_Pictographic}(?:\\uFE0F|\\u200D\\p{Extended_Pictographic})*)';

/**
 * Kolo je číslo a vedle něj odznak – zkratka `:crown:`, nebo smajlík.
 *
 * Odznak je součástí vzoru schválně: bez něj by se za kolo počítalo každé
 * číslo v textu, tedy i datum nebo celkový výsledek.
 *
 * Pořadí je obojí, protože hra umí sdílet dvěma způsoby: `94🏅` (smajlík za
 * číslem) a se zapnutým nastavením „Show country flags in share" `🇺🇸94`
 * (vlajka před číslem, místo smajlíka). Vlajka není stupeň hodnocení, takže
 * se u takového kola žádný odznak neuloží – jen body.
 */
const ROUND_RE = new RegExp(
  `(?:(\\d{1,4})\\s*(?::([a-z0-9_+-]{1,40}):|(${EMOJI}))|(${EMOJI})\\s*(\\d{1,4}))`,
  'giu',
);

export interface ParsedRound {
  score: number;
  /** Zkratka odznaku bez dvojteček (`crown`); u neznámého smajlíku chybí. */
  badge?: string;
}

export interface ParsedScore {
  /** 1–12. */
  month: number;
  day: number;
  /** Jen když ho vložený text uvádí; jinak se rok dopočítá z dneška. */
  year?: number;
  rounds: ParsedRound[];
  finalScore: number;
}

/** Co z textu nešlo přečíst – každý důvod má svou hlášku u pole. */
export type ScoreParseFailure = 'date' | 'rounds' | 'final';

export type ScoreParseResult =
  | { ok: true; score: ParsedScore }
  | { ok: false; reason: ScoreParseFailure };

/**
 * Hláška ke každému důvodu, proč text nešel přečíst.
 *
 * Jedno místo pro schéma i pro formulář: ten ukazuje chybu rovnou u textu
 * vzatého ze schránky, aniž by čekal na odpověď API, a nesmí přitom tvrdit
 * něco jiného než schéma.
 */
export const SCORE_PARSE_MESSAGES: Record<ScoreParseFailure, string> = {
  date: scoresKeys.dateMissing,
  final: scoresKeys.finalMissing,
  rounds: scoresKeys.roundsMissing,
};

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Den, který v kalendáři existuje; únor se bere s přestupným dnem. */
function isRealDay(month: number, day: number): boolean {
  return month >= 1 && month <= 12 && day >= 1 && day <= (DAYS_IN_MONTH[month - 1] ?? 0);
}

/**
 * Rozebere text zkopírovaný z MapTapu.
 *
 * Postupuje odshora: nejdřív datum, pak celkový výsledek, a teprve ze
 * zbytku čte kola. Každá rozpoznaná část se z textu vyjme, aby se její
 * čísla nemohla připlést do kol.
 */
export function parseScoreText(text: string): ScoreParseResult {
  /* Pevná mezera se z prohlížeče kopíruje běžně a vzory by o ni zakoply. */
  const normalized = text.replace(/[  ]/gu, ' ');

  const date = DATE_RE.exec(normalized);
  if (!date) return { ok: false, reason: 'date' };

  const month = MONTHS.indexOf((date[1] ?? '').slice(0, 3).toLowerCase() as (typeof MONTHS)[number]) + 1;
  const day = Number(date[2]);
  if (!isRealDay(month, day)) return { ok: false, reason: 'date' };

  const withoutDate = normalized.replace(date[0], ' ');

  const final = FINAL_RE.exec(withoutDate);
  if (!final) return { ok: false, reason: 'final' };

  const rest = withoutDate.replace(final[0], ' ');
  const rounds: ParsedRound[] = [];
  for (const match of rest.matchAll(ROUND_RE)) {
    /* Body i odznak můžou přijít v obou pořadích – viz `ROUND_RE`. */
    const points = match[1] ?? match[5];
    const shortcode = match[2]?.toLowerCase();
    const emoji = match[3] ?? match[4];

    const badge = shortcode
      ? normalizeBadge(shortcode)
      : emoji
        ? EMOJI_BADGES.get(emoji)
        : undefined;

    rounds.push({ score: Number(points), ...(badge ? { badge } : {}) });
  }

  if (rounds.length === 0 || rounds.length > ROUNDS_MAX) return { ok: false, reason: 'rounds' };

  const score: ParsedScore = { month, day, rounds, finalScore: Number(final[1]) };
  if (date[3]) score.year = Number(date[3]);

  return { ok: true, score };
}

function isoDate(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Den, ke kterému výsledek patří.
 *
 * Sdílený text z MapTapu rok neobsahuje – „October 9“ tedy znamená poslední
 * devátý říjen, který už byl. Hledá se proto nejbližší takové datum, které
 * není v budoucnosti; čtyři roky zpátky stačí i na 29. únor. Rok uvedený
 * přímo v textu má přednost.
 */
export function resolvePlayedOn(score: ParsedScore, today: string): string {
  if (score.year) return isoDate(score.year, score.month, score.day);

  const thisYear = Number(today.slice(0, 4));
  for (let year = thisYear; year > thisYear - 4; year -= 1) {
    const candidate = isoDate(year, score.month, score.day);
    if (candidate <= today && new Date(`${candidate}T00:00:00.000Z`).getUTCDate() === score.day) {
      return candidate;
    }
  }

  return isoDate(thisYear, score.month, score.day);
}

/** Posun o `delta` dní – `shiftDay('2026-01-01', -1)` je `'2025-12-31'`. */
export function shiftDay(day: string, delta: number): string {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

/* --- Schémata --- */

export const ScoreRoundSchema = v.object({
  score: v.number(),
  badge: v.optional(v.string()),
});
export type ScoreRound = v.InferOutput<typeof ScoreRoundSchema>;

export const MapTapScoreSchema = v.object({
  id: v.string(),
  /** Komu výsledek patří – podle něj se v tabulce spáruje se jménem hráče. */
  userId: v.string(),
  /** Den hry jako `RRRR-MM-DD`; jeden hráč má za den nejvýš jeden výsledek. */
  playedOn: v.string(),
  rounds: v.array(ScoreRoundSchema),
  finalScore: v.number(),
  createdAt: v.string(),
});
export type MapTapScore = v.InferOutput<typeof MapTapScoreSchema>;

/**
 * Co formulář posílá: vložený text, a nic víc.
 *
 * Každý důvod, proč text nešel přečíst, má vlastní hlášku a všechny míří na
 * `text` – uživatel má jedno pole, takže chyba nemá kam jinam dosednout.
 * Stejné schéma drží formulář i tělo požadavku, takže si zjevný překlep
 * odchytí prohlížeč a API ho přesto kontroluje znovu.
 */
export const ScoreTextInputSchema = v.pipe(
  v.object({
    text: requiredText(scoresKeys.textRequired, SCORE_TEXT_MAX, scoresKeys.textTooLong),
  }),
  v.forward(
    v.check((input) => failureOf(input.text) !== 'date', SCORE_PARSE_MESSAGES.date),
    ['text'],
  ),
  v.forward(
    v.check((input) => failureOf(input.text) !== 'final', SCORE_PARSE_MESSAGES.final),
    ['text'],
  ),
  v.forward(
    v.check((input) => failureOf(input.text) !== 'rounds', SCORE_PARSE_MESSAGES.rounds),
    ['text'],
  ),
);
export type ScoreTextInput = v.InferOutput<typeof ScoreTextInputSchema>;

/**
 * Vstup pro doménu: tentýž text, ale už rozebraný na výsledek.
 *
 * Tímhle schématem čte tělo požadavku backend, takže se k doméně dostane
 * rozebraný a otypovaný vstup (CLAUDE.md, pravidlo 14) a nikdy ne čísla
 * napočítaná v prohlížeči.
 */
export const ScoreInputSchema = v.pipe(
  ScoreTextInputSchema,
  v.transform((input) => {
    const result = parseScoreText(input.text);
    /* Sem se nedostane nerozebratelný text – kontroly nad tímhle ho zastaví. */
    if (!result.ok) throw new Error('Text výsledku nešel rozebrat.');
    return result.score;
  }),
);
export type ScoreInput = v.InferOutput<typeof ScoreInputSchema>;

function failureOf(text: string): ScoreParseFailure | undefined {
  const result = parseScoreText(text);
  return result.ok ? undefined : result.reason;
}
