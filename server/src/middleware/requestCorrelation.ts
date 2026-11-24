import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export interface CorrelatedRequest extends Request {
  correlationId?: string;
  startTime?: number;
}

/**
 * Attaches a unique correlation ID to every incoming request
 * and logs request completion with duration and status code.
 */
export const requestCorrelationMiddleware = (req: CorrelatedRequest, res: Response, next: NextFunction) => {
  const correlationId = (req.headers['x-correlation-id'] as string) || randomUUID();
  req.correlationId = correlationId;
  req.startTime = Date.now();

  res.setHeader('X-Correlation-ID', correlationId);

  // Log on response completion
  res.on('finish', () => {
    const duration = req.startTime ? Date.now() - req.startTime : 0;
    const status = res.statusCode;
    const logPrefix = `[HTTP] [${correlationId.slice(0, 8)}]`;

    if (status >= 500) {
      console.error(`${logPrefix} ${req.method} ${req.originalUrl || req.url} - ${status} (${duration}ms)`);
    } else if (status >= 400) {
      console.warn(`${logPrefix} ${req.method} ${req.originalUrl || req.url} - ${status} (${duration}ms)`);
    } else if (process.env.NODE_ENV === 'development') {
      console.log(`${logPrefix} ${req.method} ${req.originalUrl || req.url} - ${status} (${duration}ms)`);
    }
  });

  next();
};

export default requestCorrelationMiddleware;
