-- Migration: Split structured fleet/compliance/rate-card columns onto Cab,
-- add live driver telemetry & KYC fields on DriverProfile, extend CabReservation,
-- add CabDispatchOffer / DriverPayout / DriverSosAlert, add PortalAccessKey.userId,
-- and idempotently backfill any legacy JSON-object rows in "Cab"."features".

-- 1. Extend "Cab" with structured columns
ALTER TABLE "Cab"
  ADD COLUMN IF NOT EXISTS "plateNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "luggageCapacity" INTEGER NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS "snowChains" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "fourWheelDrive" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "skiRack" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "multiDayAvailable" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "ownership" TEXT NOT NULL DEFAULT 'COMPANY',
  ADD COLUMN IF NOT EXISTS "vendorName" TEXT,
  ADD COLUMN IF NOT EXISTS "vendorPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "verificationStatus" TEXT NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT,
  ADD COLUMN IF NOT EXISTS "unionName" TEXT,
  ADD COLUMN IF NOT EXISTS "unionBadgeNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "unionVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "touristPermitNo" TEXT,
  ADD COLUMN IF NOT EXISTS "permitExpiry" TEXT,
  ADD COLUMN IF NOT EXISTS "commercialRcNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "psvBadgeNo" TEXT,
  ADD COLUMN IF NOT EXISTS "fitnessExpiry" TEXT,
  ADD COLUMN IF NOT EXISTS "rcVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "permitVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "insuranceValid" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "complianceDocs" TEXT,
  ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rateCard" TEXT,
  ADD COLUMN IF NOT EXISTS "driverProfileId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Cab_driverProfileId_fkey'
  ) THEN
    ALTER TABLE "Cab"
      ADD CONSTRAINT "Cab_driverProfileId_fkey"
      FOREIGN KEY ("driverProfileId") REFERENCES "DriverProfile"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Cab_driverProfileId_idx" ON "Cab"("driverProfileId");
CREATE INDEX IF NOT EXISTS "Cab_verificationStatus_isActive_idx" ON "Cab"("verificationStatus", "isActive");
CREATE INDEX IF NOT EXISTS "Cab_plateNumber_idx" ON "Cab"("plateNumber");

-- 2. Extend "DriverProfile" with KYC approval, live radar & wallet fields
ALTER TABLE "DriverProfile"
  ADD COLUMN IF NOT EXISTS "approvalStatus" TEXT NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT,
  ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reviewedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "availableBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "acceptanceRate" DOUBLE PRECISION NOT NULL DEFAULT 96,
  ADD COLUMN IF NOT EXISTS "offersReceived" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "offersAccepted" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "onlineMinutesToday" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "dutyStartedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "psvBadgeNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "unionName" TEXT,
  ADD COLUMN IF NOT EXISTS "unionBadgeNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "kycDocuments" TEXT,
  ADD COLUMN IF NOT EXISTS "upiId" TEXT NOT NULL DEFAULT 'kashmir.driver@okaxis',
  ADD COLUMN IF NOT EXISTS "bankAccountName" TEXT,
  ADD COLUMN IF NOT EXISTS "bankAccountNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "bankIfsc" TEXT,
  ADD COLUMN IF NOT EXISTS "activeVehicleId" TEXT,
  ADD COLUMN IF NOT EXISTS "currentLat" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "currentLng" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "currentSector" TEXT,
  ADD COLUMN IF NOT EXISTS "lastPingAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "DriverProfile_status_idx" ON "DriverProfile"("status");
CREATE INDEX IF NOT EXISTS "DriverProfile_approvalStatus_idx" ON "DriverProfile"("approvalStatus");

-- 3. Extend "PortalAccessKey" with userId
ALTER TABLE "PortalAccessKey"
  ADD COLUMN IF NOT EXISTS "userId" TEXT;

CREATE INDEX IF NOT EXISTS "PortalAccessKey_userId_idx" ON "PortalAccessKey"("userId");

-- 4. Extend "CabReservation" (nullable cabId + real-time tourist booking fields)
ALTER TABLE "CabReservation"
  ALTER COLUMN "cabId" DROP NOT NULL;

