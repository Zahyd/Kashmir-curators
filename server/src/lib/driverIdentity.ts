import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from './prisma';

export interface ResolvedDriverIdentity {
  user: Record<string, any>;
  driverProfile: Record<string, any> | null;
}

const p = prisma as any;

export function buildGeneratedDriverEmail(accessKey: string): string {
  const safeKey = accessKey.toLowerCase().replace(/[^a-z0-9-]/g, '');
  return `${safeKey}@drivers.kashmirconnect.in`;
}

/**
 * Resolves (or lazily provisions) a dedicated User + APPROVED DriverProfile for an active
 * DRIVER PortalAccessKey (e.g. KC-DRV-XXXXXX) and persists PortalAccessKey.userId.
 * Never downgrades an existing staff/admin user's role if matched.
 */
export async function resolveOrProvisionDriverForPortalKey(
  keyRecord: Record<string, any>
): Promise<ResolvedDriverIdentity | null> {
  if (!keyRecord || String(keyRecord.portalType || '').toUpperCase() !== 'DRIVER') {
    return null;
  }

  const accessKey = String(keyRecord.accessKey || '').trim().toUpperCase();
  if (!accessKey) return null;

  let user: Record<string, any> | null = null;

  if (keyRecord.userId) {
    user = await p.user.findUnique({ where: { id: keyRecord.userId } }).catch(() => null);
  }

  if (!user) {
    user = await p.user.findFirst({ where: { employeeCode: accessKey } }).catch(() => null);
  }

  const contact = typeof keyRecord.assignedContact === 'string' ? keyRecord.assignedContact.trim() : '';
  const contactEmail = contact.includes('@') ? contact.toLowerCase() : null;
  const contactPhone = contact && !contact.includes('@') ? contact : null;

  if (!user && contactEmail) {
    user = await p.user.findUnique({ where: { email: contactEmail } }).catch(() => null);
  }

  if (!user) {
    const emailCandidate = contactEmail || buildGeneratedDriverEmail(accessKey);
    const randomPassword = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10);
    try {
      user = await p.user.create({
        data: {
          name: keyRecord.assignedName || `Chauffeur ${accessKey}`,
          email: emailCandidate,
          phone: contactPhone,
          password: randomPassword,
          role: 'driver',
          employeeCode: accessKey,
          isOnline: false,
        },
      });
    } catch {
      // Handle race on email uniqueness
      user =
        (await p.user.findUnique({ where: { email: emailCandidate } }).catch(() => null)) ||
        (await p.user.findFirst({ where: { employeeCode: accessKey } }).catch(() => null));
    }
  }

  if (!user) return null;

  if (keyRecord.id && keyRecord.userId !== user.id) {
    await p.portalAccessKey
      .update({
        where: { id: keyRecord.id },
        data: { userId: user.id },
      })
      .catch(() => null);
  }

  let driverProfile = await p.driverProfile
    .findUnique({ where: { userId: user.id } })
    .catch(() => null);

  if (!driverProfile) {
    driverProfile = await p.driverProfile.create({
      data: {
        userId: user.id,
        licenseNumber: `JK-DRV-${accessKey.slice(-6)}`,
        vehicleRegNo: 'PENDING-ASSIGN',
        status: 'OFFLINE',
        approvalStatus: 'APPROVED',
        reviewedBy: keyRecord.createdByName || 'PORTAL_KEY_ISSUED',
        reviewedAt: new Date(),
        rating: 4.9,
        tripsCompleted: 0,
        earnings: 0,
        availableBalance: 0,
        acceptanceRate: 98,
        upiId: 'kashmir.driver@okaxis',
      },
    });
  } else if (driverProfile.approvalStatus !== 'APPROVED' && driverProfile.approvalStatus !== 'SUSPENDED') {
    // Active KC-DRV key explicitly issued by Admin authorizes cockpit access
    driverProfile = await p.driverProfile.update({
      where: { id: driverProfile.id },
      data: {
        approvalStatus: 'APPROVED',
        reviewedBy: keyRecord.createdByName || 'PORTAL_KEY_ISSUED',
        reviewedAt: new Date(),
      },
    });
  }

  return { user, driverProfile };
}

export async function getDriverIdentityForUser(
  reqUser: Record<string, any> | undefined
): Promise<ResolvedDriverIdentity | null> {
  if (!reqUser?.id) return null;

  const portalType = String(reqUser.portalType || '').toUpperCase();
  const accessKey = String(reqUser.accessKey || reqUser.employeeCode || '').trim().toUpperCase();

  let user = await p.user.findUnique({ where: { id: reqUser.id } }).catch(() => null);

  if (!user && portalType === 'DRIVER' && accessKey) {
    const keyRecord = await p.portalAccessKey
      .findUnique({ where: { accessKey } })
      .catch(() => null);
    if (keyRecord && keyRecord.status === 'ACTIVE') {
      const resolved = await resolveOrProvisionDriverForPortalKey(keyRecord);
      if (resolved) return resolved;
    }
  }

  if (!user && portalType === 'DRIVER') {
    const keyById = await p.portalAccessKey
      .findUnique({ where: { id: reqUser.id } })
      .catch(() => null);
    if (keyById && keyById.status === 'ACTIVE') {
      const resolved = await resolveOrProvisionDriverForPortalKey(keyById);
      if (resolved) return resolved;
    }
  }

  if (!user) return null;

  const driverProfile = await p.driverProfile
    .findUnique({ where: { userId: user.id } })
    .catch(() => null);

  return { user, driverProfile };
}
