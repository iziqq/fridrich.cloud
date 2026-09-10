import { CosmosClient, type Container, type Database } from '@azure/cosmos';
import { DefaultAzureCredential } from '@azure/identity';
import { CONTAINERS, getConfig, type ContainerName } from '../../config.js';

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
  { id: CONTAINERS.credentials, partitionKey: '/userId' },
  { id: CONTAINERS.tokens, partitionKey: '/userId', ttlSeconds: 30 * 24 * 60 * 60 },
  { id: CONTAINERS.sessions, partitionKey: '/userId', ttlSeconds: 60 * 24 * 60 * 60 },
  { id: CONTAINERS.rateLimits, partitionKey: '/id', ttlSeconds: 24 * 60 * 60 },
  { id: CONTAINERS.contactMessages, partitionKey: '/id' },
  { id: CONTAINERS.weddings, partitionKey: '/id' },
  { id: CONTAINERS.guests, partitionKey: '/weddingId' },
  { id: CONTAINERS.planningItems, partitionKey: '/weddingId' },
];

let databasePromise: Promise<Database> | undefined;

async function initDatabase(): Promise<Database> {
  const { cosmos } = getConfig();

  const client = cosmos.key
    ? new CosmosClient({ endpoint: cosmos.endpoint, key: cosmos.key })
    : new CosmosClient({
        endpoint: cosmos.endpoint,
        aadCredentials: new DefaultAzureCredential(),
      });

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
    CONTAINER_DEFINITIONS.map((definition) =>
      database.containers.createIfNotExists({
        id: definition.id,
        partitionKey: { paths: [definition.partitionKey] },
        ...(definition.ttlSeconds ? { defaultTtl: definition.ttlSeconds } : {}),
      }),
    ),
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
