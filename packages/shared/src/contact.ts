import * as v from 'valibot';
import { messageKeys, type Catalog } from './i18n.js';
import { emailText, requiredText } from './validation.js';

const NAME_MAX = 100;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 5000;

const cs = {
  nameRequired: 'Vyplňte jméno',
  nameTooLong: 'Jméno je příliš dlouhé',
  emailInvalid: 'Zadejte platný e-mail',
  messageTooShort: 'Napište prosím alespoň pár vět o tom, co potřebujete',
  messageTooLong: 'Zpráva je příliš dlouhá',
  sent: 'Zpráva byla odeslána.',
};

const en: Catalog<typeof cs> = {
  nameRequired: 'Please enter your name',
  nameTooLong: 'The name is too long',
  emailInvalid: 'Please enter a valid e-mail',
  messageTooShort: 'Please write at least a few sentences about what you need',
  messageTooLong: 'The message is too long',
  sent: 'The message has been sent.',
};

/** Hlášky kontaktního formuláře – jmenný prostor `shared.contact`. */
export const contactMessages = { cs, en };
export const contactKeys = messageKeys(cs, 'shared.contact');

/**
 * Zpráva z kontaktního formuláře.
 *
 * Jediný veřejný zápisový endpoint, takže limity jsou tvrdé a platí na obou
 * stranách – formulář je ukáže hned, API je vynutí i proti robotům.
 */
export const ContactMessageInputSchema = v.object({
  name: requiredText(contactKeys.nameRequired, NAME_MAX, contactKeys.nameTooLong),
  email: emailText(contactKeys.emailInvalid),
  message: v.pipe(
    v.string(contactKeys.messageTooShort),
    v.trim(),
    v.minLength(MESSAGE_MIN, contactKeys.messageTooShort),
    v.maxLength(MESSAGE_MAX, contactKeys.messageTooLong),
  ),
});
export type ContactMessageInput = v.InferOutput<typeof ContactMessageInputSchema>;
