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
  securityPin: string; // 4-char security PIN e.g. "KC-77"
  arrivalTelemetry: ArrivalTelemetry;
  stage: TripStage;
  nextTurnInstruction?: string;
}

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
}

export interface DriverEarnings {
  todayTotal: number;
  tripsCount: number;
  onlineHours: string;
  acceptanceRate: number;
  upiId: string;
}

export interface HighwayAdvisory {
  location: string;
  status: string;
  message: string;
  snowChainsMandatory: boolean;
  tempC?: number;
  lastUpdated?: string;
}
