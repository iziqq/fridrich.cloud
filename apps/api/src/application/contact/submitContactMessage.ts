import type { Clock } from '../../domain/shared/Clock.js';
import type { IdGenerator, RateLimiter } from '../../domain/identity/ports.js';
import type { EmailSender } from '../../domain/identity/EmailSender.js';
import { ContactMessage, type ContactMessageRepository } from '../../domain/contact/ContactMessage.js';
import { DomainError } from '../../domain/shared/DomainError.js';

export interface ContactDeps {
  messages: ContactMessageRepository;
  email: EmailSender;
  ids: IdGenerator;
  clock: Clock;
  rateLimiter: RateLimiter;
  /** Adresa, na kterou chodí poptávky. */
  inboxAddress: string;
}

export interface SubmitContactCommand {
  raw: unknown;
  sourceIp: string;
}

/** Escapuje text vkládaný do HTML e-mailu – obsah píše kdokoli z internetu. */
function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/**
 * Zpracuje zprávu z kontaktního formuláře.
 *
 * Jediný veřejný zápisový endpoint, proto má vlastní rate limit. Zpráva se
 * ukládá i posílá e-mailem – kdyby výpadek poštovní služby zprávu ztratil,
 * zůstane aspoň v databázi.
 */
export async function submitContactMessage(
  deps: ContactDeps,
  command: SubmitContactCommand,
): Promise<void> {
  const allowed = await deps.rateLimiter.consume(
    `contact:${command.sourceIp}`,
    5,
    60 * 60 * 1000,
  );
  if (!allowed) throw DomainError.tooManyRequests();

  const message = ContactMessage.create({
    id: deps.ids.next(),
    raw: command.raw,
    sourceIp: command.sourceIp,
    clock: deps.clock,
  });

  await deps.messages.save(message);

  const body = escapeHtml(message.message).replaceAll('\n', '<br />');

  await deps.email.send({
    to: deps.inboxAddress,
    subject: `Poptávka z webu: ${message.name}`,
    text: `Od: ${message.name} <${message.email}>\n\n${message.message}`,
    html: `<p><strong>Od:</strong> ${escapeHtml(message.name)} &lt;${escapeHtml(message.email)}&gt;</p><p>${body}</p>`,
  });
}
