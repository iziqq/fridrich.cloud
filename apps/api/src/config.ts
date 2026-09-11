/** Konfigurace z Application settings (lokálně z `local.settings.json`). */

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Chybí povinné nastavení "${name}".`);
  return value;
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value !== '' ? value : fallback;
}

export const CONTAINERS = {
  users: 'users',
  tokens: 'tokens',
  loginCodes: 'loginCodes',
  sessions: 'sessions',
  rateLimits: 'rateLimits',
  contactMessages: 'contactMessages',
  weddings: 'weddings',
  guests: 'guests',
  planningItems: 'planningItems',
} as const;

export type ContainerName = (typeof CONTAINERS)[keyof typeof CONTAINERS];

/**
 * Nastavení databáze je oddělené od zbytku schválně.
 *
 * Načítá se až ve chvíli, kdy se opravdu připojujeme – jinak by chybějící
 * `COSMOS_ENDPOINT` shodil i kód, který s databází nemá nic společného
 * (sestavení cookie, hlavičky CORS).
 */
export interface CosmosConfig {
  endpoint: string;
  key?: string;
  database: string;
  /**
   * Sdílená kapacita databáze v RU/s.
   *
   * Vyplňte na účtu s předplacenou kapacitou (provisioned), ať si kontejnery
   * kapacitu dělí místo toho, aby každý chtěl vlastní. Na serverless účtu
   * nechte prázdné – ten throughput odmítá.
   */
  throughput?: number;
}

export interface AppConfig {
  /** Původy, ze kterých smí chodit požadavky s cookie. */
  allowedOrigins: string[];
  /** Základ odkazů v e-mailech. */
  appUrl: string;
  cookieDomain?: string;
  isProduction: boolean;
  email: {
    /** Připojovací řetězec Azure Communication Services; prázdný = jiný odesílatel. */
    connectionString?: string;
    /** Vyplněné jen tam, kde je nastavený `SMTP_HOST` – typicky lokální vývoj. */
    smtp?: SmtpConfig;
    from: string;
    inbox: string;
  };
}

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  /** Odesílatel zprávy; u Gmailu musí sedět s přihlášeným účtem. */
  from: string;
}

let cached: AppConfig | undefined;
let cachedCosmos: CosmosConfig | undefined;

export function getCosmosConfig(): CosmosConfig {
  if (cachedCosmos) return cachedCosmos;

  const config: CosmosConfig = {
    endpoint: required('COSMOS_ENDPOINT'),
    database: optional('COSMOS_DATABASE', 'izi-db'),
  };

  // Bez klíče se sáhne po managed identity. Na spravovaných funkcích Static
  // Web Apps ta ale není k dispozici, takže tam musí být klíč vyplněný
  // (doc/architecture.md, kap. 9); identita zbývá pro samostatný Function App.
  const key = process.env['COSMOS_KEY'];
  if (key) config.key = key;

  const throughput = Number(process.env['COSMOS_THROUGHPUT']);
  if (Number.isInteger(throughput) && throughput > 0) config.throughput = throughput;

  cachedCosmos = config;
  return config;
}

export function getConfig(): AppConfig {
  if (cached) return cached;

  const isProduction = optional('NODE_ENV', 'development') === 'production';

  const config: AppConfig = {
    allowedOrigins: optional(
      'ALLOWED_ORIGINS',
      'http://localhost:5173,http://localhost:5174,http://localhost:5175',
    )
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin !== ''),
    appUrl: optional('APP_URL', 'http://localhost:5173'),
    isProduction,
    email: {
      from: optional('EMAIL_FROM', 'no-reply@fridrich.cloud'),
      inbox: optional('CONTACT_INBOX', 'liborfridrich@gmail.com'),
    },
  };

  const cookieDomain = process.env['COOKIE_DOMAIN'];
  if (cookieDomain) config.cookieDomain = cookieDomain;

  const acs = process.env['ACS_CONNECTION_STRING'];
  if (acs) config.email.connectionString = acs;

  // SMTP se bere jako celek – půlka nastavení je horší než žádné, protože
  // by odesílání selhalo až při prvním e-mailu.
  const smtpHost = process.env['SMTP_HOST'];
  const smtpUser = process.env['SMTP_USER'];
  const smtpPassword = process.env['SMTP_PASSWORD'];

  if (smtpHost && smtpUser && smtpPassword) {
    config.email.smtp = {
      host: smtpHost,
      port: Number(optional('SMTP_PORT', '587')),
      user: smtpUser,
      password: smtpPassword,
      from: optional('SMTP_FROM', smtpUser),
    };
  } else if (smtpHost || smtpUser || smtpPassword) {
    throw new Error('Neúplné nastavení SMTP – vyplňte SMTP_HOST, SMTP_USER i SMTP_PASSWORD.');
  }

  cached = config;
  return config;
}