ALTER TABLE "CabReservation"
  ADD COLUMN IF NOT EXISTS "userId" TEXT,
  ADD COLUMN IF NOT EXISTS "driverProfileId" TEXT,
  ADD COLUMN IF NOT EXISTS "passengerName" TEXT,
  ADD COLUMN IF NOT EXISTS "passengerPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "passengerEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "travelersCount" INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS "luggageCount" INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS "tripType" TEXT NOT NULL DEFAULT 'airport',
  ADD COLUMN IF NOT EXISTS "requestedCabType" TEXT,
  ADD COLUMN IF NOT EXISTS "pickupLat" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "pickupLng" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "dropLat" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "dropLng" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "estimatedDistanceKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "estimatedDurationMin" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "offeredFare" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "counterOfferFare" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "counterOfferReason" TEXT,
  ADD COLUMN IF NOT EXISTS "agreedFare" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "securityPin" TEXT,
  ADD COLUMN IF NOT EXISTS "specialNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "arrivalTelemetry" TEXT,
  ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CabReservation_cabId_fkey'
  ) THEN
    ALTER TABLE "CabReservation" DROP CONSTRAINT "CabReservation_cabId_fkey";
  END IF;
  ALTER TABLE "CabReservation"
    ADD CONSTRAINT "CabReservation_cabId_fkey"
    FOREIGN KEY ("cabId") REFERENCES "Cab"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CabReservation_userId_fkey'
  ) THEN
    ALTER TABLE "CabReservation"
      ADD CONSTRAINT "CabReservation_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CabReservation_driverProfileId_fkey'
  ) THEN
    ALTER TABLE "CabReservation"
      ADD CONSTRAINT "CabReservation_driverProfileId_fkey"
      FOREIGN KEY ("driverProfileId") REFERENCES "DriverProfile"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CabReservation_organizationId_fkey'
  ) THEN
    ALTER TABLE "CabReservation"
      ADD CONSTRAINT "CabReservation_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "CabReservation_userId_idx" ON "CabReservation"("userId");
CREATE INDEX IF NOT EXISTS "CabReservation_driverProfileId_idx" ON "CabReservation"("driverProfileId");
CREATE INDEX IF NOT EXISTS "CabReservation_organizationId_idx" ON "CabReservation"("organizationId");

