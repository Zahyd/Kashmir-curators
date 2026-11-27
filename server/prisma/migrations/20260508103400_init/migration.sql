-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'AGENCY',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "tier" TEXT NOT NULL DEFAULT 'STARTER',
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "logo" TEXT,
    "domain" TEXT,
    "settings" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "password" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "employeeCode" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "leadCapacity" INTEGER NOT NULL DEFAULT 5,
    "organizationId" TEXT,
    "uploadedDocuments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "originalPrice" DOUBLE PRECISION NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "image" TEXT NOT NULL,
    "highlights" TEXT NOT NULL,
    "inclusions" TEXT NOT NULL,
    "exclusions" TEXT NOT NULL,
    "itinerary" TEXT NOT NULL,
    "bestSeason" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hotel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "starRating" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "pricePerNight" DOUBLE PRECISION NOT NULL,
    "image" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amenities" TEXT NOT NULL,
    "roomTypes" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "receptionEmail" TEXT,
    "reservationsEmail" TEXT,
    "managerName" TEXT,
    "whatsappNumber" TEXT,
    "alternatePhone" TEXT,
    "emergencyContact" TEXT,
    "address" TEXT,
    "cancellationPolicy" TEXT,
    "taxRatePct" DOUBLE PRECISION DEFAULT 12.0,
    "bankName" TEXT,
    "bankAccountNumber" TEXT,
    "bankIfsc" TEXT,
    "bankAccountName" TEXT,
    "paymentTerms" TEXT,
    "commissionStructure" TEXT,
    "seasonalPricing" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hotel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cab" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "pricePerKm" DOUBLE PRECISION NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "image" TEXT NOT NULL,
    "features" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "packageName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FAQ" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "stage" TEXT NOT NULL DEFAULT 'DRAFT',
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "details" TEXT NOT NULL,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "organizationId" TEXT,
    "customerName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "travelers" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "accommodation" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'New',
    "leadStage" TEXT NOT NULL DEFAULT 'NEW_LEAD',
    "assignedTo" TEXT,
    "priority" TEXT,
    "sentiment" TEXT,
    "quoteData" TEXT,
    "proposalUrl" TEXT,
    "flightDetails" TEXT,
    "feedback" TEXT,
    "netPrice" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "agentMarkup" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "agentId" TEXT,
    "leadId" TEXT,
    "leadScore" INTEGER NOT NULL DEFAULT 0,
    "leadCategory" TEXT,
    "intentQuery" TEXT,
    "travelStartDate" TIMESTAMP(3),
    "travelEndDate" TIMESTAMP(3),
    "adultsCount" INTEGER NOT NULL DEFAULT 2,
    "childrenCount" INTEGER NOT NULL DEFAULT 0,
    "arrivalCity" TEXT,
    "nightsCount" INTEGER,
    "budgetRange" TEXT,
    "preferredAccommodation" TEXT,
    "transportPreference" TEXT,
    "placesVisited" TEXT,
    "travelStyle" TEXT,
    "wantOffbeat" TEXT,
    "sourceCta" TEXT,
    "scoringBreakdown" TEXT,
    "profileCompleteness" INTEGER NOT NULL DEFAULT 25,
    "notes" TEXT,
    "duplicateOfId" TEXT,
    "lastContactedAt" TIMESTAMP(3),
    "nextFollowUpDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadActivity" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadNote" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUpReminder" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "assignedTo" TEXT,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUpReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppMessage" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT,
    "customerPhone" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "templateName" TEXT,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "metaMessageId" TEXT,
    "senderId" TEXT,
    "senderName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InquiryDocument" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'ID_PROOF',
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "uploadedBy" TEXT,
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InquiryDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CabReservation" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT,
    "bookingId" TEXT,
    "cabId" TEXT NOT NULL,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "vehicleRegNo" TEXT,
    "pickupLocation" TEXT NOT NULL,
    "dropLocation" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ALLOCATED',
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "contractRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "profitMargin" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "voucherReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CabReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER,
    "mimeType" TEXT,
    "publicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionLedger" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "imageUrl" TEXT,
    "seoKeywords" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonalCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bannerImage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "packages" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeasonalCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteContent" (
    "id" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "content" JSONB NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Curator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "licenseNo" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "languages" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Curator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelAdvisory" (
    "id" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'NORMAL',
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "corridors" TEXT,
    "source" TEXT NOT NULL DEFAULT 'J&K Tourism & Administration',
    "sourceUrl" TEXT,
    "validFrom" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "recommendedAction" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "emergencyModeActive" BOOLEAN NOT NULL DEFAULT false,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravelAdvisory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageReview" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT NOT NULL,
    "userAvatar" TEXT,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "helpful" INTEGER NOT NULL DEFAULT 0,
    "tripType" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackageReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotelReservation" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT,
    "hotelId" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT,
    "guestPhone" TEXT,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "roomType" TEXT NOT NULL,
    "roomsCount" INTEGER NOT NULL DEFAULT 1,
    "mealPlan" TEXT NOT NULL,
    "specialRequests" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "confirmationStage" TEXT NOT NULL DEFAULT 'PENDING_RESPONSE',
    "paymentStatus" TEXT NOT NULL DEFAULT 'Unpaid',
    "bookingReference" TEXT,
    "contractRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "seasonalPricing" DOUBLE PRECISION,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "profitMargin" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hotelDues" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "holdUntil" TIMESTAMP(3),
    "assignedRoomId" TEXT,
    "assignedRoomNumber" TEXT,
    "adults" INTEGER NOT NULL DEFAULT 2,
    "children" INTEGER NOT NULL DEFAULT 0,
    "guestIdType" TEXT,
    "guestIdNumber" TEXT,
    "guestIdVerified" BOOLEAN NOT NULL DEFAULT false,
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "agentName" TEXT,
    "internalNotes" TEXT,
    "createdById" TEXT,
    "auditLogs" TEXT,
    "secureToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "confirmationDeadline" TIMESTAMP(3),
    "receptionContact" TEXT,
    "receptionEmail" TEXT,
    "receptionPhone" TEXT,
    "hotelConfirmationNumber" TEXT,
    "confirmedRoomType" TEXT,
    "confirmedRoomsCount" INTEGER,
    "confirmedTariff" DOUBLE PRECISION,
    "confirmedTaxes" DOUBLE PRECISION,
    "confirmedMealPlan" TEXT,
    "confirmationVoucherUrl" TEXT,
    "receptionNotes" TEXT,
    "rejectionReason" TEXT,
    "alternativeRoomType" TEXT,
    "alternativeTariff" DOUBLE PRECISION,
    "alternativeDates" TEXT,
    "alternativeNotes" TEXT,
    "clarificationRequest" TEXT,
    "clarificationResponse" TEXT,
    "respondedAt" TIMESTAMP(3),
    "respondedBy" TEXT,
    "lifecycleStatus" TEXT NOT NULL DEFAULT 'NEW',
    "assignedEmployeeName" TEXT,
    "assignedEmployeeCode" TEXT,
    "childrenAges" TEXT,
    "bookingSource" TEXT DEFAULT 'B2B_PORTAL',
    "travelAgent" TEXT,
    "destination" TEXT,
    "bedConfiguration" TEXT,
    "requestedTariff" DOUBLE PRECISION,
    "agreedWholesaleRate" DOUBLE PRECISION,
    "taxGstRate" DOUBLE PRECISION DEFAULT 12.0,
    "extraBedPolicy" TEXT,
    "advanceReceived" DOUBLE PRECISION DEFAULT 0,
    "outstandingAmount" DOUBLE PRECISION DEFAULT 0,
    "guestVoucherDispatched" BOOLEAN NOT NULL DEFAULT false,
    "guestVoucherDispatchedAt" TIMESTAMP(3),
    "voucherApprovedBy" TEXT,
    "voucherApprovedAt" TIMESTAMP(3),
    "idempotencyKey" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HotelReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailDispatchRecord" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "emailType" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'GMAIL_SMTP',
    "messageId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "errorMessage" TEXT,
    "idempotencyKey" TEXT,
    "deliveryMetadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailDispatchRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InboundEmailLog" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT,
    "toEmail" TEXT NOT NULL DEFAULT 'reservations@kashmircurators.com',
    "subject" TEXT NOT NULL,
    "rawBody" TEXT NOT NULL,
    "parsedIntent" TEXT,
    "parsedData" TEXT,
    "aiConfidence" DOUBLE PRECISION,
    "aiModel" TEXT DEFAULT 'gemini-2.5-flash',
    "status" TEXT NOT NULL DEFAULT 'PROCESSED',
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InboundEmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAgentActionLog" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT,
    "actionType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "confidence" DOUBLE PRECISION,
    "triggeredBy" TEXT NOT NULL DEFAULT 'AI_AGENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiAgentActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentProfile" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "agentCode" TEXT NOT NULL,
    "commissionPct" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "plan" TEXT NOT NULL DEFAULT 'STARTER',
    "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "city" TEXT,
    "state" TEXT,
    "website" TEXT,
    "applicationRef" TEXT,
    "organizationId" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AgentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyApplication" (
    "id" TEXT NOT NULL,
    "applicationRef" TEXT NOT NULL,
    "agencyName" TEXT NOT NULL,
    "authorizedPerson" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "websiteOrSocial" TEXT,
    "businessCategory" TEXT NOT NULL DEFAULT 'TOUR_OPERATOR',
    "tourismLicenseNo" TEXT,
    "gstin" TEXT,
    "documentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "adminRemarks" TEXT,
    "selectedPlan" TEXT NOT NULL DEFAULT 'STARTER',
    "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "userId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverProfile" (
    "id" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "vehicleRegNo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 4.8,
    "tripsCompleted" INTEGER NOT NULL DEFAULT 0,
    "earnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attendance" TEXT NOT NULL DEFAULT 'Present',
    "licenseExpiry" TEXT NOT NULL DEFAULT '2027-12-31',
    "policeVerification" TEXT NOT NULL DEFAULT 'Verified',
    "aadhaar" TEXT NOT NULL DEFAULT '0000-0000-0000',
    "experience" INTEGER NOT NULL DEFAULT 3,
    "languages" TEXT NOT NULL DEFAULT 'English, Kashmiri, Urdu',
    "emergencyContact" TEXT NOT NULL DEFAULT '+919876543219',
    "organizationId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomCategory" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 2,
    "maxOccupancy" INTEGER NOT NULL DEFAULT 3,
    "amenities" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotelRoom" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "floor" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "operationalStatus" TEXT NOT NULL DEFAULT 'AVAILABLE_CLEAN',
    "housekeeping" TEXT NOT NULL DEFAULT 'CLEAN',
    "bukhariActive" BOOLEAN NOT NULL DEFAULT false,
    "electricWarmerActive" BOOLEAN NOT NULL DEFAULT false,
    "currentReservationId" TEXT,
    "assignedHousekeeper" TEXT,
    "housekeepingPriority" TEXT DEFAULT 'NORMAL',
    "maintenanceNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HotelRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonalRate" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "seasonName" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "flatRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeasonalRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRequest" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "loggedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorSettlement" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "commissionDues" DOUBLE PRECISION NOT NULL,
    "netPaid" DOUBLE PRECISION NOT NULL,
    "payoutDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "transactionRef" TEXT,
    "bankAccountName" TEXT,
    "bankAccountNumber" TEXT,
    "ifscCode" TEXT,
    "notes" TEXT,
    "bookingIds" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HousekeepingTask" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "taskType" TEXT NOT NULL DEFAULT 'TURNOVER',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'DIRTY',
    "assignedTo" TEXT,
    "notes" TEXT,
    "linenChanged" BOOLEAN NOT NULL DEFAULT true,
    "inspectedBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HousekeepingTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WinterOpsLog" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "bukhariStatus" TEXT NOT NULL DEFAULT 'OPERATIONAL',
    "firewoodStockDays" INTEGER NOT NULL DEFAULT 7,
    "generatorStatus" TEXT NOT NULL DEFAULT 'STANDBY',
    "generatorFuelPct" INTEGER NOT NULL DEFAULT 85,
    "generatorRuntimeHrs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gridPowerStatus" TEXT NOT NULL DEFAULT 'LIVE',
    "boilerHotWater" TEXT NOT NULL DEFAULT 'ACTIVE',
    "snowRoadClearance" TEXT NOT NULL DEFAULT 'CLEAR',
    "shikaraGhatStatus" TEXT DEFAULT 'OPEN',
    "notes" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WinterOpsLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotelReview" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "comment" TEXT NOT NULL,
    "sentiment" TEXT NOT NULL DEFAULT 'POSITIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HotelReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisruptionImpact" (
    "id" TEXT NOT NULL,
    "advisoryId" TEXT NOT NULL,
    "bookingId" TEXT,
    "inquiryId" TEXT,
    "affectedDestination" TEXT NOT NULL,
    "affectedDateFrom" TIMESTAMP(3),
    "affectedDateTo" TIMESTAMP(3),
    "impactLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "suggestedAlternative" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DETECTED',
    "resolutionType" TEXT,
    "customerNotified" BOOLEAN NOT NULL DEFAULT false,
    "agentNotified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisruptionImpact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingProtectionPolicy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "feePercentage" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "freeRescheduleDays" INTEGER NOT NULL DEFAULT 30,
    "cancellationRefundPct" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "disruptionAutoCredit" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingProtectionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorListing" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "images" TEXT NOT NULL,
    "amenitiesOrFeatures" TEXT NOT NULL,
    "inventoryCount" INTEGER NOT NULL DEFAULT 1,
    "blackoutDates" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "kycDocuments" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "payoutUpiOrBank" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "referenceId" TEXT,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripSafetyCard" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "inquiryId" TEXT,
    "shareToken" TEXT NOT NULL,
    "passengerName" TEXT NOT NULL,
    "passengerPhone" TEXT NOT NULL,
    "travelerCount" INTEGER NOT NULL DEFAULT 1,
    "assignedDriver" TEXT,
    "assignedHotelSos" TEXT,
    "emergencyContacts" TEXT,
    "bloodGroup" TEXT,
    "medicalNotes" TEXT,
    "safetyStatus" TEXT NOT NULL DEFAULT 'SAFE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripSafetyCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalAccessKey" (
    "id" TEXT NOT NULL,
    "portalType" TEXT NOT NULL,
    "accessKey" TEXT NOT NULL,
    "assignedName" TEXT NOT NULL,
    "assignedContact" TEXT,
    "designation" TEXT,
    "propertyScope" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdByName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortalAccessKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeAttendance" (
    "id" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "firstLoginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogoutAt" TIMESTAMP(3),
    "totalWorkMinutes" INTEGER NOT NULL DEFAULT 0,
    "totalBreakMinutes" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "shiftName" TEXT NOT NULL DEFAULT 'General Operations (09:00 - 18:00)',
    "ipAddress" TEXT,
    "deviceInfo" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeSession" (
    "id" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "portalType" TEXT NOT NULL DEFAULT 'HOSPITALITY',
    "loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logoutAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isOnBreak" BOOLEAN NOT NULL DEFAULT false,
    "breakStartAt" TIMESTAMP(3),
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "assignedDesk" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSearchIntent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "searchType" TEXT NOT NULL DEFAULT 'HOTEL',
    "destination" TEXT,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "guestsCount" INTEGER DEFAULT 2,
    "roomsCount" INTEGER DEFAULT 1,
    "budgetTier" TEXT,
    "searchedEntity" TEXT,
    "metadata" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SEARCHED',
    "nudgeSentAt" TIMESTAMP(3),
    "nudgeChannel" TEXT,
    "inquiryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSearchIntent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_type_idx" ON "Organization"("type");

