import type { EmailMessage } from '../../domain/identity/EmailSender.js';

/**
 * Texty odchozích e-mailů.
 *
 * Držené pohromadě, aby šlo jedním pohledem zkontrolovat, co uživateli chodí,
 * a aby se tón dal sjednotit bez prohledávání use-casů.
 */

interface Action {
  label: string;
  url: string;
}

function layout(title: string, body: string, tail: { action?: Action; code?: string }): string {
  const action = tail.action
    ? `<a href="${tail.action.url}" style="display:inline-block;padding:12px 24px;background:#fcee0a;color:#050506;font-weight:700;text-decoration:none">${tail.action.label}</a>
      <p style="margin:24px 0 0;font-size:12px;color:#8a8a93">
        Pokud tlačítko nefunguje, otevřete tento odkaz:<br />
        <span style="color:#00f0ff;word-break:break-all">${tail.action.url}</span>
      </p>`
    : '';

  // Kód je hlavní obsah e-mailu, takže dostane velké monospace písmo
  // s rozestupy – opisuje se obvykle z mobilu do jiného okna.
  const code = tail.code
    ? `<p style="margin:0;padding:16px 24px;background:#050506;border:1px solid #1f1f25;font-family:ui-monospace,monospace;font-size:32px;letter-spacing:.32em;color:#fcee0a;text-align:center">${tail.code}</p>`
    : '';

  return `<!doctype html>
<html lang="cs">
  <body style="margin:0;padding:24px;background:#050506;font-family:system-ui,sans-serif;color:#e8e8ea">
    <div style="max-width:520px;margin:0 auto;padding:24px;background:#0e0e11;border:1px solid #1f1f25">
      <p style="margin:0 0 16px;font-size:12px;letter-spacing:.12em;color:#00f0ff">// FRIDRICH.CLOUD</p>
      <h1 style="margin:0 0 16px;font-size:22px;text-transform:uppercase">${title}</h1>
      <p style="margin:0 0 24px;line-height:1.7;color:#8a8a93">${body}</p>
      ${action}${code}
    </div>
  </body>
</html>`;
}

export function verificationEmail(to: string, verifyUrl: string): EmailMessage {
  return {
    to,
    subject: 'Aktivujte svůj účet – fridrich.cloud',
    text: `Vítejte na fridrich.cloud.\n\nÚčet aktivujete otevřením odkazu:\n${verifyUrl}\n\nOdkaz platí 24 hodin a rovnou vás přihlásí. Pokud jste se neregistrovali, tento e-mail ignorujte.`,
    html: layout(
      'Aktivujte svůj účet',
      'Vítejte. Otevřením odkazu potvrdíte, že vám tahle adresa patří, a rovnou vás přihlásíme – odkaz platí 24 hodin. Pokud jste se neregistrovali, e-mail prostě ignorujte.',
      { action: { label: 'Aktivovat účet', url: verifyUrl } },
    ),
  };
}

export function loginCodeEmail(to: string, code: string, minutes: number): EmailMessage {
  return {
    to,
    subject: `${code} – přihlašovací kód fridrich.cloud`,
    text: `Váš přihlašovací kód je ${code}.\n\nPlatí ${minutes} minut a jde použít jen jednou. Pokud jste se nepřihlašovali, nic nedělejte – bez kódu se do účtu nikdo nedostane.`,
    html: layout(
      'Přihlašovací kód',
      `Opište kód do okna, kde jste se přihlašovali. Platí ${minutes} minut a jde použít jen jednou. Pokud jste se nepřihlašovali, nic nedělejte – bez kódu se do účtu nikdo nedostane.`,
      { code },
    ),
  };
}

/**
 * Odpověď na registraci na už obsazenou adresu.
 *
 * Registrační formulář odpovídá stejně, ať účet vznikl, nebo ne. Majitel
 * schránky se ale o pokusu dozví – a když to byl on sám, dostane rovnou
 * cestu dál místo mlčení.
 */
export function accountExistsEmail(to: string, loginUrl: string): EmailMessage {
  return {
    to,
    subject: 'Účet už existuje – fridrich.cloud',
    text: `Na tuhle adresu je už účet založený, takže jsme nezakládali další.\n\nPřihlásíte se zde:\n${loginUrl}\n\nHeslo nepotřebujete – pošleme vám kód na tenhle e-mail. Pokud jste se o registraci nepokoušeli, e-mail ignorujte.`,
    html: layout(
      'Účet už existuje',
      'Na tuhle adresu je už účet založený, takže jsme nezakládali další. Přihlásíte se bez hesla – pošleme vám kód na tenhle e-mail. Pokud jste se o registraci nepokoušeli, e-mail ignorujte.',
      { action: { label: 'Přihlásit se', url: loginUrl } },
    ),
  };
}

/**
 * Upozornění před smazáním neaktivního účtu.
 *
 * Plánování svatby může ležet měsíce ladem – uživatel se má dozvědět dřív,
 * než o data přijde, a stačí mu se přihlásit.
 */
export function inactiveAccountWarningEmail(to: string, loginUrl: string, days: number): EmailMessage {
  return {
    to,
    subject: 'Váš účet se brzy smaže – fridrich.cloud',
    text: `Na fridrich.cloud jste se už dlouho nepřihlásili. Pokud se nepřihlásíte do ${days} dní, účet i všechna data v aplikacích (například plánování v IziWeddy) smažeme.\n\nÚčet si ponecháte tím, že se přihlásíte:\n${loginUrl}\n\nPokud účet nepotřebujete, nemusíte nic dělat.`,
    html: layout(
      'Váš účet se brzy smaže',
      `Na fridrich.cloud jste se už dlouho nepřihlásili. Pokud se nepřihlásíte do ${days} dní, účet i všechna data v aplikacích (například plánování v IziWeddy) smažeme. Pokud účet nepotřebujete, nemusíte nic dělat.`,
      { action: { label: 'Přihlásit se a účet ponechat', url: loginUrl } },
    ),
  };
}

/** Potvrzení smazání účtu – `reason` doplňuje větu „Účet jsme smazali …". */
export function accountDeletedEmail(to: string, reason: string): EmailMessage {
  return {
    to,
    subject: 'Účet byl smazán – fridrich.cloud',
    text: `Váš účet na fridrich.cloud jsme smazali ${reason}. Spolu s ním jsme smazali i data v aplikacích (například plánování v IziWeddy).\n\nTento e-mail je poslední, který od nás v souvislosti s účtem dostanete.`,
    html: layout(
      'Účet byl smazán',
      `Váš účet na fridrich.cloud jsme smazali ${reason}. Spolu s ním jsme smazali i data v aplikacích (například plánování v IziWeddy). Tento e-mail je poslední, který od nás v souvislosti s účtem dostanete.`,
      {},
    ),
  };
}
