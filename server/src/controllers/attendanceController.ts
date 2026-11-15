import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

// Utility for Asia/Kolkata YYYY-MM-DD date string
const getKolkataDateString = (d: Date = new Date()): string => {
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // Returns YYYY-MM-DD
};

// 1. Clock In / Start Shift
export const clockIn = async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const employeeCode = user.code || user.accessKey || user.id || 'EMP-PORTAL';
    const employeeName = user.name || user.assignedName || user.email || 'Operations Officer';
    const role = user.role || 'hospitality';
    const today = getKolkataDateString();
    const now = new Date();

    // Check or create today's attendance record
    let attendance = await p.employeeAttendance.findUnique({
      where: {
        employeeCode_date: {
          employeeCode,
          date: today
        }
      }
    });

    if (!attendance) {
      attendance = await p.employeeAttendance.create({
        data: {
          employeeCode,
          employeeName,
          role,
          date: today,
          firstLoginAt: now,
          status: 'PRESENT',
          shiftName: 'General Operations (09:00 - 18:00)'
        }
      });
    } else if (attendance.status === 'CLOCKED_OUT') {
      attendance = await p.employeeAttendance.update({
        where: { id: attendance.id },
        data: { status: 'PRESENT' }
      });
    }

    // Terminate any stale active sessions for this employee
    await p.employeeSession.updateMany({
      where: { employeeCode, isActive: true },
      data: { isActive: false, logoutAt: now }
    });

    // Create fresh active session
    const session = await p.employeeSession.create({
      data: {
        employeeCode,
        employeeName,
        role,
        portalType: user.portalType || 'HOSPITALITY',
        loginAt: now,
        lastActivityAt: now,
        isActive: true,
        assignedDesk: req.body?.assignedDesk || 'Central Reservations'
      }
    });

    res.json({
      success: true,
      message: `Clocked in successfully as ${employeeName}`,
      attendance,
      session
    });
  } catch (error: any) {
    console.error('[AttendanceController] Clock-in error:', error);
    res.status(500).json({ error: 'Failed to record clock-in' });
  }
};

// 2. Heartbeat / Activity Pulse (Server-side productive time tracking)
export const recordPulse = async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const employeeCode = user.code || user.accessKey || user.id || 'EMP-PORTAL';
    const now = new Date();
    const today = getKolkataDateString(now);

    const activeSession = await p.employeeSession.findFirst({
      where: { employeeCode, isActive: true },
      orderBy: { loginAt: 'desc' }
    });

    if (activeSession && !activeSession.isOnBreak) {
      const minutesSinceLast = Math.max(0, Math.min(10, Math.round((now.getTime() - new Date(activeSession.lastActivityAt).getTime()) / 60000)));

      await p.employeeSession.update({
        where: { id: activeSession.id },
        data: { lastActivityAt: now }
      });

      if (minutesSinceLast > 0) {
        await p.employeeAttendance.updateMany({
          where: { employeeCode, date: today },
          data: {
            totalWorkMinutes: { increment: minutesSinceLast }
          }
        });
      }
    }

    res.json({ success: true, timestamp: now.toISOString() });
  } catch (error: any) {
    console.error('[AttendanceController] Pulse error:', error);
    res.status(500).json({ error: 'Failed to record activity pulse' });
  }
};

// 3. Toggle Break
export const toggleBreak = async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const employeeCode = user.code || user.accessKey || user.id || 'EMP-PORTAL';
    const now = new Date();
    const today = getKolkataDateString(now);

    const activeSession = await p.employeeSession.findFirst({
      where: { employeeCode, isActive: true },
      orderBy: { loginAt: 'desc' }
    });

    if (!activeSession) {
      return res.status(404).json({ error: 'No active session found. Please clock in first.' });
    }

    const startingBreak = !activeSession.isOnBreak;

    if (startingBreak) {
      // Start break
      await p.employeeSession.update({
        where: { id: activeSession.id },
        data: {
          isOnBreak: true,
          breakStartAt: now
        }
      });

      await p.employeeAttendance.updateMany({
        where: { employeeCode, date: today },
        data: { status: 'ON_BREAK' }
      });

      res.json({ success: true, isOnBreak: true, message: 'Break started.' });
    } else {
      // End break
      const breakDuration = activeSession.breakStartAt
        ? Math.max(0, Math.round((now.getTime() - new Date(activeSession.breakStartAt).getTime()) / 60000))
        : 0;

      await p.employeeSession.update({
        where: { id: activeSession.id },
        data: {
          isOnBreak: false,
          breakStartAt: null,
          breakMinutes: { increment: breakDuration },
          lastActivityAt: now
        }
      });

      await p.employeeAttendance.updateMany({
        where: { employeeCode, date: today },
        data: {
          status: 'PRESENT',
          totalBreakMinutes: { increment: breakDuration }
        }
      });

      res.json({ success: true, isOnBreak: false, message: `Break ended (${breakDuration} mins logged).` });
    }
  } catch (error: any) {
    console.error('[AttendanceController] Toggle break error:', error);
    res.status(500).json({ error: 'Failed to toggle break status' });
  }
};

