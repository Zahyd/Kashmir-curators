import { PrismaClient } from '@prisma/client';

export interface ParsedCabFeaturesLegacy {
  isLegacyObject: boolean;
  cleanFeatures: string[];
  structured: {
    plateNumber?: string;
    luggageCapacity?: number;
    snowChains?: boolean;
    fourWheelDrive?: boolean;
    skiRack?: boolean;
    multiDayAvailable?: boolean;
    ownership?: string;
    vendorName?: string;
    vendorPhone?: string;
    verificationStatus?: string;
    rejectionReason?: string;
    unionName?: string;
    unionBadgeNumber?: string;
    unionVerified?: boolean;
    touristPermitNo?: string;
    permitExpiry?: string;
    commercialRcNumber?: string;
    psvBadgeNo?: string;
    fitnessExpiry?: string;
    rcVerified?: boolean;
    permitVerified?: boolean;
    insuranceValid?: boolean;
    complianceDocs?: string;
    submittedAt?: Date;
    approvedAt?: Date;
    rateCard?: string;
    driverProfileId?: string;
  };
}

function asNonEmptyString(val: unknown): string | undefined {
  if (typeof val !== 'string') return undefined;
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asOptionalDate(val: unknown): Date | undefined {
  if (val instanceof Date && !Number.isNaN(val.getTime())) return val;
  if (typeof val === 'string' && val.trim().length > 0) {
    const parsed = new Date(val);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return undefined;
}

function buildFallbackFeatureTags(obj: Record<string, unknown>, existingType?: string): string[] {
  const tags = new Set<string>();
  const rawList = Array.isArray(obj.features)
    ? obj.features
    : Array.isArray(obj.amenities)
      ? obj.amenities
      : [];

  for (const entry of rawList) {
    if (typeof entry === 'string' && entry.trim()) {
      tags.add(entry.trim());
    }
  }

  if (obj.fourWheelDrive === true) tags.add('4x4 Winter Drivetrain');
  if (obj.snowChains !== false) tags.add('Snow Chains Equipped');
  if (obj.skiRack === true) tags.add('Roof Ski Rack');
  if (obj.multiDayAvailable === true) tags.add('Multi-Day Outstation Ready');
  if (obj.unionVerified === true || obj.verificationStatus === 'APPROVED') {
    tags.add('Taxi Union Verified');
  }
  if (existingType && /innova|crysta|tempo|force/i.test(existingType)) {
    tags.add('Spacious Luggage Cabin');
  }

  if (tags.size === 0) {
    tags.add('Snow Chains Equipped');
    tags.add('Heated Cabin');
    tags.add('GPS Tracked');
  }

  return Array.from(tags);
}

export function parseCabFeaturesArray(rawFeatures: unknown, existingType?: string): string[] {
  const parsed = parseCabFeaturesLegacy(rawFeatures, existingType);
  return parsed.cleanFeatures;
}

export function parseCabFeaturesLegacy(
  rawFeatures: unknown,
  existingType?: string
): ParsedCabFeaturesLegacy {
  if (Array.isArray(rawFeatures)) {
    const clean = rawFeatures
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim());
    return {
      isLegacyObject: false,
      cleanFeatures: clean.length > 0 ? clean : ['Snow Chains Equipped', 'Heated Cabin'],
      structured: {},
    };
  }

  if (typeof rawFeatures !== 'string' || !rawFeatures.trim()) {
    return {
      isLegacyObject: false,
      cleanFeatures: ['Snow Chains Equipped', 'Heated Cabin'],
      structured: {},
    };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawFeatures);
  } catch {
    const split = rawFeatures
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      isLegacyObject: false,
      cleanFeatures: split.length > 0 ? split : ['Snow Chains Equipped', 'Heated Cabin'],
      structured: {},
    };
  }

  if (Array.isArray(parsedJson)) {
    const clean = parsedJson
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim());
    return {
      isLegacyObject: false,
      cleanFeatures: clean.length > 0 ? clean : ['Snow Chains Equipped', 'Heated Cabin'],
      structured: {},
    };
  }

  if (parsedJson && typeof parsedJson === 'object') {
    const obj = parsedJson as Record<string, unknown>;
    const rawRateCard = obj.rateCard && typeof obj.rateCard === 'object' ? obj.rateCard : null;
    const rawDocs =
      obj.complianceDocs && typeof obj.complianceDocs === 'object'
        ? obj.complianceDocs
        : obj.documents && typeof obj.documents === 'object'
          ? obj.documents
          : null;

    const verificationStatus = asNonEmptyString(obj.verificationStatus)?.toUpperCase();
    const plateRaw = asNonEmptyString(obj.plateNumber) || asNonEmptyString(obj.vehicleRegNo);

    const structured: ParsedCabFeaturesLegacy['structured'] = {
      plateNumber: plateRaw ? plateRaw.toUpperCase() : undefined,
      luggageCapacity:
        typeof obj.luggageCapacity === 'number' && Number.isFinite(obj.luggageCapacity)
          ? Math.max(1, Math.round(obj.luggageCapacity))
          : undefined,
      snowChains: typeof obj.snowChains === 'boolean' ? obj.snowChains : undefined,
      fourWheelDrive: typeof obj.fourWheelDrive === 'boolean' ? obj.fourWheelDrive : undefined,
      skiRack: typeof obj.skiRack === 'boolean' ? obj.skiRack : undefined,
      multiDayAvailable:
        typeof obj.multiDayAvailable === 'boolean' ? obj.multiDayAvailable : undefined,
      ownership: asNonEmptyString(obj.ownership)?.toUpperCase(),
      vendorName: asNonEmptyString(obj.vendorName),
      vendorPhone: asNonEmptyString(obj.vendorPhone),
      verificationStatus:
        verificationStatus && ['PENDING_APPROVAL', 'APPROVED', 'REJECTED'].includes(verificationStatus)
          ? verificationStatus
          : undefined,
      rejectionReason: asNonEmptyString(obj.rejectionReason),
      unionName: asNonEmptyString(obj.unionName),
      unionBadgeNumber: asNonEmptyString(obj.unionBadgeNumber),
      unionVerified:
        typeof obj.unionVerified === 'boolean'
          ? obj.unionVerified
          : verificationStatus === 'APPROVED'
            ? true
            : undefined,
      touristPermitNo: asNonEmptyString(obj.touristPermitNo),
      permitExpiry: asNonEmptyString(obj.permitExpiry),
      commercialRcNumber: asNonEmptyString(obj.commercialRcNumber),
      psvBadgeNo: asNonEmptyString(obj.psvBadgeNo),
      fitnessExpiry: asNonEmptyString(obj.fitnessExpiry),
      rcVerified: typeof obj.rcVerified === 'boolean' ? obj.rcVerified : undefined,
      permitVerified: typeof obj.permitVerified === 'boolean' ? obj.permitVerified : undefined,
      insuranceValid: typeof obj.insuranceValid === 'boolean' ? obj.insuranceValid : undefined,
      complianceDocs: rawDocs ? JSON.stringify(rawDocs) : undefined,
      submittedAt: asOptionalDate(obj.submittedAt),
      approvedAt: asOptionalDate(obj.approvedAt),
      rateCard: rawRateCard ? JSON.stringify(rawRateCard) : undefined,
      driverProfileId: asNonEmptyString(obj.driverProfileId),
    };

    return {
      isLegacyObject: true,
      cleanFeatures: buildFallbackFeatureTags(obj, existingType),
      structured,
    };
  }

  return {
    isLegacyObject: false,
    cleanFeatures: ['Snow Chains Equipped', 'Heated Cabin'],
    structured: {},
  };
}

