import { CONTAINERS } from '../../config.js';
import {
  ContactMessage,
  type ContactMessageRepository,
  type ContactMessageState,
} from '../../domain/contact/ContactMessage.js';
import type { RateLimiter } from '../../domain/identity/ports.js';
import { getContainer, isNotFound, stripSystemFields } from './client.js';

export const contactMessageCosmosRepository: ContactMessageRepository = {
  async save(message: ContactMessage) {
    const container = await getContainer(CONTAINERS.contactMessages);
    await container.items.create<ContactMessageState>(message.toState());
  },
};

interface RateLimitDocument {
  id: string;
  count: number;
  windowStart: number;
  /** Cosmos DB smaže dokument sám, jakmile okno vyprší. */
  ttl: number;
}

/**
 * Rate limiter s pevným oknem nad Cosmos DB.
 *
 * Sdílený stav je tu podstatný – kdyby počítadlo žilo v paměti instance,
 * stačilo by útočníkovi poslat požadavky tak, aby je Azure rozhodil na víc
 * instancí, a limit by neplatil (doc/architecture.md, kap. 5).
 */
export const cosmosRateLimiter: RateLimiter = {
  async consume(key, limit, windowMs) {
    const container = await getContainer(CONTAINERS.rateLimits);
    // Klíč může obsahovat e-mail nebo IP – do `id` v Cosmos DB nesmí `/`, `\`, `#`, `?`.
    const id = key.replace(/[/\\#?]/g, '_');
    const now = Date.now();
    const ttl = Math.ceil(windowMs / 1000) + 60;

    let current: RateLimitDocument | undefined;
    try {
      const { resource } = await container.item(id, id).read<RateLimitDocument>();
      current = resource ? stripSystemFields(resource) : undefined;
    } catch (error) {
      if (!isNotFound(error)) throw error;
    }

    // Okno vypršelo (nebo záznam vůbec není) – počítáme od začátku.
    const next: RateLimitDocument =
      current && now - current.windowStart < windowMs
        ? { id, count: current.count + 1, windowStart: current.windowStart, ttl }
        : { id, count: 1, windowStart: now, ttl };

    if (next.count > limit) return false;

    try {
      await container.items.upsert(next);
    } catch {
      // Selhání zápisu počítadla nesmí shodit vlastní požadavek – limit
      // je ochrana navíc, ne hlavní funkce endpointu.
      return true;
    }

    return true;
  },
};
