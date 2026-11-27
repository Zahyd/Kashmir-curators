export const TRANSIENT_DB_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017', 'P2024']);

/**
 * Appends resilient timeout and SSL query parameters for PostgreSQL / Neon URLs
 * without overwriting explicit values provided by ops/environment configuration.
 */
export function buildResilientDatabaseUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;
  if (!/^postgres(ql)?:\/\//i.test(rawUrl)) return rawUrl;

  try {
    const parsed = new URL(rawUrl);
    if (!parsed.searchParams.has('connect_timeout')) {
      parsed.searchParams.set('connect_timeout', '30');
    }
    if (!parsed.searchParams.has('pool_timeout')) {
      parsed.searchParams.set('pool_timeout', '30');
    }
    if (parsed.hostname.includes('neon.tech') && !parsed.searchParams.has('sslmode')) {
      parsed.searchParams.set('sslmode', 'require');
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
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
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('connection timed out') ||
    msg.includes('epipe')
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
