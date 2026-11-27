export type DriverDutyState = 'OFFLINE' | 'ONLINE_SEARCHING' | 'INCOMING_RIDE_OFFER' | 'ACTIVE_TRIP';

export type TripStage = 'ACCEPTED' | 'ARRIVED_AT_PICKUP' | 'STARTED_IN_TRANSIT' | 'COMPLETED';

export type ArrivalType = 'FLIGHT' | 'TRAIN' | 'HOTEL';

export interface FlightTelemetry {
  type: 'FLIGHT';
  flightNumber: string; // e.g. "6E-502"
  airline: string; // e.g. "IndiGo"
  status: string; // e.g. "Landed at 10:25 AM"
  terminal: string; // e.g. "SXR Gate 2"
}

export interface TrainTelemetry {
  type: 'TRAIN';
  trainNumber: string; // e.g. "22439"
  trainName: string; // e.g. "Vande Bharat Express"
  status: string; // e.g. "Arrived on Platform 1"
  station: string; // e.g. "Srinagar (Nowgam) Terminal"
}

export interface HotelTelemetry {
  type: 'HOTEL';
  propertyName: string; // e.g. "Wangnoo Heritage Houseboat"
  area: string; // e.g. "Nigeen Lake / Dal Gate"
  notes?: string;
}

export type ArrivalTelemetry = FlightTelemetry | TrainTelemetry | HotelTelemetry;

export interface DriverTrip {
  id: string;
  passengerName: string;
  passengerPhone: string;
  travelerCount: number;
  luggageCount: number;
  pickupLocation: string;
  dropLocation: string;
  distanceKm: number;
  estimatedDuration: string;
  fareAmount: number;
  counterOfferAmount?: number;
  counterOfferReason?: string;
  securityPin: string; // 4-char security PIN e.g. "KC-77"
  arrivalTelemetry: ArrivalTelemetry;
  stage: TripStage;
  nextTurnInstruction?: string;
}

export type VehicleVerificationStatus = 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED';

export interface DriverVehicle {
  id: string;
  model: string;
  plateNumber: string;
  capacity: number;
  luggageCapacity: number;
  snowChains: boolean;
  fourWheelDrive: boolean;
  skiRack: boolean;
  multiDayAvailable: boolean;
  rcVerified: boolean;
  permitVerified: boolean;
  insuranceValid: boolean;
  unionVerified?: boolean;
  verificationStatus?: VehicleVerificationStatus;
  rejectionReason?: string;
  unionName?: string;
  unionBadgeNumber?: string;
  touristPermitNo?: string;
  permitExpiry?: string;
  commercialRcNumber?: string;
  psvBadgeNo?: string;
  fitnessExpiry?: string;
  submittedAt?: string;
  documents?: {
    rcDocUrl?: string;
    unionCardUrl?: string;
    permitDocUrl?: string;
  };
  rateCard?: DriverRateCard;
}

export interface DriverRateCard {
  airportTransfer: number; // e.g. 1200
  railwayTransfer: number; // e.g. 1400
  gulmargTransfer: number; // e.g. 2800
  pahalgamTransfer: number; // e.g. 3400
  sonamargTransfer: number; // e.g. 3800
  doodhpathriTransfer: number; // e.g. 2400
  localSightseeing: number; // e.g. 2200
  snowChainSurcharge: number; // e.g. 1000
  snowChainActive: boolean;
  heaterSurcharge: number; // e.g. 300
  heaterActive: boolean;
  nightSurcharge: number; // e.g. 500
}

export interface DriverEarnings {
  todayTotal: number;
  tripsCount: number;
  onlineHours: string;
  acceptanceRate: number;
  upiId: string;
  availableBalance?: number;
  lifetimeTotal?: number;
  lifetimeTrips?: number;
}

export interface HighwayAdvisory {
  id?: string;
  location: string;
  status: string;
  message: string;
  snowChainsMandatory: boolean;
  tempC?: number;
  lastUpdated?: string;
}

export type DriverApprovalStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface DriverProfileData {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string | null;
  employeeCode?: string | null;
  licenseNumber: string;
  vehicleRegNo: string;
  status: 'AVAILABLE' | 'ON_TRIP' | 'BUSY' | 'OFFLINE';
  approvalStatus: DriverApprovalStatus;
  rejectionReason?: string | null;
  rating: number;
  tripsCompleted: number;
  earnings: number;
  availableBalance: number;
  acceptanceRate: number;
  attendance: string;
  licenseExpiry: string;
  policeVerification: string;
  experience: number;
  languages: string;
  emergencyContact: string;
  psvBadgeNumber?: string | null;
  unionName?: string | null;
  unionBadgeNumber?: string | null;
  upiId: string;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  bankIfsc?: string | null;
  activeVehicleId?: string | null;
  currentLat?: number | null;
  currentLng?: number | null;
  currentSector?: string | null;
  kycDocuments?: Record<string, string>;
}

export interface DriverPayoutRecord {
  id: string;
  payoutRef: string;
  amount: number;
  upiId: string;
  status: string;
  notes?: string | null;
  processedAt: string;
}

export interface OpenRideRequest {
  reservationId: string;
  offerId?: string | null;
  offerStatus?: string;
  voucherReference?: string | null;
  pickupLocation: string;
  dropLocation: string;
  distanceKm: number;
  estimatedDuration: string;
  fareAmount: number;
  touristCounter?: number | null;
  passengerName: string;
  passengerPhone?: string | null;
  travelerCount: number;
  luggageCount: number;
  securityPin: string;
  arrivalTelemetry: ArrivalTelemetry;
}
