import type { Locale } from '@fridrich/shared';
import type { InvitableRole } from '@fridrich/weddy-shared';
import type { EmailMessage } from '../../domain/shared/EmailSender.js';
import { layout } from '../shared/emailLayout.js';

/**
 * Texty e-mailů z plánovače.
 *
 * Jazyk vybírá use-case: pozvánku i zprávu o přidání čte někdo jiný než
 * odesílatel, jazyk účtu ale u pozvánky ještě neznáme – použije se proto
 * jazyk požadavku, ve kterém admin pozvánku odeslal
 * (doc/wiki/architecture/i18n.md).
 */

const ROLE_LABEL: Record<InvitableRole, string> = { manager: 'Manager', viewer: 'Viewer' };

/** Pozvánka pro adresu, ke které zatím nepatří účet – po registraci přístup naskočí sám. */
export function weddingInvitationEmail(
  to: string,
  input: { weddingTitle: string; inviterName: string; role: InvitableRole; registerUrl: string },
  locale: Locale,
): EmailMessage {
  const role = ROLE_LABEL[input.role];

  const text = {
    cs: {
      subject: `Pozvánka do plánování svatby ${input.weddingTitle}`,
      title: 'Pozvánka do plánování svatby',
      body: `${input.inviterName} vás zve do plánování „${input.weddingTitle}" v IziWeddy jako ${role}. Stačí si založit účet na stejnou adresu a plánování vám naskočí samo.`,
      action: 'Vytvořit účet',
      plain: `${input.inviterName} vás zve do plánování „${input.weddingTitle}" v IziWeddy jako ${role}.\n\nZaložte si účet na tuhle adresu a plánování vám naskočí samo:\n${input.registerUrl}\n\nPokud pozvánku nečekáte, nic nedělejte – bez účtu se do plánování nikdo nedostane.`,
    },
    en: {
      subject: `Invitation to the wedding plan ${input.weddingTitle}`,
      title: 'Invitation to a wedding plan',
      body: `${input.inviterName} invites you to the wedding plan "${input.weddingTitle}" in IziWeddy as ${role}. Create an account with this e-mail address and the plan will appear on its own.`,
      action: 'Create an account',
      plain: `${input.inviterName} invites you to the wedding plan "${input.weddingTitle}" in IziWeddy as ${role}.\n\nCreate an account with this e-mail address and the plan will appear on its own:\n${input.registerUrl}\n\nIf you are not expecting this invitation, do nothing – nobody gets into the plan without an account.`,
    },
  }[locale];

  return {
    to,
    subject: text.subject,
    text: text.plain,
    html: layout(locale, text.title, text.body, {
      action: { label: text.action, url: input.registerUrl },
    }),
  };
}

/** Zpráva pro existující účet – přístup má hned, jen o něm musí vědět. */
export function weddingAccessGrantedEmail(
  to: string,
  input: { weddingTitle: string; inviterName: string; role: InvitableRole; weddingUrl: string },
  locale: Locale,
): EmailMessage {
  const role = ROLE_LABEL[input.role];

  const text = {
    cs: {
      subject: `Máte přístup k plánování ${input.weddingTitle}`,
      title: 'Máte přístup k plánování svatby',
      body: `${input.inviterName} vám dal přístup k plánování „${input.weddingTitle}" v IziWeddy jako ${role}. Najdete ho po přihlášení mezi svými plánováními.`,
      action: 'Otevřít plánování',
      plain: `${input.inviterName} vám dal přístup k plánování „${input.weddingTitle}" v IziWeddy jako ${role}.\n\nNajdete ho po přihlášení tady:\n${input.weddingUrl}`,
    },
    en: {
      subject: `You have access to the wedding plan ${input.weddingTitle}`,
      title: 'You have access to a wedding plan',
      body: `${input.inviterName} gave you access to the wedding plan "${input.weddingTitle}" in IziWeddy as ${role}. You will find it among your plans after signing in.`,
      action: 'Open the plan',
      plain: `${input.inviterName} gave you access to the wedding plan "${input.weddingTitle}" in IziWeddy as ${role}.\n\nYou will find it here after signing in:\n${input.weddingUrl}`,
    },
  }[locale];

  return {
    to,
    subject: text.subject,
    text: text.plain,
    html: layout(locale, text.title, text.body, {
      action: { label: text.action, url: input.weddingUrl },
    }),
  };
}
