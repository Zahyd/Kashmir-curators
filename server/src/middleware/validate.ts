import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validateRequest = (schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body && req.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query && req.query) {
        req.query = (await schema.query.parseAsync(req.query)) as any;
      }
      if (schema.params && req.params) {
        req.params = (await schema.params.parseAsync(req.params)) as any;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          type: 'https://kashmircurators.com/problems/validation-error',
          title: 'Validation Error',
          status: 400,
          detail: 'Invalid request data provided.',
          errors: error.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
};

export default validateRequest;
