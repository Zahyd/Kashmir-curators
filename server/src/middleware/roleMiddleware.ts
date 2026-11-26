import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

export const authorizeRoles = (...allowedRoles: string[]) => {
  const normalizedAllowed = new Set(allowedRoles.map((r) => String(r).toLowerCase()));
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Access denied. User not authenticated.' });
    }
    const role = String(req.user.role || '');
    if (!normalizedAllowed.has(role.toLowerCase())) {
      return res.status(403).json({ error: `Access denied. Role '${role}' is not authorized.` });
    }
    next();
  };
};