-- CreateIndex
CREATE INDEX "Organization_status_idx" ON "Organization"("status");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeCode_key" ON "User"("employeeCode");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "Hotel_organizationId_idx" ON "Hotel"("organizationId");

-- CreateIndex
CREATE INDEX "Cab_organizationId_idx" ON "Cab"("organizationId");

-- CreateIndex
CREATE INDEX "Booking_organizationId_idx" ON "Booking"("organizationId");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_createdAt_idx" ON "Booking"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Inquiry_leadId_key" ON "Inquiry"("leadId");

-- CreateIndex
CREATE INDEX "Inquiry_organizationId_idx" ON "Inquiry"("organizationId");

-- CreateIndex
CREATE INDEX "Inquiry_phone_idx" ON "Inquiry"("phone");

-- CreateIndex
CREATE INDEX "Inquiry_email_idx" ON "Inquiry"("email");

-- CreateIndex
CREATE INDEX "Inquiry_leadStage_idx" ON "Inquiry"("leadStage");

-- CreateIndex
CREATE INDEX "Inquiry_assignedTo_idx" ON "Inquiry"("assignedTo");

-- CreateIndex
CREATE INDEX "Inquiry_createdAt_idx" ON "Inquiry"("createdAt");

-- CreateIndex
CREATE INDEX "LeadActivity_inquiryId_idx" ON "LeadActivity"("inquiryId");

