import { Request, Response, NextFunction } from 'express';

interface CacheEntry<T = any> {
  data: T;
  expiresAt: number;
}

class CacheService {
  private store: Map<string, CacheEntry> = new Map();
  private maxEntries: number = 1000;

  constructor() {
    // Periodic sweep every 5 minutes to prune expired keys and prevent memory growth
    setInterval(() => {
      this.purgeExpired();
    }, 5 * 60 * 1000).unref();
  }

  public get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  public set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    if (this.store.size >= this.maxEntries) {
      // Evict oldest entries
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }

    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  public del(key: string): boolean {
    return this.store.delete(key);
  }

  public invalidatePattern(pattern: string): number {
    let count = 0;
    const regex = new RegExp(`^${pattern.replace('*', '.*')}`);
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  public clear(): void {
    this.store.clear();
  }

  private purgeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

export const appCache = new CacheService();

/**
 * Express middleware to cache GET responses
 * @param ttlSeconds Time-to-live in seconds (default: 300 = 5 minutes)
 */
export const cacheResponse = (ttlSeconds: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache safe GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Bypass cache if client explicitly asks
    if (
      req.headers['cache-control'] === 'no-cache' ||
      req.query._refresh === 'true' ||
      req.headers['pragma'] === 'no-cache'
    ) {
      return next();
    }

    const tenantPrefix = (req as any).tenantId || 'global';
    const cacheKey = `route:${tenantPrefix}:${req.originalUrl || req.url}`;
    const cachedData = appCache.get<any>(cacheKey);

    if (cachedData) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedData);
    }

    res.setHeader('X-Cache', 'MISS');

    // Intercept res.json to store into cache
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      // Only cache successful 200 responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        appCache.set(cacheKey, body, ttlSeconds);
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Helper to easily bust cache on catalog changes
 */
export const invalidateRouteCache = (pattern: string) => {
  return appCache.invalidatePattern(`route:*${pattern}*`);
};

export default appCache;
