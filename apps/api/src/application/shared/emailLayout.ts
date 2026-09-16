import type { Locale } from '@fridrich/shared';

/**
 * Rozvržení odchozích e-mailů – společné pro všechny domény.
 *
 * Vzhled odpovídá tématu Glass portálu (tmavá + oranžová); e-mailoví klienti
 * neumí rozostření ani proměnné, proto plné barvy přímo ve stylech. Texty
 * jednotlivých e-mailů jsou v `application/<doména>/emails.ts`.
 */

export interface EmailAction {
  label: string;
  url: string;
}

const LAYOUT_TEXT = {
  cs: { fallback: 'Pokud tlačítko nefunguje, otevřete tento odkaz:' },
  en: { fallback: 'If the button does not work, open this link:' },
} satisfies Record<Locale, unknown>;

export function layout(
  locale: Locale,
  title: string,
  body: string,
  tail: { action?: EmailAction; code?: string },
): string {
  const action = tail.action
    ? `<a href="${tail.action.url}" style="display:inline-block;padding:12px 24px;border-radius:999px;background:#ff7a1a;color:#1a0c02;font-weight:600;text-decoration:none">${tail.action.label}</a>
      <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa">
        ${LAYOUT_TEXT[locale].fallback}<br />
        <span style="color:#ffb27a;word-break:break-all">${tail.action.url}</span>
      </p>`
    : '';

  // Kód je hlavní obsah e-mailu, takže dostane velké monospace písmo
  // s rozestupy – opisuje se obvykle z mobilu do jiného okna.
  const code = tail.code
    ? `<p style="margin:0;padding:16px 24px;border-radius:14px;background:#0b0b0e;border:1px solid #2a2a30;font-family:ui-monospace,monospace;font-size:32px;letter-spacing:.32em;color:#ff9a4d;text-align:center">${tail.code}</p>`
    : '';

  return `<!doctype html>
<html lang="${locale}">
  <body style="margin:0;padding:24px;background:#0b0b0e;font-family:Inter,system-ui,-apple-system,sans-serif;color:#f5f5f7">
    <div style="max-width:520px;margin:0 auto;padding:28px;border-radius:20px;background:#17171b;border:1px solid #2a2a30">
      <p style="margin:0 0 16px;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#ff9a4d">fridrich.cloud</p>
      <h1 style="margin:0 0 16px;font-size:24px;font-weight:650;letter-spacing:-.02em">${title}</h1>
      <p style="margin:0 0 24px;line-height:1.7;color:#a1a1aa">${body}</p>
      ${action}${code}
    </div>
  </body>
</html>`;
}

