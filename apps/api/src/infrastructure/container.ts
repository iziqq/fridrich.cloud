import { getConfig } from '../config.js';
import { systemClock } from '../domain/shared/Clock.js';
import type { ContactDeps } from '../application/contact/submitContactMessage.js';
import type { IdentityDeps } from '../application/identity/deps.js';
import type { WeddyDeps } from '../application/weddy/deps.js';
import { tokenGenerator, uuidGenerator } from './crypto.js';
import { createEmailSender } from './email/senders.js';
import {
  loginCodeCosmosRepository,
  sessionCosmosRepository,
  tokenCosmosRepository,
  userCosmosRepository,
} from './cosmos/identityRepositories.js';
import {
  contactMessageCosmosRepository,
  cosmosRateLimiter,
} from './cosmos/supportRepositories.js';
import {
  guestCosmosRepository,
  planningItemCosmosRepository,
  weddingCosmosRepository,
} from './cosmos/weddyRepositories.js';

/**
 * Složení aplikace na jednom místě.
 *
 * Use-casy dostávají závislosti parametrem, takže je jde v testu spustit
 * s pamětovými repozitáři bez Cosmos DB (CLAUDE.md, sekce Testing).
 * Tenhle soubor je jediné místo, kde se doména potkává s infrastrukturou.
 */

let identity: IdentityDeps | undefined;
let weddy: WeddyDeps | undefined;
let contact: ContactDeps | undefined;

export function identityDeps(): IdentityDeps {
  identity ??= {
    users: userCosmosRepository,
    tokens: tokenCosmosRepository,
    loginCodes: loginCodeCosmosRepository,
    sessions: sessionCosmosRepository,
    tokenGenerator,
    ids: uuidGenerator,
    clock: systemClock,
    email: createEmailSender(),
    rateLimiter: cosmosRateLimiter,
  };

  return identity;
}

export function weddyDeps(): WeddyDeps {
  weddy ??= {
    weddings: weddingCosmosRepository,
    guests: guestCosmosRepository,
    items: planningItemCosmosRepository,
    ids: uuidGenerator,
    clock: systemClock,
  };

  return weddy;
}

export function contactDeps(): ContactDeps {
  contact ??= {
    messages: contactMessageCosmosRepository,
    email: createEmailSender(),
    ids: uuidGenerator,
    clock: systemClock,
    rateLimiter: cosmosRateLimiter,
    inboxAddress: getConfig().email.inbox,
  };

  return contact;
}
