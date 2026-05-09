import { Server } from 'socket.io';

declare global {
  namespace Express {
    interface Request {
      io?: Server;
      user?: {
        id: string;
        email: string;
        name: string;
        role: string;
      };
    }
  }
}