export interface BackfillReport {
  scanned: number;
  migrated: number;
  skipped: number;
  errors: number;
  migratedIds: string[];
}

export async function backfillLegacyCabFeatures(prismaClient: PrismaClient | any): Promise<BackfillReport> {
  const cabs: Array<Record<string, any>> = await prismaClient.cab.findMany({
    orderBy: { createdAt: 'asc' },
  });

  const report: BackfillReport = {
    scanned: cabs.length,
    migrated: 0,
    skipped: 0,
    errors: 0,
    migratedIds: [],
  };

  for (const cab of cabs) {
    try {
      const parsed = parseCabFeaturesLegacy(cab.features, cab.type);
      if (!parsed.isLegacyObject) {
        report.skipped += 1;
        continue;
      }

      const s = parsed.structured;
      const updateData: Record<string, unknown> = {
        features: JSON.stringify(parsed.cleanFeatures),
      };

      if (!cab.plateNumber && s.plateNumber) updateData.plateNumber = s.plateNumber;
      if (
        s.luggageCapacity !== undefined &&
        (cab.luggageCapacity === null || cab.luggageCapacity === undefined || cab.luggageCapacity === 4)
      ) {
        updateData.luggageCapacity = s.luggageCapacity;
      }
      if (s.snowChains !== undefined) updateData.snowChains = s.snowChains;
      if (s.fourWheelDrive !== undefined) updateData.fourWheelDrive = s.fourWheelDrive;
      if (s.skiRack !== undefined) updateData.skiRack = s.skiRack;
      if (s.multiDayAvailable !== undefined) updateData.multiDayAvailable = s.multiDayAvailable;
      if (s.ownership && (!cab.ownership || cab.ownership === 'COMPANY')) updateData.ownership = s.ownership;
      if (!cab.vendorName && s.vendorName) updateData.vendorName = s.vendorName;
      if (!cab.vendorPhone && s.vendorPhone) updateData.vendorPhone = s.vendorPhone;
      if (s.verificationStatus && (!cab.verificationStatus || cab.verificationStatus === 'APPROVED')) {
        updateData.verificationStatus = s.verificationStatus;
      }
      if (!cab.rejectionReason && s.rejectionReason) updateData.rejectionReason = s.rejectionReason;
      if (!cab.unionName && s.unionName) updateData.unionName = s.unionName;
      if (!cab.unionBadgeNumber && s.unionBadgeNumber) updateData.unionBadgeNumber = s.unionBadgeNumber;
      if (s.unionVerified !== undefined && !cab.unionVerified) updateData.unionVerified = s.unionVerified;
      if (!cab.touristPermitNo && s.touristPermitNo) updateData.touristPermitNo = s.touristPermitNo;
      if (!cab.permitExpiry && s.permitExpiry) updateData.permitExpiry = s.permitExpiry;
      if (!cab.commercialRcNumber && s.commercialRcNumber) updateData.commercialRcNumber = s.commercialRcNumber;
      if (!cab.psvBadgeNo && s.psvBadgeNo) updateData.psvBadgeNo = s.psvBadgeNo;
      if (!cab.fitnessExpiry && s.fitnessExpiry) updateData.fitnessExpiry = s.fitnessExpiry;
      if (s.rcVerified !== undefined && !cab.rcVerified) updateData.rcVerified = s.rcVerified;
      if (s.permitVerified !== undefined && !cab.permitVerified) updateData.permitVerified = s.permitVerified;
      if (s.insuranceValid !== undefined) updateData.insuranceValid = s.insuranceValid;
      if (!cab.complianceDocs && s.complianceDocs) updateData.complianceDocs = s.complianceDocs;
      if (!cab.submittedAt && s.submittedAt) updateData.submittedAt = s.submittedAt;
      if (!cab.approvedAt && s.approvedAt) updateData.approvedAt = s.approvedAt;
      if (!cab.rateCard && s.rateCard) updateData.rateCard = s.rateCard;
      if (!cab.driverProfileId && s.driverProfileId) updateData.driverProfileId = s.driverProfileId;

      await prismaClient.cab.update({
        where: { id: cab.id },
        data: updateData,
      });

      report.migrated += 1;
      report.migratedIds.push(cab.id);
    } catch (err) {
      console.error(`[CabBackfill] Failed to backfill cab ${cab.id}:`, err);
      report.errors += 1;
    }
  }

  return report;
}