-- 5. Create "CabDispatchOffer", "DriverPayout", "DriverSosAlert"
CREATE TABLE IF NOT EXISTS "CabDispatchOffer" (
  "id" TEXT NOT NULL,
  "reservationId" TEXT NOT NULL,
  "driverProfileId" TEXT NOT NULL,
  "cabId" TEXT NOT NULL,
  "driverName" TEXT NOT NULL,
  "driverPhone" TEXT,
  "driverRating" DOUBLE PRECISION NOT NULL DEFAULT 4.8,
  "driverTrips" INTEGER NOT NULL DEFAULT 0,
  "vehicleName" TEXT NOT NULL,
  "vehicleType" TEXT NOT NULL,
  "vehicleImage" TEXT,
  "vehicleRegNo" TEXT NOT NULL,
  "capacity" INTEGER NOT NULL DEFAULT 6,
  "luggageCapacity" INTEGER NOT NULL DEFAULT 4,
  "snowChains" BOOLEAN NOT NULL DEFAULT true,
  "fourWheelDrive" BOOLEAN NOT NULL DEFAULT false,
  "unionVerified" BOOLEAN NOT NULL DEFAULT true,
  "unionName" TEXT,
  "initialFare" DOUBLE PRECISION NOT NULL,
  "driverFare" DOUBLE PRECISION NOT NULL,
  "touristCounter" DOUBLE PRECISION,
  "status" TEXT NOT NULL DEFAULT 'OFFERED',
  "driverMessage" TEXT,
  "etaMinutes" INTEGER NOT NULL DEFAULT 12,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CabDispatchOffer_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CabDispatchOffer_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "CabReservation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CabDispatchOffer_driverProfileId_fkey" FOREIGN KEY ("driverProfileId") REFERENCES "DriverProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CabDispatchOffer_cabId_fkey" FOREIGN KEY ("cabId") REFERENCES "Cab"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "CabDispatchOffer_reservationId_driverProfileId_key"
  ON "CabDispatchOffer"("reservationId", "driverProfileId");
CREATE INDEX IF NOT EXISTS "CabDispatchOffer_reservationId_status_idx"
  ON "CabDispatchOffer"("reservationId", "status");
CREATE INDEX IF NOT EXISTS "CabDispatchOffer_driverProfileId_status_idx"
  ON "CabDispatchOffer"("driverProfileId", "status");

CREATE TABLE IF NOT EXISTS "DriverPayout" (
  "id" TEXT NOT NULL,
  "driverProfileId" TEXT NOT NULL,
  "payoutRef" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "upiId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PROCESSED_INSTANT_SETTLEMENT',
  "notes" TEXT,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DriverPayout_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DriverPayout_driverProfileId_fkey" FOREIGN KEY ("driverProfileId") REFERENCES "DriverProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "DriverPayout_payoutRef_key" ON "DriverPayout"("payoutRef");
CREATE INDEX IF NOT EXISTS "DriverPayout_driverProfileId_idx" ON "DriverPayout"("driverProfileId");
CREATE INDEX IF NOT EXISTS "DriverPayout_createdAt_idx" ON "DriverPayout"("createdAt");

CREATE TABLE IF NOT EXISTS "DriverSosAlert" (
  "id" TEXT NOT NULL,
  "driverProfileId" TEXT,
  "reservationId" TEXT,
  "driverName" TEXT NOT NULL,
  "driverPhone" TEXT,
  "vehicleRegNo" TEXT,
  "location" TEXT NOT NULL DEFAULT 'Srinagar–Gulmarg Corridor',
  "lat" DOUBLE PRECISION,
  "lng" DOUBLE PRECISION,
  "incidentType" TEXT NOT NULL DEFAULT 'SOS Alert Triggered',
  "severity" TEXT NOT NULL DEFAULT 'CRITICAL',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "notes" TEXT,
  "resolvedBy" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DriverSosAlert_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DriverSosAlert_driverProfileId_fkey" FOREIGN KEY ("driverProfileId") REFERENCES "DriverProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "DriverSosAlert_driverProfileId_idx" ON "DriverSosAlert"("driverProfileId");
CREATE INDEX IF NOT EXISTS "DriverSosAlert_status_idx" ON "DriverSosAlert"("status");
CREATE INDEX IF NOT EXISTS "DriverSosAlert_createdAt_idx" ON "DriverSosAlert"("createdAt");

-- 6. Idempotent Backfill: migrate legacy JSON-object rows in "Cab"."features" into
-- dedicated structured columns while normalizing "Cab"."features" back to JSON string[].
DO $$
DECLARE
  cab_rec RECORD;
  parsed JSONB;
  clean_tags JSONB;
  ver_status TEXT;
BEGIN
  FOR cab_rec IN SELECT * FROM "Cab" LOOP
    IF cab_rec."features" IS NULL OR left(btrim(cab_rec."features"), 1) <> '{' THEN
      CONTINUE;
    END IF;

    BEGIN
      parsed := cab_rec."features"::jsonb;
    EXCEPTION WHEN OTHERS THEN
      CONTINUE;
    END;

    IF jsonb_typeof(parsed) <> 'object' THEN
      CONTINUE;
    END IF;

    ver_status := upper(COALESCE(NULLIF(btrim(parsed->>'verificationStatus'), ''), cab_rec."verificationStatus", 'APPROVED'));
    IF ver_status NOT IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED') THEN
      ver_status := cab_rec."verificationStatus";
    END IF;

    IF jsonb_typeof(parsed->'features') = 'array' AND jsonb_array_length(parsed->'features') > 0 THEN
      clean_tags := parsed->'features';
    ELSIF jsonb_typeof(parsed->'amenities') = 'array' AND jsonb_array_length(parsed->'amenities') > 0 THEN
      clean_tags := parsed->'amenities';
    ELSE
      clean_tags := jsonb_build_array('Snow Chains Equipped', 'Heated Cabin', 'GPS Tracked');
      IF COALESCE((parsed->>'fourWheelDrive')::boolean, false) THEN
        clean_tags := clean_tags || jsonb_build_array('4x4 Winter Drivetrain');
      END IF;
      IF COALESCE((parsed->>'skiRack')::boolean, false) THEN
        clean_tags := clean_tags || jsonb_build_array('Roof Ski Rack');
      END IF;
      IF ver_status = 'APPROVED' THEN
        clean_tags := clean_tags || jsonb_build_array('Taxi Union Verified');
      END IF;
    END IF;

    UPDATE "Cab"
    SET
      "plateNumber" = COALESCE("plateNumber", NULLIF(upper(btrim(COALESCE(parsed->>'plateNumber', parsed->>'vehicleRegNo'))), '')),
      "luggageCapacity" = CASE
        WHEN (parsed->>'luggageCapacity') ~ '^[0-9]+$' AND (parsed->>'luggageCapacity')::integer > 0
          THEN (parsed->>'luggageCapacity')::integer
        ELSE "luggageCapacity"
      END,
      "snowChains" = CASE
        WHEN jsonb_typeof(parsed->'snowChains') = 'boolean' THEN (parsed->>'snowChains')::boolean
        ELSE "snowChains"
      END,
      "fourWheelDrive" = CASE
        WHEN jsonb_typeof(parsed->'fourWheelDrive') = 'boolean' THEN (parsed->>'fourWheelDrive')::boolean
        ELSE "fourWheelDrive"
      END,
      "skiRack" = CASE
        WHEN jsonb_typeof(parsed->'skiRack') = 'boolean' THEN (parsed->>'skiRack')::boolean
        ELSE "skiRack"
      END,
      "multiDayAvailable" = CASE
        WHEN jsonb_typeof(parsed->'multiDayAvailable') = 'boolean' THEN (parsed->>'multiDayAvailable')::boolean
        ELSE "multiDayAvailable"
      END,
      "verificationStatus" = ver_status,
      "rejectionReason" = COALESCE("rejectionReason", NULLIF(btrim(parsed->>'rejectionReason'), '')),
      "unionName" = COALESCE("unionName", NULLIF(btrim(parsed->>'unionName'), '')),
      "unionBadgeNumber" = COALESCE("unionBadgeNumber", NULLIF(btrim(parsed->>'unionBadgeNumber'), '')),
      "unionVerified" = COALESCE(
        "unionVerified"
        OR (CASE WHEN jsonb_typeof(parsed->'unionVerified') = 'boolean' THEN (parsed->>'unionVerified')::boolean ELSE false END)
        OR ver_status = 'APPROVED',
        false
      ),
      "touristPermitNo" = COALESCE("touristPermitNo", NULLIF(btrim(parsed->>'touristPermitNo'), '')),
      "permitExpiry" = COALESCE("permitExpiry", NULLIF(btrim(parsed->>'permitExpiry'), '')),
      "commercialRcNumber" = COALESCE("commercialRcNumber", NULLIF(btrim(parsed->>'commercialRcNumber'), '')),
      "psvBadgeNo" = COALESCE("psvBadgeNo", NULLIF(btrim(parsed->>'psvBadgeNo'), '')),
      "fitnessExpiry" = COALESCE("fitnessExpiry", NULLIF(btrim(parsed->>'fitnessExpiry'), '')),
      "complianceDocs" = COALESCE(
        "complianceDocs",
        CASE
          WHEN parsed ? 'complianceDocs' THEN (parsed->'complianceDocs')::text
          WHEN parsed ? 'documents' THEN (parsed->'documents')::text
          ELSE NULL
        END
      ),
      "rateCard" = COALESCE("rateCard", CASE WHEN parsed ? 'rateCard' THEN (parsed->'rateCard')::text ELSE NULL END),
      "driverProfileId" = COALESCE("driverProfileId", NULLIF(btrim(parsed->>'driverProfileId'), '')),
      "features" = clean_tags::text
    WHERE "id" = cab_rec."id";
  END LOOP;
END $$;
