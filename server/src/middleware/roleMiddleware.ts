import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Access denied. User not authenticated.' });
    }
    const role = req.user.role;
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: `Access denied. Role '${role}' is not authorized.` });
    }
    next();
  };
};
