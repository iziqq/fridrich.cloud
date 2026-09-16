import type { Locale } from '@fridrich/shared';
import type { EmailMessage } from '../../domain/shared/EmailSender.js';
import { layout } from '../shared/emailLayout.js';

/**
 * Texty odchozích e-mailů v češtině a angličtině.
 *
 * Vzhled odpovídá tématu Glass portálu (tmavá + oranžová); e-mailoví klienti
 * neumí rozostření ani proměnné, proto plné barvy přímo ve stylech.
 *
 * Držené pohromadě, aby šlo jedním pohledem zkontrolovat, co uživateli chodí,
 * a aby se tón dal sjednotit bez prohledávání use-casů. Jazyk vybírá use-case:
 * u akce, kterou uživatel právě dělá, jazyk požadavku (`Accept-Language`),
 * u e-mailu z plánovače jazyk uložený u účtu. Na frontendu se tyhle texty
 * nepoužívají, proto nejsou ve vue-i18n katalogu (doc/wiki/architecture/i18n.md).
 */

export function verificationEmail(to: string, verifyUrl: string, locale: Locale): EmailMessage {
  const text = {
    cs: {
      subject: 'Aktivujte svůj účet – fridrich.cloud',
      plain: `Vítejte na fridrich.cloud.\n\nÚčet aktivujete otevřením odkazu:\n${verifyUrl}\n\nOdkaz platí 24 hodin a rovnou vás přihlásí. Pokud jste se neregistrovali, tento e-mail ignorujte.`,
      title: 'Aktivujte svůj účet',
      body: 'Vítejte. Otevřením odkazu potvrdíte, že vám tahle adresa patří, a rovnou vás přihlásíme – odkaz platí 24 hodin. Pokud jste se neregistrovali, e-mail prostě ignorujte.',
      action: 'Aktivovat účet',
    },
    en: {
      subject: 'Activate your account – fridrich.cloud',
      plain: `Welcome to fridrich.cloud.\n\nActivate your account by opening the link:\n${verifyUrl}\n\nThe link is valid for 24 hours and signs you in right away. If you did not register, ignore this e-mail.`,
      title: 'Activate your account',
      body: 'Welcome. Opening the link confirms that this address belongs to you and signs you in right away – the link is valid for 24 hours. If you did not register, simply ignore this e-mail.',
      action: 'Activate account',
    },
  }[locale];

  return {
    to,
    subject: text.subject,
    text: text.plain,
    html: layout(locale, text.title, text.body, { action: { label: text.action, url: verifyUrl } }),
  };
}

export function loginCodeEmail(to: string, code: string, minutes: number, locale: Locale): EmailMessage {
  const text = {
    cs: {
      subject: `${code} – přihlašovací kód fridrich.cloud`,
      plain: `Váš přihlašovací kód je ${code}.\n\nPlatí ${minutes} minut a jde použít jen jednou. Pokud jste se nepřihlašovali, nic nedělejte – bez kódu se do účtu nikdo nedostane.`,
      title: 'Přihlašovací kód',
      body: `Opište kód do okna, kde jste se přihlašovali. Platí ${minutes} minut a jde použít jen jednou. Pokud jste se nepřihlašovali, nic nedělejte – bez kódu se do účtu nikdo nedostane.`,
    },
    en: {
      subject: `${code} – fridrich.cloud sign-in code`,
      plain: `Your sign-in code is ${code}.\n\nIt is valid for ${minutes} minutes and can be used only once. If you did not try to sign in, do nothing – nobody gets into the account without the code.`,
      title: 'Sign-in code',
      body: `Type the code into the window where you were signing in. It is valid for ${minutes} minutes and can be used only once. If you did not try to sign in, do nothing – nobody gets into the account without the code.`,
    },
  }[locale];

  return {
    to,
    subject: text.subject,
    text: text.plain,
    html: layout(locale, text.title, text.body, { code }),
  };
}

/**
 * Odpověď na registraci na už obsazenou adresu.
 *
 * Registrační formulář odpovídá stejně, ať účet vznikl, nebo ne. Majitel
 * schránky se ale o pokusu dozví – a když to byl on sám, dostane rovnou
 * cestu dál místo mlčení.
 */
