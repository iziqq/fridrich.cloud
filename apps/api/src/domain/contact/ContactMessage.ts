import { isValidEmail } from '@fridrich/shared';
import type { Clock } from '../shared/Clock.js';
import { DomainError } from '../shared/DomainError.js';

const NAME_MAX = 100;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 5000;

export interface ContactMessageState {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  /** Zkrácená IP kvůli rate limitingu a přehledu o zneužití. */
  sourceIp?: string;
}

/**
 * Zpráva z kontaktního formuláře.
 *
 * Jediný veřejný zápisový endpoint, takže limity jsou tvrdší než jinde –
 * délky se kontrolují i tam, kde by je frontend měl ohlídat sám
 * (doc/architecture.md, kap. 5).
 */
export class ContactMessage {
  private constructor(private readonly state: ContactMessageState) {}

  static create(input: {
    id: string;
    raw: unknown;
    sourceIp?: string;
    clock: Clock;
  }): ContactMessage {
    const raw = (typeof input.raw === 'object' && input.raw !== null ? input.raw : {}) as Record<
      string,
      unknown
    >;
    const details: { field: string; message: string }[] = [];

    const rawName = raw['name'];
    let name = '';
    if (typeof rawName !== 'string' || rawName.trim() === '') {
      details.push({ field: 'name', message: 'Vyplňte jméno' });
    } else {
      name = rawName.trim();
      if (name.length > NAME_MAX) {
        details.push({ field: 'name', message: 'Jméno je příliš dlouhé' });
      }
    }

    const rawEmail = raw['email'];
    let email = '';
    if (typeof rawEmail !== 'string' || !isValidEmail(rawEmail)) {
      details.push({ field: 'email', message: 'Zadejte platný e-mail' });
    } else {
      email = rawEmail.trim().toLowerCase();
    }

    const rawMessage = raw['message'];
    let message = '';
    if (typeof rawMessage !== 'string' || rawMessage.trim().length < MESSAGE_MIN) {
      details.push({
        field: 'message',
        message: 'Napište prosím alespoň pár vět o tom, co potřebujete',
      });
    } else {
      message = rawMessage.trim();
      if (message.length > MESSAGE_MAX) {
        details.push({ field: 'message', message: 'Zpráva je příliš dlouhá' });
      }
    }

    if (details.length > 0) throw DomainError.validation(details);

    const state: ContactMessageState = {
      id: input.id,
      name,
      email,
      message,
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
