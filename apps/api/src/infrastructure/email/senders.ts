import { EmailClient } from '@azure/communication-email';
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
 * Bez připojovacího řetězce v produkci raději spadneme při startu, než
 * abychom tiše posílali ověřovací odkazy do logu.
 */
export function createEmailSender(): EmailSender {
  const config = getConfig();

  if (config.email.connectionString) return acsEmailSender;

  if (config.isProduction) {
    throw new Error(
      'V produkci chybí ACS_CONNECTION_STRING – e-maily by se neodeslaly.',
    );
  }

  return consoleEmailSender;
}
