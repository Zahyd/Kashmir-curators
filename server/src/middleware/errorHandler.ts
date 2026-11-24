import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import { CorrelatedRequest } from './requestCorrelation';

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  correlationId?: string;
  errors?: any;
}

export const centralizedErrorHandler = (
  err: any,
  req: CorrelatedRequest,
  res: Response,
  next: NextFunction
) => {
  // If headers already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  const correlationId = req.correlationId || 'unknown';
  let status = err.status || err.statusCode || 500;
  let title = 'Internal Server Error';
  let detail = err.message || 'An unexpected error occurred processing your request.';
  let errors = err.errors || undefined;

  // 1. Zod Validation Errors
  if (err.name === 'ZodError') {
    status = 400;
    title = 'Request Validation Failed';
    detail = 'One or more fields in the request payload failed schema validation.';
    errors = err.errors;
  }

  // 2. JWT Authentication Errors
  else if (err.name === 'JsonWebTokenError') {
    status = 401;
    title = 'Invalid Authentication Token';
    detail = 'The authorization credential provided is invalid or corrupted.';
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    title = 'Authentication Token Expired';
    detail = 'The authorization session has expired. Please authenticate again.';
  }

  // 3. Prisma Known Request Errors
  else if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    if (err.code === 'P2002') {
      status = 409;
      title = 'Conflict Constraint Violation';
      detail = 'A record with these unique credentials or parameters already exists.';
    } else if (err.code === 'P2025') {
      status = 404;
      title = 'Record Not Found';
      detail = 'The requested database record does not exist or has been deleted.';
    } else {
      title = 'Database Query Error';
    }
  }

  // Report 5xx server errors to Sentry
  if (status >= 500) {
    Sentry.captureException(err, {
      extra: {
        correlationId,
        url: req.originalUrl || req.url,
        method: req.method,
      },
    });
    console.error(`[Error] [${correlationId}] Unhandled server exception:`, err);
  }

  const problemResponse: ProblemDetails = {
    type: `https://kashmircurators.com/problems/${status}`,
    title,
    status,
    detail: process.env.NODE_ENV === 'production' && status >= 500 ? 'An internal error occurred. Please contact support.' : detail,
    instance: req.originalUrl || req.url,
    correlationId,
    ...(errors ? { errors } : {}),
  };

  res.status(status).json(problemResponse);
};

export default centralizedErrorHandler;