export function accountExistsEmail(to: string, loginUrl: string, locale: Locale): EmailMessage {
  const text = {
    cs: {
      subject: 'Účet už existuje – fridrich.cloud',
      plain: `Na tuhle adresu je už účet založený, takže jsme nezakládali další.\n\nPřihlásíte se zde:\n${loginUrl}\n\nHeslo nepotřebujete – pošleme vám kód na tenhle e-mail. Pokud jste se o registraci nepokoušeli, e-mail ignorujte.`,
      title: 'Účet už existuje',
      body: 'Na tuhle adresu je už účet založený, takže jsme nezakládali další. Přihlásíte se bez hesla – pošleme vám kód na tenhle e-mail. Pokud jste se o registraci nepokoušeli, e-mail ignorujte.',
      action: 'Přihlásit se',
    },
    en: {
      subject: 'The account already exists – fridrich.cloud',
      plain: `An account already exists for this address, so we did not create another one.\n\nSign in here:\n${loginUrl}\n\nYou do not need a password – we will send a code to this e-mail. If you did not try to register, ignore this e-mail.`,
      title: 'The account already exists',
      body: 'An account already exists for this address, so we did not create another one. Sign in without a password – we will send a code to this e-mail. If you did not try to register, ignore this e-mail.',
      action: 'Sign in',
    },
  }[locale];

  return {
    to,
    subject: text.subject,
    text: text.plain,
    html: layout(locale, text.title, text.body, { action: { label: text.action, url: loginUrl } }),
  };
}

/**
 * Upozornění před smazáním neaktivního účtu.
 *
 * Plánování svatby může ležet měsíce ladem – uživatel se má dozvědět dřív,
 * než o data přijde, a stačí mu se přihlásit.
 */
export function inactiveAccountWarningEmail(
  to: string,
  loginUrl: string,
  days: number,
  locale: Locale,
): EmailMessage {
  const text = {
    cs: {
      subject: 'Váš účet se brzy smaže – fridrich.cloud',
      body: `Na fridrich.cloud jste se už dlouho nepřihlásili. Pokud se nepřihlásíte do ${days} dní, účet i všechna data v aplikacích (například plánování v IziWeddy) smažeme.`,
      keep: 'Účet si ponecháte tím, že se přihlásíte:',
      ignore: 'Pokud účet nepotřebujete, nemusíte nic dělat.',
      title: 'Váš účet se brzy smaže',
      action: 'Přihlásit se a účet ponechat',
    },
    en: {
      subject: 'Your account will be deleted soon – fridrich.cloud',
      body: `You have not signed in to fridrich.cloud for a long time. If you do not sign in within ${days} days, we will delete the account and all data in the apps (for example your IziWeddy plans).`,
      keep: 'Keep the account by signing in:',
      ignore: 'If you do not need the account, you do not have to do anything.',
      title: 'Your account will be deleted soon',
      action: 'Sign in and keep the account',
    },
  }[locale];

  return {
    to,
    subject: text.subject,
    text: `${text.body}\n\n${text.keep}\n${loginUrl}\n\n${text.ignore}`,
    html: layout(locale, text.title, `${text.body} ${text.ignore}`, {
      action: { label: text.action, url: loginUrl },
    }),
  };
}

/** Potvrzení smazání účtu – na žádost uživatele, nebo po lhůtě neaktivity. */
export function accountDeletedEmail(
  to: string,
  reason: { kind: 'request' } | { kind: 'inactivity'; days: number },
  locale: Locale,
): EmailMessage {
  const text = {
    cs: {
      subject: 'Účet byl smazán – fridrich.cloud',
      reason: reason.kind === 'request' ? 'na vaši žádost' : `protože jste se ${reason.kind === 'inactivity' ? reason.days : 0} dní nepřihlásili`,
      deleted: (why: string) => `Váš účet na fridrich.cloud jsme smazali ${why}. Spolu s ním jsme smazali i data v aplikacích (například plánování v IziWeddy).`,
      last: 'Tento e-mail je poslední, který od nás v souvislosti s účtem dostanete.',
      title: 'Účet byl smazán',
    },
    en: {
      subject: 'Your account has been deleted – fridrich.cloud',
      reason: reason.kind === 'request' ? 'at your request' : `because you have not signed in for ${reason.kind === 'inactivity' ? reason.days : 0} days`,
      deleted: (why: string) => `We have deleted your fridrich.cloud account ${why}. Together with it we deleted the data in the apps (for example your IziWeddy plans).`,
      last: 'This is the last e-mail you will receive from us about the account.',
      title: 'Your account has been deleted',
    },
  }[locale];

  const body = text.deleted(text.reason);

  return {
    to,
    subject: text.subject,
    text: `${body}\n\n${text.last}`,
    html: layout(locale, text.title, `${body} ${text.last}`, {}),
  };
}
