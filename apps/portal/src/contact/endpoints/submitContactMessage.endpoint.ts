import { ContactMessageInputSchema, MessageResponseSchema } from '@fridrich/shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `POST /api/contact` – zpráva z kontaktního formuláře portálu. */

export const SubmitContactMessageRequest = ContactMessageInputSchema;
export type SubmitContactMessageRequest = v.InferInput<typeof SubmitContactMessageRequest>;

export const SubmitContactMessageResponse = MessageResponseSchema;
export type SubmitContactMessageResponse = v.InferOutput<typeof SubmitContactMessageResponse>;

export function submitContactMessage(
  request: SubmitContactMessageRequest,
): Promise<SubmitContactMessageResponse> {
  return callEndpoint({
    method: 'POST',
    path: '/contact',
    body: { schema: SubmitContactMessageRequest, value: request },
    response: SubmitContactMessageResponse,
  });
}
