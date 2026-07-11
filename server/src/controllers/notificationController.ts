import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const p = prisma as any;
    const { read, priority, search, limit = '20', page = '1' } = req.query;

    const where: any = {};

    // Filter by read status
    if (read !== undefined) {
      where.read = read === 'true';
    }

    // Filter by priority
    if (priority) {
      where.priority = priority as string;
    }

    // Search query in title/message
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { message: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const take = parseInt(limit as string, 10);
    const skip = (parseInt(page as string, 10) - 1) * take;

    const [notifications, total] = await Promise.all([
      p.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip
      }),
      p.notification.count({ where })
    ]);

    res.json({
      notifications,
      pagination: {
        total,
        page: parseInt(page as string, 10),
        limit: take,
        totalPages: Math.ceil(total / take)
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

    const notification = await p.notification.update({
      where: { id },
      data: { read: true }
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
    
    await p.notification.updateMany({
      where: { read: false },
      data: { read: true }
    });

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    console.error('[NotificationController] Mark all read failure:', error.message);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};
