import { Agent } from 'node:https';
import { CosmosClient, type Container, type Database } from '@azure/cosmos';
import { DefaultAzureCredential } from '@azure/identity';
import { CONTACT_MESSAGE_RETENTION_DAYS } from '@fridrich/shared';
import { CONTAINERS, getCosmosConfig, type ContainerName } from '../../config.js';

/**
 * Definice kontejnerů.
 *
 * Partition key se volí podle dominantního dotazu daného agregátu – u hostů
 * a položek je to vždy „vše pro jednu svatbu", proto `/weddingId`.
 * `ttlSeconds` nechává Cosmos DB uklízet dočasné záznamy samo, ať nemusíme
 * psát mazací úlohu.
 */
const CONTAINER_DEFINITIONS: {
  id: ContainerName;
  partitionKey: string;
  ttlSeconds?: number;
}[] = [
  { id: CONTAINERS.users, partitionKey: '/id' },
  { id: CONTAINERS.tokens, partitionKey: '/userId', ttlSeconds: 30 * 24 * 60 * 60 },
  // Kód platí deset minut; hodina TTL nechá rezervu na posun hodin mezi
  // instancemi a stejně ho uklidí dřív, než se stihne nasbírat.
  { id: CONTAINERS.loginCodes, partitionKey: '/userId', ttlSeconds: 60 * 60 },
  { id: CONTAINERS.sessions, partitionKey: '/userId', ttlSeconds: 60 * 24 * 60 * 60 },
  { id: CONTAINERS.rateLimits, partitionKey: '/id', ttlSeconds: 24 * 60 * 60 },
  // Lhůta ze zásad ochrany osobních údajů – zprávu smaže Cosmos DB sám rok po přijetí.
  {
    id: CONTAINERS.contactMessages,
    partitionKey: '/id',
    ttlSeconds: CONTACT_MESSAGE_RETENTION_DAYS * 24 * 60 * 60,
  },
  { id: CONTAINERS.weddings, partitionKey: '/id' },
  { id: CONTAINERS.guests, partitionKey: '/weddingId' },
  { id: CONTAINERS.planningItems, partitionKey: '/weddingId' },
];

let databasePromise: Promise<Database> | undefined;

/**
 * Emulátor se prokazuje self-signed certifikátem, který Node odmítne.
 *
 * Výjimka se proto dává **jen pro localhost** a jen tomuhle jednomu
 * klientovi – ne přes `NODE_TLS_REJECT_UNAUTHORIZED`, který by ochranu
 * vypnul celému procesu včetně volání na Azure.
 */
function localEmulatorAgent(endpoint: string): Agent | undefined {
  let hostname: string;
  try {
    hostname = new URL(endpoint).hostname;
  } catch {
    return undefined;
  }

  if (hostname !== 'localhost' && hostname !== '127.0.0.1') return undefined;
  return new Agent({ rejectUnauthorized: false });
}

async function initDatabase(): Promise<Database> {
  const cosmos = getCosmosConfig();

  const agent = localEmulatorAgent(cosmos.endpoint);
  const connection = {
    endpoint: cosmos.endpoint,
    ...(agent ? { agent } : {}),
  };

  const client = cosmos.key
    ? new CosmosClient({ ...connection, key: cosmos.key })
    : new CosmosClient({ ...connection, aadCredentials: new DefaultAzureCredential() });

  /*
   * Throughput se nastavuje na databázi, ne na kontejnerech.
   *
   * Na účtu s předplacenou kapacitou (provisioned) dostane každý kontejner bez
   * vlastního nastavení minimálně 400 RU/s – devět kontejnerů by si tedy
   * řeklo o 3600 RU/s. Sdílená kapacita na úrovni databáze je rozdělí mezi
   * sebe a vejdou se do jedné rezervace (limit je 25 kontejnerů na databázi).
   *
   * Účet v režimu serverless naopak žádný throughput nepřijímá – tam se
   * `COSMOS_THROUGHPUT` nechá prázdný a parametr se vůbec neposílá.
   */
  const { database } = await client.databases.createIfNotExists({
    id: cosmos.database,
    ...(cosmos.throughput ? { throughput: cosmos.throughput } : {}),
  });

  await Promise.all(
    CONTAINER_DEFINITIONS.map(async (definition) => {
      const { container, resource } = await database.containers.createIfNotExists({
        id: definition.id,
        partitionKey: { paths: [definition.partitionKey] },
        ...(definition.ttlSeconds ? { defaultTtl: definition.ttlSeconds } : {}),
      });

      /*
       * `createIfNotExists` existující kontejner nemění – kontejner založený
       * dřív by novou lhůtu nikdy nedostal a data by se nemazala, i když to
       * zásady slibují. Rozdílné TTL se proto dorovná. Cosmos DB pak smaže
       * i starší dokumenty, jejichž lhůta (podle `_ts`) už uplynula.
       */
      if (definition.ttlSeconds && resource && resource.defaultTtl !== definition.ttlSeconds) {
        await container.replace({ ...resource, defaultTtl: definition.ttlSeconds });
      }
    }),
  );

  return database;
}

/** Inicializace proběhne jednou za životnost instance, ne při každém volání. */
export async function getDatabase(): Promise<Database> {
  databasePromise ??= initDatabase();
  return databasePromise;
}

export async function getContainer(name: ContainerName): Promise<Container> {
  const database = await getDatabase();
  return database.container(name);
}

/** Odstraní systémová pole Cosmos DB (`_rid`, `_etag`, `_ts`, …). */
export function stripSystemFields<T extends object>(document: T): T {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(document)) {
    if (!key.startsWith('_')) clean[key] = value;
  }
  return clean as T;
}

/** Cosmos hlásí chybějící dokument stavem 404 – tady z něj děláme `undefined`. */
export function isNotFound(error: unknown): boolean {
  return (error as { code?: number }).code === 404;
}
