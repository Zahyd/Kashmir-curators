import jwt from 'jsonwebtoken';
import prisma from './prisma';
import { DEFAULT_TENANT_ID, buildNotificationTenantWhere, canAccessNotificationRecord } from './tenant';
import { realtimeBus } from './realtimeBus';

const STAFF_ROLES = new Set(['admin', 'operations', 'sales', 'finance', 'marketing']);

function isPrivilegedPlatformRole(user: any): boolean {
  const role = String(user?.role || '').toLowerCase();
  return (role === 'admin' || role === 'operations') && !user?.organizationId;
}

export function configureSocketServer(io: any) {
  realtimeBus.setIo(io);

  // Socket.IO Authentication Handshake Middleware
  io.use(async (socket: any, next: any) => {
    try {
      const authToken = socket.handshake.auth?.token as string | undefined;
      const authHeader = (socket.handshake.headers?.authorization as string | undefined) || '';
      const portalKey =
        (socket.handshake.auth?.portalKey as string | undefined) ||
        (socket.handshake.headers?.['x-portal-key'] as string | undefined) ||
        '';

      let token =
        authToken ||
        (authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : authHeader.trim());

      if (token === 'null' || token === 'undefined') token = '';
      const cleanPortalKey = portalKey === 'null' || portalKey === 'undefined' ? '' : portalKey.trim();

      if (token) {
        const secrets = [process.env.JWT_SECRET, process.env.BETTER_AUTH_SECRET].filter(Boolean) as string[];
        for (const secret of secrets) {
          try {
            const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as any;
            if (decoded) {
              socket.data.user = {
                ...decoded,
                code: decoded.code || decoded.employeeCode,
                employeeCode: decoded.employeeCode || decoded.code,
              };
              return next();
            }
          } catch {
            // Try next secret or DB session
          }
        }

        // Check Better Auth database session token
        const session = await (prisma as any).session
          .findUnique({
            where: { token },
            include: { user: true },
          })
          .catch(() => null);

        if (session?.user && new Date(session.expiresAt) > new Date()) {
          socket.data.user = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            role: session.user.role,
            code: session.user.employeeCode,
            employeeCode: session.user.employeeCode,
            organizationId: session.user.organizationId || undefined,
          };
          return next();
        }

        // Explicit invalid token provided -> reject handshake
        return next(new Error('UNAUTHORIZED_SOCKET'));
      }

      if (cleanPortalKey && cleanPortalKey.toUpperCase().startsWith('KC-')) {
        const keyRec = await (prisma as any).portalAccessKey
          .findUnique({
            where: { accessKey: cleanPortalKey.toUpperCase() },
          })
          .catch(() => null);

        if (keyRec && keyRec.status === 'ACTIVE') {
          socket.data.user = {
            id: keyRec.id,
            name: keyRec.assignedName,
            role: String(keyRec.portalType || 'hospitality').toLowerCase(),
            portalType: keyRec.portalType,
          };
          return next();
        }
        return next(new Error('INVALID_PORTAL_KEY'));
      }

      // Public anonymous sockets may connect ONLY for public payment/storefront streams; privileged rooms reject unauthenticated sockets.
      return next();
    } catch {
      return next(new Error('SOCKET_AUTH_ERROR'));
    }
  });

  io.on('connection', (socket: any) => {
    const socketUser = socket.data.user;
    const userRole = String(socketUser?.role || '').toLowerCase();
    const isStaff = Boolean(socketUser && STAFF_ROLES.has(userRole));
    const isAgent = Boolean(socketUser && userRole === 'agent');
    const platformPrivileged = Boolean(socketUser && isPrivilegedPlatformRole(socketUser));
    const userTenantId = socketUser?.organizationId || (isStaff ? DEFAULT_TENANT_ID : null);
    const isDefaultTenantStaff = isStaff && (!socketUser?.organizationId || socketUser.organizationId === DEFAULT_TENANT_ID);

    if (socketUser?.id) {
      socket.join(`user-${socketUser.id}`);
      if (isAgent) {
        socket.join(`agent-${socketUser.id}`);
        if (socketUser.organizationId && socketUser.organizationId !== DEFAULT_TENANT_ID) {
          socket.join(`tenant-${socketUser.organizationId}`);
          socket.join(`agent-org-${socketUser.organizationId}`);
        }
      }
    }

    if (isStaff && socketUser) {
      realtimeBus.trackSocketConnect(socketUser);
      const empCode = socketUser.employeeCode || socketUser.code;
      if (empCode) {
        realtimeBus.publish(
          'EMPLOYEE_STATUS_CHANGED',
          {
            employeeCode: empCode,
            name: socketUser.name,
            isOnline: true,
            source: 'socket_connect',
            timestamp: new Date().toISOString(),
          },
          { io, tenantId: userTenantId }
        );
      }
    }

    // Direct user personal channel
    socket.on('join-user', (userId: string, cb?: (res: any) => void) => {
      if (userId && socketUser && (socketUser.id === userId || platformPrivileged)) {
        socket.join(`user-${userId}`);
        cb?.({ ok: true, room: `user-${userId}` });
      } else {
        cb?.({ ok: false, error: 'Forbidden' });
      }
    });

    // Admin central oversight room (strictly tenant-isolated unless platform superadmin)
    socket.on('join-admin', (cb?: (res: any) => void) => {
      if (isStaff) {
        const joinedRooms: string[] = [];
        if (platformPrivileged) {
          socket.join('platform-admin-room');
          socket.join('admin-room');
          socket.join('sales-room');
          joinedRooms.push('platform-admin-room', 'admin-room', 'sales-room');
        } else if (isDefaultTenantStaff) {
          socket.join('admin-room');
          socket.join('sales-room');
          joinedRooms.push('admin-room', 'sales-room');
        }
        if (userTenantId) {
          socket.join(`tenant-${userTenantId}`);
          socket.join(`sales-${userTenantId}`);
          joinedRooms.push(`tenant-${userTenantId}`, `sales-${userTenantId}`);
        }
        if (socketUser?.id) socket.join(`user-${socketUser.id}`);
        if (typeof cb === 'function') {
          cb({ ok: true, rooms: joinedRooms, presence: realtimeBus.getOnlinePresence(socketUser?.organizationId) });
        }
      } else if (typeof cb === 'function') {
        cb({ ok: false, error: 'Staff authorization required' });
      }
    });

    // Sales Command Center room (staff only, strictly tenant-scoped)
    socket.on('join-sales', (cb?: (res: any) => void) => {
      if (isStaff) {
        const joinedRooms: string[] = [];
        if (platformPrivileged) {
          socket.join('platform-admin-room');
          socket.join('admin-room');
          socket.join('sales-room');
          joinedRooms.push('platform-admin-room', 'admin-room', 'sales-room');
        } else if (isDefaultTenantStaff) {
          socket.join('sales-room');
          socket.join('admin-room');
          joinedRooms.push('sales-room', 'admin-room');
        }
        if (userTenantId) {
          socket.join(`tenant-${userTenantId}`);
          socket.join(`sales-${userTenantId}`);
          joinedRooms.push(`tenant-${userTenantId}`, `sales-${userTenantId}`);
        }
        if (socketUser?.id) socket.join(`user-${socketUser.id}`);
        if (typeof cb === 'function') {
          cb({ ok: true, rooms: joinedRooms, presence: realtimeBus.getOnlinePresence(socketUser?.organizationId) });
        }
      } else if (typeof cb === 'function') {
        cb({ ok: false, error: 'Sales authorization required' });
      }
    });

    // Tenant / Organization operational desk (tenant member or platform admin/ops only)
    socket.on('join-tenant', (tenantId: string, cb?: (res: any) => void) => {
      if (
        tenantId &&
        socketUser &&
        (socketUser.organizationId === tenantId || platformPrivileged)
      ) {
        socket.join(`tenant-${tenantId}`);
        if (isStaff) {
          socket.join(`sales-${tenantId}`);
        }
        cb?.({ ok: true, room: `tenant-${tenantId}` });
      } else {
        cb?.({ ok: false, error: 'Cross-tenant room denied' });
      }
    });

    // B2B Agent Command Desk channel (agent/admin/ops; never exposes platform sales/admin rooms to external agents)
    socket.on('join-agent', (cb?: (res: any) => void) => {
      if (!socketUser || (!isAgent && !isStaff)) {
        return cb?.({ ok: false, error: 'Agent authorization required' });
      }
      const joinedRooms: string[] = [];
      if (socketUser.id) {
        socket.join(`user-${socketUser.id}`);
        socket.join(`agent-${socketUser.id}`);
        joinedRooms.push(`user-${socketUser.id}`, `agent-${socketUser.id}`);
      }
      if (socketUser.organizationId && socketUser.organizationId !== DEFAULT_TENANT_ID) {
        socket.join(`tenant-${socketUser.organizationId}`);
        socket.join(`agent-org-${socketUser.organizationId}`);
        joinedRooms.push(`tenant-${socketUser.organizationId}`, `agent-org-${socketUser.organizationId}`);
      }
      return cb?.({
        ok: true,
        connected: true,
        rooms: joinedRooms,
        userId: socketUser.id,
        organizationId: socketUser.organizationId || null,
        serverTime: new Date().toISOString(),
      });
    });

    socket.on('leave-tenant', (tenantId: string) => {
      if (tenantId) {
        socket.leave(`tenant-${tenantId}`);
        socket.leave(`sales-${tenantId}`);
      }
    });

    // Hotel CRS Reception Operational Desk
    socket.on('join-hotel', async (hotelId: string, cb?: (res: any) => void) => {
      if (!hotelId || !socketUser || !['admin', 'operations', 'hospitality', 'supplier'].includes(userRole)) {
        cb?.({ ok: false, error: 'Forbidden' });
        return;
      }
      if (!platformPrivileged && socketUser.organizationId) {
        const hotel = await (prisma as any).hotel
          .findUnique({ where: { id: String(hotelId) }, select: { organizationId: true } })
          .catch(() => null);
        if (hotel && hotel.organizationId && hotel.organizationId !== socketUser.organizationId) {
          cb?.({ ok: false, error: 'Cross-tenant hotel room denied' });
          return;
        }
      }
      socket.join(`hotel-${hotelId}`);
      cb?.({ ok: true, room: `hotel-${hotelId}` });
    });

    socket.on('leave-hotel', (hotelId: string) => {
      if (hotelId) socket.leave(`hotel-${hotelId}`);
    });

    // Chauffeur / Driver Cockpit & Fleet Dispatch Desk
    socket.on('join-driver', (driverId: string, cb?: (res: any) => void) => {
      if (!driverId || !socketUser || !['admin', 'operations', 'driver'].includes(userRole)) {
        cb?.({ ok: false, error: 'Forbidden' });
        return;
      }
      if (userRole === 'driver' && socketUser.id !== driverId && socketUser.employeeCode !== driverId) {
        cb?.({ ok: false, error: 'Forbidden' });
        return;
      }
      socket.join(`driver-${driverId}`);
      cb?.({ ok: true, room: `driver-${driverId}` });
    });

    socket.on('leave-driver', (driverId: string) => {
      if (driverId) socket.leave(`driver-${driverId}`);
    });

    // Generic room join/leave with strict authorization boundaries
    socket.on('join-room', (room: string, cb?: (res: any) => void) => {
      if (!room || typeof room !== 'string') return;
      if (room.startsWith('payment-')) {
        socket.join(room);
        cb?.({ ok: true, room });
      } else if (room === 'admin-room' || room === 'sales-room') {
        if (!isStaff) {
          cb?.({ ok: false, error: 'Forbidden' });
        } else if (platformPrivileged || isDefaultTenantStaff) {
          socket.join(room);
          cb?.({ ok: true, room });
        } else if (userTenantId) {
          const scopedRoom = room === 'sales-room' ? `sales-${userTenantId}` : `tenant-${userTenantId}`;
          socket.join(scopedRoom);
          cb?.({ ok: true, room: scopedRoom });
        } else {
          cb?.({ ok: false, error: 'Forbidden' });
        }
      } else if (room.startsWith('tenant-')) {
        const tId = room.slice(7);
        if (socketUser && (socketUser.organizationId === tId || platformPrivileged)) {
          socket.join(room);
          cb?.({ ok: true, room });
        } else {
          cb?.({ ok: false, error: 'Forbidden' });
        }
      } else if (room.startsWith('user-')) {
        const uId = room.slice(5);
        if (socketUser && (socketUser.id === uId || platformPrivileged)) {
          socket.join(room);
          cb?.({ ok: true, room });
        } else {
          cb?.({ ok: false, error: 'Forbidden' });
        }
      } else {
        cb?.({ ok: false, error: 'Unsupported room' });
      }
    });

    socket.on('leave-room', (room: string) => {
      if (room) socket.leave(room);
    });

    // Payment synchronization (public checkout link room)
    socket.on('join-payment', (paymentId: string) => {
      if (paymentId) socket.join(`payment-${paymentId}`);
    });

    // Heartbeat ping/pong for latency & dead-connection recovery
    socket.on('heartbeat:ping', (clientTs?: number, cb?: (res: any) => void) => {
      const payload = {
        clientTs: typeof clientTs === 'number' ? clientTs : Date.now(),
        serverTs: Date.now(),
        serverTime: new Date().toISOString(),
        authenticated: Boolean(socketUser),
        onlineStaffCount: isStaff ? realtimeBus.getOnlinePresence(socketUser?.organizationId).length : undefined,
      };
      if (typeof cb === 'function') {
        cb(payload);
      } else {
        socket.emit('heartbeat:pong', payload);
      }
    });

    // Notification Acknowledgement via WebSocket (strictly tenant/agent-scoped)
    socket.on('notification:ack', async (payload: { notificationId?: string; markAll?: boolean }, cb?: (res: any) => void) => {
      if ((!isStaff && !isAgent) || !socketUser) {
        return cb?.({ ok: false, error: 'Unauthorized' });
      }
      try {
        const p = prisma as any;
        const fakeReq = { user: socketUser, tenantId: socketUser.organizationId || (platformPrivileged ? null : DEFAULT_TENANT_ID), headers: {} } as any;
        const tenantFilter = isAgent
          ? {
              OR: [
                ...(socketUser.id ? [{ userId: String(socketUser.id) }] : []),
                ...(socketUser.organizationId && socketUser.organizationId !== DEFAULT_TENANT_ID
                  ? [{ userId: `tenant:${socketUser.organizationId}` }]
                  : []),
              ],
            }
          : buildNotificationTenantWhere(fakeReq);
        const agentTargetUserIds = isAgent && socketUser.id ? [String(socketUser.id)] : undefined;

        if (payload?.markAll) {
          if (isAgent && (!tenantFilter.OR || tenantFilter.OR.length === 0)) {
            return cb?.({ ok: true, markAll: true });
          }
          await p.notification.updateMany({ where: { ...tenantFilter, read: false }, data: { read: true } });
          realtimeBus.publish('notification:acked', { markAll: true, by: socketUser.employeeCode || socketUser.email }, {
            io,
            tenantId: userTenantId,
            userIds: agentTargetUserIds,
          });
          return cb?.({ ok: true, markAll: true });
        }

        if (payload?.notificationId) {
          const existing = await p.notification.findUnique({ where: { id: String(payload.notificationId) } });
          if (!existing) {
            return cb?.({ ok: false, error: 'Notification not found' });
          }
          const allowedForAgent =
            (socketUser.id && String(existing.userId) === String(socketUser.id)) ||
            Boolean(
              socketUser.organizationId &&
              socketUser.organizationId !== DEFAULT_TENANT_ID &&
              String(existing.userId) === `tenant:${socketUser.organizationId}`
            );
          if (isAgent ? !allowedForAgent : !canAccessNotificationRecord(fakeReq, existing.userId)) {
            return cb?.({ ok: false, error: 'Cross-tenant notification ack denied' });
          }
          await p.notification.update({
            where: { id: String(payload.notificationId) },
            data: { read: true },
          });
          realtimeBus.publish(
            'notification:acked',
            { notificationId: payload.notificationId, by: socketUser.employeeCode || socketUser.email },
            { io, tenantId: userTenantId, userIds: agentTargetUserIds }
          );
          return cb?.({ ok: true, notificationId: payload.notificationId });
        }
        return cb?.({ ok: false, error: 'notificationId or markAll required' });
      } catch (err: any) {
        return cb?.({ ok: false, error: err?.message || 'Ack failed' });
      }
    });

    // Live presence update over WebSocket
    socket.on('sales:presence', async (payload: { isOnline?: boolean }, cb?: (res: any) => void) => {
      if (!isStaff || !socketUser) {
        return cb?.({ ok: false, error: 'Unauthorized' });
      }
      const isOnline = Boolean(payload?.isOnline);
      try {
        if (socketUser.id) {
          await (prisma as any).user
            .update({ where: { id: socketUser.id }, data: { isOnline } })
            .catch(() => {});
        }
        const empCode = socketUser.employeeCode || socketUser.code;
        realtimeBus.publish(
          'EMPLOYEE_STATUS_CHANGED',
          {
            employeeCode: empCode,
            name: socketUser.name,
            isOnline,
            source: 'presence_toggle',
            timestamp: new Date().toISOString(),
          },
          { io, tenantId: userTenantId }
        );
        return cb?.({ ok: true, isOnline });
      } catch (err: any) {
        return cb?.({ ok: false, error: err?.message || 'Presence update failed' });
      }
    });

    socket.on('disconnect', () => {
      if (isStaff && socketUser) {
        realtimeBus.trackSocketDisconnect(socketUser);
        const empCode = socketUser.employeeCode || socketUser.code;
        const stillOnline = realtimeBus
          .getOnlinePresence(socketUser.organizationId)
          .some((u) => u.userId === socketUser.id);
        if (empCode && !stillOnline) {
          realtimeBus.publish(
            'EMPLOYEE_STATUS_CHANGED',
            {
              employeeCode: empCode,
              name: socketUser.name,
              isOnline: false,
              source: 'socket_disconnect',
              timestamp: new Date().toISOString(),
            },
            { io, tenantId: userTenantId }
          );
        }
      }
    });
  });
}
