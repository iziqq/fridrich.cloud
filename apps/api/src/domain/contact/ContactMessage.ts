import type { ContactMessageInput } from '@fridrich/shared';
import type { Clock } from '../shared/Clock.js';

export interface ContactMessageState {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  /** Adresa odesílatele kvůli rate limitingu a přehledu o zneužití. */
  sourceIp?: string;
}

/**
 * Zpráva z kontaktního formuláře.
 *
 * Délkové limity jsou tvrdší než jinde, protože jde o jediný veřejný zápisový
 * endpoint – drží je schéma `ContactMessageInputSchema`, které parsuje
 * endpoint i formulář. Sem už chodí rozparsovaný vstup.
 */
export class ContactMessage {
  private constructor(private readonly state: ContactMessageState) {}

  static create(input: {
    id: string;
    message: ContactMessageInput;
    sourceIp?: string;
    clock: Clock;
  }): ContactMessage {
    const state: ContactMessageState = {
      id: input.id,
      name: input.message.name,
      email: input.message.email,
      message: input.message.message,
      createdAt: input.clock.now().toISOString(),
    };

    if (input.sourceIp) state.sourceIp = input.sourceIp;

    return new ContactMessage(state);
  }

  static fromState(state: ContactMessageState): ContactMessage {
    return new ContactMessage(state);
  }

  get name(): string {
    return this.state.name;
  }

  get email(): string {
    return this.state.email;
  }

  get message(): string {
    return this.state.message;
  }

  toState(): ContactMessageState {
    return { ...this.state };
  }
}

export interface ContactMessageRepository {
  save(message: ContactMessage): Promise<void>;
}