// 4. Clock Out / End Shift
export const clockOut = async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const employeeCode = user.code || user.accessKey || user.id || 'EMP-PORTAL';
    const now = new Date();
    const today = getKolkataDateString(now);

    // End active session
    await p.employeeSession.updateMany({
      where: { employeeCode, isActive: true },
      data: {
        isActive: false,
        isOnBreak: false,
        logoutAt: now
      }
    });

    // Update attendance record status
    await p.employeeAttendance.updateMany({
      where: { employeeCode, date: today },
      data: {
        lastLogoutAt: now,
        status: 'CLOCKED_OUT'
      }
    });

    res.json({ success: true, message: 'Shift completed. Clocked out successfully.' });
  } catch (error: any) {
    console.error('[AttendanceController] Clock-out error:', error);
    res.status(500).json({ error: 'Failed to clock out' });
  }
};

// 5. Get My Current Attendance & Session Status
export const getMyAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const employeeCode = user.code || user.accessKey || user.id || 'EMP-PORTAL';
    const today = getKolkataDateString();

    const [attendance, session, history] = await Promise.all([
      p.employeeAttendance.findUnique({
        where: { employeeCode_date: { employeeCode, date: today } }
      }),
      p.employeeSession.findFirst({
        where: { employeeCode, isActive: true },
        orderBy: { loginAt: 'desc' }
      }),
      p.employeeAttendance.findMany({
        where: { employeeCode },
        orderBy: { date: 'desc' },
        take: 14
      })
    ]);

    res.json({
      attendance,
      session,
      history: history || []
    });
  } catch (error: any) {
    console.error('[AttendanceController] Get my attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
};

// 6. Live Employee Presence Dashboard (All Online / Active Teammates)
export const getLivePresence = async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const activeSessions = await p.employeeSession.findMany({
      where: { isActive: true },
      orderBy: { loginAt: 'desc' }
    });

    const today = getKolkataDateString();
    const attendanceRecords = await p.employeeAttendance.findMany({
      where: { date: today }
    });

    const attendanceMap = new Map();
    attendanceRecords.forEach((a: any) => attendanceMap.set(a.employeeCode, a));

    // Get count of pending reservations for each employee if applicable
    const activeReservations = await p.hotelReservation.findMany({
      where: {
        status: { in: ['Pending', 'Confirmed', 'Hold'] }
      },
      select: { agentName: true, id: true }
    });

    const resCountMap = new Map<string, number>();
    activeReservations.forEach((r: any) => {
      if (r.agentName) {
        resCountMap.set(r.agentName, (resCountMap.get(r.agentName) || 0) + 1);
      }
    });

    const presenceList = activeSessions.map((s: any) => {
      const att = attendanceMap.get(s.employeeCode);
      const assignedCount = resCountMap.get(s.employeeName) || 0;
      return {
        id: s.id,
        employeeCode: s.employeeCode,
        employeeName: s.employeeName,
        role: s.role,
        portalType: s.portalType,
        loginAt: s.loginAt,
        lastActivityAt: s.lastActivityAt,
        isOnBreak: s.isOnBreak,
        breakMinutes: s.breakMinutes,
        assignedDesk: s.assignedDesk || 'Hospitality Desk',
        totalWorkMinutes: att?.totalWorkMinutes || 0,
        status: s.isOnBreak ? 'ON_BREAK' : 'ONLINE',
        activeReservationsCount: assignedCount
      };
    });

    res.json({
      presenceList,
      totalActive: presenceList.length,
      totalOnBreak: presenceList.filter((p: any) => p.isOnBreak).length,
      totalOnline: presenceList.filter((p: any) => !p.isOnBreak).length
    });
  } catch (error: any) {
    console.error('[AttendanceController] Live presence error:', error);
    res.status(500).json({ error: 'Failed to fetch live presence' });
  }
};

// 7. Attendance Reports (Historical & CSV Export)
export const getAttendanceReports = async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const { startDate, endDate, role } = req.query;

    const where: any = {};
    if (role && role !== 'ALL') where.role = role as string;
    if (startDate && endDate) {
      where.date = { gte: startDate as string, lte: endDate as string };
    }

    const records = await p.employeeAttendance.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 100
    });

    res.json(records);
  } catch (error: any) {
    console.error('[AttendanceController] Reports error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance reports' });
  }
};
