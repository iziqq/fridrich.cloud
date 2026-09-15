import { ContactMessageInputSchema, MessageResponseSchema } from '@fridrich/shared';
import * as v from 'valibot';
import { submitContactMessage } from '../../application/contact/submitContactMessage.js';
import { defineEndpoint } from '../../http/endpoint.js';
import { clientIp } from '../../http/responses.js';
import { contactDeps } from '../../infrastructure/container.js';

/**
 * `POST /api/contact` – zpráva z kontaktního formuláře portálu.
 *
 * Jediný veřejný zápisový endpoint: délkové limity hlídá schéma, rate limit
 * use-case, honeypot formulář.
 */

export const SubmitContactMessageRequest = ContactMessageInputSchema;
export type SubmitContactMessageRequest = v.InferOutput<typeof SubmitContactMessageRequest>;

export const SubmitContactMessageResponse = MessageResponseSchema;
export type SubmitContactMessageResponse = v.InferOutput<typeof SubmitContactMessageResponse>;

export const submitContactMessageEndpoint = defineEndpoint({
  name: 'submitContactMessage',
  method: 'POST',
  route: 'contact',
  access: 'public',
  body: SubmitContactMessageRequest,
  response: SubmitContactMessageResponse,
  async handle({ body, request }) {
    await submitContactMessage(contactDeps(), { message: body, sourceIp: clientIp(request) });
    return { status: 202, body: { message: 'Zpráva byla odeslána.' } };
  },
});
