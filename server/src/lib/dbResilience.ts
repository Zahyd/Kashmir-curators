export const TRANSIENT_DB_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017', 'P2024']);

const INVALID_DB_HOSTNAMES = new Set([
  'base',
  'host',
  'hostname',
  'db_host',
  'placeholder',
  'your-db-host',
  'undefined',
  'null',
]);

/**
 * Strips accidental whitespace, wrapping quotes, or `psql '...'` copy-paste prefixes.
 */
export function normalizeRawPostgresUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;
  let cleaned = rawUrl.trim();
  if (!cleaned) return undefined;

  if (/^psql\s+/i.test(cleaned)) {
    cleaned = cleaned.replace(/^psql\s+/i, '').trim();
  }
  cleaned = cleaned.replace(/^(['"])(.*)\1$/, '$2').trim();
  return cleaned || undefined;
}

/**
 * Validates that a string is a syntactically valid PostgreSQL URL with a real hostname.
 * Rejects placeholder strings like `"base"` or malformed unparsed env values.
 */
export function parseValidPostgresUrl(rawUrl?: string): URL | null {
  const cleaned = normalizeRawPostgresUrl(rawUrl);
  if (!cleaned || !/^postgres(ql)?:\/\//i.test(cleaned)) {
    return null;
  }

  try {
    const parsed = new URL(cleaned);
    const host = (parsed.hostname || '').trim().toLowerCase();
    if (!host || INVALID_DB_HOSTNAMES.has(host)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export interface PostgresCandidateSource {
  label: string;
  value?: string;
}

export interface ValidPostgresCandidate {
  label: string;
  url: string;
}

/**
 * Resolves valid, deduplicated PostgreSQL connection candidates in priority order
 * and reports sanitized skip reasons (without credentials) for invalid values.
 */
export function resolvePostgresConnectionCandidates(
  sources: PostgresCandidateSource[]
): { candidates: ValidPostgresCandidate[]; skipped: Array<{ label: string; reason: string }> } {
  const candidates: ValidPostgresCandidate[] = [];
  const skipped: Array<{ label: string; reason: string }> = [];
  const seen = new Set<string>();

  for (const source of sources) {
    const cleaned = normalizeRawPostgresUrl(source.value);
    if (!cleaned) continue;

    const parsed = parseValidPostgresUrl(cleaned);
    if (!parsed) {
      skipped.push({
        label: source.label,
        reason: 'not a valid PostgreSQL URL with a resolvable hostname',
      });
      continue;
    }

    const normalized = parsed.toString();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      candidates.push({ label: source.label, url: normalized });
    }
  }

  return { candidates, skipped };
}

/**
 * Appends resilient timeout, PgBouncer pooler, and SSL query parameters for PostgreSQL / Neon URLs
 * without overwriting explicit values provided by ops/environment configuration.
 */
export function buildResilientDatabaseUrl(rawUrl?: string): string | undefined {
  const cleaned = normalizeRawPostgresUrl(rawUrl);
  if (!cleaned) return undefined;
  if (!/^postgres(ql)?:\/\//i.test(cleaned)) return cleaned;

  try {
    const parsed = new URL(cleaned);
    if (!parsed.searchParams.has('connect_timeout')) {
      parsed.searchParams.set('connect_timeout', '30');
    }
    if (!parsed.searchParams.has('pool_timeout')) {
      parsed.searchParams.set('pool_timeout', '30');
    }
    if (parsed.hostname.includes('neon.tech') && !parsed.searchParams.has('sslmode')) {
      parsed.searchParams.set('sslmode', 'require');
    }
    const isPoolerHost =
      parsed.hostname.includes('-pooler') ||
      parsed.searchParams.get('pgbouncer') === 'true';
    if (isPoolerHost) {
      if (!parsed.searchParams.has('pgbouncer')) {
        parsed.searchParams.set('pgbouncer', 'true');
      }
      if (!parsed.searchParams.has('connection_limit')) {
        parsed.searchParams.set('connection_limit', '5');
      }
    }
    return parsed.toString();
  } catch {
    return cleaned;
  }
}

/**
 * Parses a PostgreSQL URL via WHATWG `URL` into explicit pg-boss connection options
 * so `pg-connection-string` does not fall back to deprecated `url.parse()`.
 */
export function buildPgBossConnectionOptions(rawUrl: string) {
  const tunedUrl = buildResilientDatabaseUrl(rawUrl) || rawUrl;
  const parsed = parseValidPostgresUrl(tunedUrl);
  if (!parsed) {
    throw new Error('Invalid PostgreSQL URL for pg-boss');
  }

  const sslMode = (parsed.searchParams.get('sslmode') || '').toLowerCase();
  const isLoopback = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname.toLowerCase());
  const needsSsl = sslMode !== 'disable' && (sslMode !== '' || !isLoopback);

  return {
    host: parsed.hostname,
    port: Number(parsed.port || 5432),
    database: parsed.pathname.replace(/^\/+/, '') || 'postgres',
    user: decodeURIComponent(parsed.username || ''),
    password: decodeURIComponent(parsed.password || ''),
    ssl: needsSsl ? { rejectUnauthorized: false } : false,
    schema: 'pgboss',
    max: 3,
    connectionTimeoutMillis: 15000,
  };
}

export function isTransientDbError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { code?: string; message?: string };
  if (err.code && TRANSIENT_DB_CODES.has(err.code)) return true;
  const msg = String(err.message || '').toLowerCase();
  return (
    msg.includes("can't reach database server") ||
    msg.includes('connection terminated') ||
    msg.includes('server has closed the connection') ||
    msg.includes('closed the connection') ||
    msg.includes('connection closed') ||
    msg.includes('kind: closed') ||
    msg.includes('error in postgresql connection') ||
    msg.includes('econnreset') ||
    msg.includes('connectionreset') ||
    msg.includes('etimedout') ||
    msg.includes('connection timed out') ||
    msg.includes('epipe') ||
    msg.includes('brokenpipe') ||
    msg.includes('socket hang up')
  );
}

/**
 * Executes an async DB operation with bounded backoff for Neon scale-from-zero wake-ups.
 */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  attempts = 3,
  initialDelayMs = 600
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt >= attempts || !isTransientDbError(error)) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, initialDelayMs * attempt));
    }
  }
  throw lastError;
}

export interface DatabaseHealthReport {
  ok: boolean;
  latencyMs: number;
  schemaReady: boolean;
  error?: string;
}

export interface QueryablePrismaClient {
  $queryRaw: (strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>;
  $queryRawUnsafe: (query: string, ...values: unknown[]) => Promise<unknown>;
}

export async function checkDatabaseHealthWithClient(
  client: QueryablePrismaClient
): Promise<DatabaseHealthReport> {
  const startedAt = Date.now();
  try {
    await withDbRetry(() => client.$queryRaw`SELECT 1`, 2, 500);
    let schemaReady = true;
    try {
      const cols = (await client.$queryRawUnsafe(
        `SELECT COUNT(*)::int AS cnt FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('Cab', 'DriverProfile', 'CabReservation', 'CabDispatchOffer', 'DriverPayout', 'DriverSosAlert')`
      )) as Array<{ cnt?: number }>;
      schemaReady = Number(cols?.[0]?.cnt || 0) >= 6;
    } catch {
      schemaReady = false;
    }
    return {
      ok: true,
      latencyMs: Date.now() - startedAt,
      schemaReady,
    };
  } catch (error) {
    const err = error as { code?: string };
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      schemaReady: false,
      error: err.code ? `Database unavailable (${err.code})` : 'Database connection failed',
    };
  }
}
