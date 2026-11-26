import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { realtimeBus } from '../lib/realtimeBus';
import { buildNotificationTenantWhere, canAccessNotificationRecord } from '../lib/tenant';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const p = prisma as any;
    const { read, unreadOnly, priority, type, search, limit = '20', page = '1' } = req.query;

    const tenantScope = buildNotificationTenantWhere(req as any);
    const andFilters: any[] = [];
    if (Object.keys(tenantScope).length > 0) {
      andFilters.push(tenantScope);
    }

    // Filter by read status
    if (unreadOnly === 'true' || read === 'false') {
      andFilters.push({ read: false });
    } else if (read === 'true') {
      andFilters.push({ read: true });
    }

    // Filter by priority / type
    if (priority && priority !== 'ALL') {
      andFilters.push({ priority: priority as string });
    }
    if (type && type !== 'ALL') {
      andFilters.push({ type: type as string });
    }

    // Search query in title/message
    if (search && String(search).trim()) {
      const q = String(search).trim();
      andFilters.push({
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { message: { contains: q, mode: 'insensitive' } }
        ]
      });
    }

    const where: any = andFilters.length > 0 ? { AND: andFilters } : {};
    const unreadWhere: any =
      Object.keys(tenantScope).length > 0 ? { AND: [tenantScope, { read: false }] } : { read: false };

    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const parsedPage = Math.max(1, parseInt(page as string, 10) || 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const [notifications, total, unreadCount] = await Promise.all([
      p.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parsedLimit,
        skip
      }),
      p.notification.count({ where }),
      p.notification.count({ where: unreadWhere })
    ]);

    res.json({
      notifications,
      unreadCount,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.max(1, Math.ceil(total / parsedLimit))
      }
    });
  } catch (error: any) {
    console.error('[NotificationController] Fetch failure:', error.message);
    res.status(500).json({ error: 'Failed to retrieve notifications' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const p = prisma as any;
    const { id } = req.params;

    const existing = await p.notification.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    if (!canAccessNotificationRecord(req as any, existing.userId)) {
      return res.status(403).json({ error: 'Forbidden: Cross-tenant notification access denied' });
    }

    const notification = await p.notification.update({
      where: { id },
      data: { read: true }
    });

    realtimeBus.publish('notification:acked', {
      notificationId: id,
      userId: (req as any).user?.id || (req as any).user?.employeeCode,
      ackedAt: new Date().toISOString()
    }, {
      io: (req as any).io,
      tenantId: (req as any).tenantId || null
    });

    res.json({ success: true, notification });
  } catch (error: any) {
    console.error('[NotificationController] Update failure:', error.message);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const p = prisma as any;
    const tenantScope = buildNotificationTenantWhere(req as any);
    const where = Object.keys(tenantScope).length > 0 ? { AND: [tenantScope, { read: false }] } : { read: false };

    await p.notification.updateMany({
      where,
      data: { read: true }
    });

    realtimeBus.publish('notification:acked', {
      all: true,
      userId: (req as any).user?.id || (req as any).user?.employeeCode,
      ackedAt: new Date().toISOString()
    }, {
      io: (req as any).io,
      tenantId: (req as any).tenantId || null
    });

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    console.error('[NotificationController] Mark all read failure:', error.message);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};