-- CreateIndex
CREATE INDEX "LeadActivity_createdAt_idx" ON "LeadActivity"("createdAt");

-- CreateIndex
CREATE INDEX "LeadNote_inquiryId_idx" ON "LeadNote"("inquiryId");

-- CreateIndex
CREATE INDEX "FollowUpReminder_inquiryId_idx" ON "FollowUpReminder"("inquiryId");

-- CreateIndex
CREATE INDEX "FollowUpReminder_assignedTo_status_idx" ON "FollowUpReminder"("assignedTo", "status");

-- CreateIndex
CREATE INDEX "FollowUpReminder_dueDate_idx" ON "FollowUpReminder"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppMessage_metaMessageId_key" ON "WhatsAppMessage"("metaMessageId");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_customerPhone_idx" ON "WhatsAppMessage"("customerPhone");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_inquiryId_idx" ON "WhatsAppMessage"("inquiryId");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_createdAt_idx" ON "WhatsAppMessage"("createdAt");

-- CreateIndex
CREATE INDEX "InquiryDocument_inquiryId_idx" ON "InquiryDocument"("inquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "CabReservation_voucherReference_key" ON "CabReservation"("voucherReference");

-- CreateIndex
CREATE INDEX "CabReservation_inquiryId_idx" ON "CabReservation"("inquiryId");

-- CreateIndex
CREATE INDEX "CabReservation_cabId_idx" ON "CabReservation"("cabId");

-- CreateIndex
CREATE INDEX "CabReservation_status_idx" ON "CabReservation"("status");

-- CreateIndex
CREATE INDEX "CabReservation_startDate_endDate_idx" ON "CabReservation"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionLedger_paymentId_key" ON "TransactionLedger"("paymentId");

-- CreateIndex
CREATE INDEX "TransactionLedger_bookingId_idx" ON "TransactionLedger"("bookingId");

-- CreateIndex
CREATE INDEX "TransactionLedger_createdAt_idx" ON "TransactionLedger"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonalCampaign_slug_key" ON "SeasonalCampaign"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "SiteContent_sectionKey_key" ON "SiteContent"("sectionKey");

-- CreateIndex
CREATE UNIQUE INDEX "HotelReservation_secureToken_key" ON "HotelReservation"("secureToken");

-- CreateIndex
CREATE UNIQUE INDEX "HotelReservation_idempotencyKey_key" ON "HotelReservation"("idempotencyKey");

-- CreateIndex
CREATE INDEX "HotelReservation_organizationId_idx" ON "HotelReservation"("organizationId");

-- CreateIndex
CREATE INDEX "HotelReservation_hotelId_idx" ON "HotelReservation"("hotelId");

-- CreateIndex
CREATE INDEX "HotelReservation_inquiryId_idx" ON "HotelReservation"("inquiryId");

-- CreateIndex
CREATE INDEX "HotelReservation_status_idx" ON "HotelReservation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EmailDispatchRecord_idempotencyKey_key" ON "EmailDispatchRecord"("idempotencyKey");

-- CreateIndex
CREATE INDEX "EmailDispatchRecord_reservationId_idx" ON "EmailDispatchRecord"("reservationId");

-- CreateIndex
CREATE INDEX "EmailDispatchRecord_status_idx" ON "EmailDispatchRecord"("status");

-- CreateIndex
CREATE INDEX "EmailDispatchRecord_recipientEmail_idx" ON "EmailDispatchRecord"("recipientEmail");

-- CreateIndex
CREATE INDEX "InboundEmailLog_reservationId_idx" ON "InboundEmailLog"("reservationId");

-- CreateIndex
CREATE INDEX "InboundEmailLog_fromEmail_idx" ON "InboundEmailLog"("fromEmail");

-- CreateIndex
CREATE INDEX "InboundEmailLog_status_idx" ON "InboundEmailLog"("status");

-- CreateIndex
CREATE INDEX "AiAgentActionLog_reservationId_idx" ON "AiAgentActionLog"("reservationId");

-- CreateIndex
CREATE INDEX "AiAgentActionLog_actionType_idx" ON "AiAgentActionLog"("actionType");

-- CreateIndex
CREATE UNIQUE INDEX "AgentProfile_agentCode_key" ON "AgentProfile"("agentCode");

-- CreateIndex
CREATE UNIQUE INDEX "AgentProfile_userId_key" ON "AgentProfile"("userId");

-- CreateIndex
CREATE INDEX "AgentProfile_organizationId_idx" ON "AgentProfile"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "AgencyApplication_applicationRef_key" ON "AgencyApplication"("applicationRef");

-- CreateIndex
CREATE INDEX "AgencyApplication_email_idx" ON "AgencyApplication"("email");

-- CreateIndex
CREATE INDEX "AgencyApplication_phone_idx" ON "AgencyApplication"("phone");

-- CreateIndex
CREATE INDEX "AgencyApplication_applicationRef_idx" ON "AgencyApplication"("applicationRef");

-- CreateIndex
CREATE INDEX "AgencyApplication_status_idx" ON "AgencyApplication"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DriverProfile_userId_key" ON "DriverProfile"("userId");

-- CreateIndex
CREATE INDEX "DriverProfile_organizationId_idx" ON "DriverProfile"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_userId_key" ON "Supplier"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "HotelRoom_hotelId_status_idx" ON "HotelRoom"("hotelId", "status");

-- CreateIndex
CREATE INDEX "HotelRoom_currentReservationId_idx" ON "HotelRoom"("currentReservationId");

-- CreateIndex
CREATE INDEX "VendorSettlement_hotelId_status_idx" ON "VendorSettlement"("hotelId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BookingProtectionPolicy_code_key" ON "BookingProtectionPolicy"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TripSafetyCard_bookingId_key" ON "TripSafetyCard"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "TripSafetyCard_inquiryId_key" ON "TripSafetyCard"("inquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "TripSafetyCard_shareToken_key" ON "TripSafetyCard"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "PortalAccessKey_accessKey_key" ON "PortalAccessKey"("accessKey");

-- CreateIndex
CREATE INDEX "PortalAccessKey_accessKey_idx" ON "PortalAccessKey"("accessKey");

-- CreateIndex
CREATE INDEX "PortalAccessKey_portalType_idx" ON "PortalAccessKey"("portalType");

-- CreateIndex
CREATE INDEX "PortalAccessKey_status_idx" ON "PortalAccessKey"("status");

-- CreateIndex
CREATE INDEX "EmployeeAttendance_employeeCode_idx" ON "EmployeeAttendance"("employeeCode");

-- CreateIndex
CREATE INDEX "EmployeeAttendance_date_idx" ON "EmployeeAttendance"("date");

-- CreateIndex
CREATE INDEX "EmployeeAttendance_status_idx" ON "EmployeeAttendance"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeAttendance_employeeCode_date_key" ON "EmployeeAttendance"("employeeCode", "date");

-- CreateIndex
CREATE INDEX "EmployeeSession_employeeCode_idx" ON "EmployeeSession"("employeeCode");

-- CreateIndex
CREATE INDEX "EmployeeSession_isActive_idx" ON "EmployeeSession"("isActive");

-- CreateIndex
CREATE INDEX "EmployeeSession_portalType_idx" ON "EmployeeSession"("portalType");

-- CreateIndex
CREATE INDEX "CustomerSearchIntent_customerPhone_idx" ON "CustomerSearchIntent"("customerPhone");

-- CreateIndex
CREATE INDEX "CustomerSearchIntent_customerEmail_idx" ON "CustomerSearchIntent"("customerEmail");

-- CreateIndex
CREATE INDEX "CustomerSearchIntent_status_idx" ON "CustomerSearchIntent"("status");

-- CreateIndex
CREATE INDEX "CustomerSearchIntent_createdAt_idx" ON "CustomerSearchIntent"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hotel" ADD CONSTRAINT "Hotel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cab" ADD CONSTRAINT "Cab_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpReminder" ADD CONSTRAINT "FollowUpReminder_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryDocument" ADD CONSTRAINT "InquiryDocument_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CabReservation" ADD CONSTRAINT "CabReservation_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CabReservation" ADD CONSTRAINT "CabReservation_cabId_fkey" FOREIGN KEY ("cabId") REFERENCES "Cab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelReservation" ADD CONSTRAINT "HotelReservation_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelReservation" ADD CONSTRAINT "HotelReservation_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelReservation" ADD CONSTRAINT "HotelReservation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelReservation" ADD CONSTRAINT "HotelReservation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDispatchRecord" ADD CONSTRAINT "EmailDispatchRecord_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "HotelReservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundEmailLog" ADD CONSTRAINT "InboundEmailLog_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "HotelReservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAgentActionLog" ADD CONSTRAINT "AiAgentActionLog_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "HotelReservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentProfile" ADD CONSTRAINT "AgentProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentProfile" ADD CONSTRAINT "AgentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverProfile" ADD CONSTRAINT "DriverProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverProfile" ADD CONSTRAINT "DriverProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomCategory" ADD CONSTRAINT "RoomCategory_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelRoom" ADD CONSTRAINT "HotelRoom_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelRoom" ADD CONSTRAINT "HotelRoom_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "RoomCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonalRate" ADD CONSTRAINT "SeasonalRate_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "RoomCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorSettlement" ADD CONSTRAINT "VendorSettlement_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HousekeepingTask" ADD CONSTRAINT "HousekeepingTask_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WinterOpsLog" ADD CONSTRAINT "WinterOpsLog_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelReview" ADD CONSTRAINT "HotelReview_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisruptionImpact" ADD CONSTRAINT "DisruptionImpact_advisoryId_fkey" FOREIGN KEY ("advisoryId") REFERENCES "TravelAdvisory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSearchIntent" ADD CONSTRAINT "CustomerSearchIntent_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

