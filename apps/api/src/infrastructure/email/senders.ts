import { EmailClient } from '@azure/communication-email';
import { createTransport, type Transporter } from 'nodemailer';
import { getConfig } from '../../config.js';
import type { EmailMessage, EmailSender } from '../../domain/identity/EmailSender.js';

/**
 * Vývojový odesílatel – e-mail vypíše do logu.
 *
 * Odkaz se tím dá při lokálním vývoji zkopírovat z konzole, aniž by bylo
 * potřeba nastavovat poštovní službu. Nikdy se nesmí použít v produkci.
 */
export const consoleEmailSender: EmailSender = {
  async send(message: EmailMessage) {
    console.info(
      [
        '--- E-MAIL (vývojový režim, neodesláno) ---',
        `Komu:    ${message.to}`,
        `Předmět: ${message.subject}`,
        '',
        message.text,
        '-------------------------------------------',
      ].join('\n'),
    );
  },
};

let transporter: Transporter | undefined;

/**
 * Odesílání přes SMTP.
 *
 * Hodí se pro vývoj a menší provoz – stačí běžná schránka, není potřeba
 * zřizovat poštovní službu v Azure. U Gmailu se používá **heslo aplikace**,
 * ne heslo k účtu; běžné přihlášení Google pro SMTP nepustí.
 */
export const smtpEmailSender: EmailSender = {
  async send(message: EmailMessage) {
    const smtp = getConfig().email.smtp;
    if (!smtp) throw new Error('Chybí nastavení SMTP.');

    transporter ??= createTransport({
      host: smtp.host,
      port: smtp.port,
      // Port 465 je TLS od začátku, 587 se šifruje až přes STARTTLS.
      secure: smtp.port === 465,
      auth: { user: smtp.user, pass: smtp.password },
    });

    await transporter.sendMail({
      from: smtp.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  },
};

let client: EmailClient | undefined;

/** Odesílání přes Azure Communication Services. */
export const acsEmailSender: EmailSender = {
  async send(message: EmailMessage) {
    const config = getConfig();
    const connectionString = config.email.connectionString;
    if (!connectionString) throw new Error('Chybí ACS_CONNECTION_STRING.');

    client ??= new EmailClient(connectionString);

    const poller = await client.beginSend({
      senderAddress: config.email.from,
      content: {
        subject: message.subject,
        plainText: message.text,
        html: message.html,
      },
      recipients: { to: [{ address: message.to }] },
    });

    await poller.pollUntilDone();
  },
};

/**
 * Vybere odesílatele podle konfigurace.
 *
 * SMTP má přednost před ACS: kdo ho vyplnil, chtěl posílat přes něj. Bez
 * jednoho i druhého v produkci raději spadneme při startu, než abychom tiše
 * posílali aktivační odkazy a přihlašovací kódy do logu.
 */
export function createEmailSender(): EmailSender {
  const config = getConfig();

  if (config.email.smtp) return smtpEmailSender;
  if (config.email.connectionString) return acsEmailSender;

  if (config.isProduction) {
    throw new Error(
      'V produkci chybí nastavení SMTP i ACS_CONNECTION_STRING – e-maily by se neodeslaly.',
    );
  }

  return consoleEmailSender;
}
