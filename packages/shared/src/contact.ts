import * as v from 'valibot';
import { emailText, requiredText } from './validation.js';

const NAME_MAX = 100;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 5000;

/**
 * Zpráva z kontaktního formuláře.
 *
 * Jediný veřejný zápisový endpoint, takže limity jsou tvrdé a platí na obou
 * stranách – formulář je ukáže hned, API je vynutí i proti robotům.
 */
export const ContactMessageInputSchema = v.object({
  name: requiredText('Vyplňte jméno', NAME_MAX, 'Jméno je příliš dlouhé'),
  email: emailText('Zadejte platný e-mail'),
  message: v.pipe(
    v.string('Napište prosím alespoň pár vět o tom, co potřebujete'),
    v.trim(),
    v.minLength(MESSAGE_MIN, 'Napište prosím alespoň pár vět o tom, co potřebujete'),
    v.maxLength(MESSAGE_MAX, 'Zpráva je příliš dlouhá'),
  ),
});
export type ContactMessageInput = v.InferOutput<typeof ContactMessageInputSchema>;
