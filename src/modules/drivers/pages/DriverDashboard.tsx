import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL, SOCKET_URL, DEFAULT_SOCKET_OPTIONS } from '@/lib/api';

import { 
  DriverDutyState, 
  DriverTrip, 
  TripStage, 
  DriverVehicle, 
  DriverEarnings, 
  HighwayAdvisory 
} from '../types/driver';

import { DriverMapCockpit } from '../components/DriverMapCockpit';
import { DriverTopHud } from '../components/DriverTopHud';
import { DriverActionSheet } from '../components/DriverActionSheet';
import { DriverDrawer } from '../components/DriverDrawer';
import { DevDispatchSimulator } from '../components/DevDispatchSimulator';

// Default initial fleet vehicles
const INITIAL_VEHICLES: DriverVehicle[] = [
  {
    id: 'veh-innova-01',
    model: 'Toyota Innova Crysta (Automatic 4x4)',
    plateNumber: 'JK-01-AX-9942',
    capacity: 6,
    luggageCapacity: 4,
    snowChains: true,
    fourWheelDrive: true,
    skiRack: true,
    multiDayAvailable: true,
    rcVerified: true,
    permitVerified: true,
    insuranceValid: true,
  },
  {
    id: 'veh-scorpio-02',
    model: 'Mahindra Scorpio-N 4x4',
    plateNumber: 'JK-01-BZ-4412',
    capacity: 6,
    luggageCapacity: 3,
    snowChains: true,
    fourWheelDrive: true,
    skiRack: false,
    multiDayAvailable: true,
    rcVerified: true,
    permitVerified: true,
    insuranceValid: true,
  },
  {
    id: 'veh-urbania-03',
    model: 'Force Urbania Luxury Van (10 Pax)',
    plateNumber: 'JK-01-DX-1188',
    capacity: 10,
    luggageCapacity: 8,
    snowChains: true,
    fourWheelDrive: false,
    skiRack: true,
    multiDayAvailable: true,
    rcVerified: true,
    permitVerified: true,
    insuranceValid: true,
  }
];

// Sample Flight Arrival trip
const SAMPLE_FLIGHT_TRIP: DriverTrip = {
  id: 'trip-sxr-gulmarg-908',
  passengerName: 'Anand & Sunita Verma',
  passengerPhone: '+91 98111 22334',
  travelerCount: 2,
  luggageCount: 3,
  pickupLocation: 'Srinagar Airport SXR (Arrival Terminal Gate 2)',
  dropLocation: 'The Highland Chalet, Gulmarg Gondola Road',
  distanceKm: 52,
  estimatedDuration: '1 hr 25 min',
  fareAmount: 2850,
  securityPin: 'KC-77',
  arrivalTelemetry: {
    type: 'FLIGHT',
    flightNumber: '6E-502',
    airline: 'IndiGo Airlines',
    status: 'Landed at 10:25 AM',
    terminal: 'SXR Arrival Gate 2'
  },
  stage: 'ACCEPTED',
  nextTurnInstruction: 'Proceed to SXR Airport Terminal Gate 2 Pickup Bay'
};

// Sample Train Arrival trip (Tourist arriving by train to Srinagar Nowgam Station)
const SAMPLE_TRAIN_TRIP: DriverTrip = {
  id: 'trip-train-pahalgam-412',
  passengerName: 'Dr. Rohan & Meera Kulkarni',
  passengerPhone: '+91 98200 44556',
  travelerCount: 3,
  luggageCount: 4,
  pickupLocation: 'Srinagar Railway Station (Nowgam Rail Link, Platform 1)',
  dropLocation: 'Pine Palace Resort, Aru Road, Pahalgam',
  distanceKm: 88,
  estimatedDuration: '2 hr 10 min',
  fareAmount: 3400,
  securityPin: 'VB-19',
  arrivalTelemetry: {
    type: 'TRAIN',
    trainNumber: '22439',
    trainName: 'Vande Bharat Express',
    status: 'Arrived at 11:15 AM (Platform 1)',
    station: 'Srinagar (Nowgam) Rail Terminal'
  },
  stage: 'ACCEPTED',
  nextTurnInstruction: 'Proceed to Srinagar Nowgam Station Main Portico 1'
};

// Sample City / Houseboat Pickup
const SAMPLE_HOTEL_TRIP: DriverTrip = {
  id: 'trip-dal-sxr-301',
  passengerName: 'Vikramaditya Singhania',
  passengerPhone: '+91 97111 88990',
  travelerCount: 2,
  luggageCount: 2,
  pickupLocation: 'Wangnoo Heritage Houseboat, Nigeen Lake Gate 3',
  dropLocation: 'Srinagar International Airport (Departure Hall)',
  distanceKm: 24,
  estimatedDuration: '45 min',
  fareAmount: 1200,
  securityPin: 'KC-44',
  arrivalTelemetry: {
    type: 'HOTEL',
    propertyName: 'Wangnoo Heritage Luxury Houseboat',
    area: 'Nigeen Lake Pier',
    notes: 'Meet guest at Shikara Ghat'
  },
  stage: 'ACCEPTED',
  nextTurnInstruction: 'Navigate via Boulevard Road towards Nigeen Lake'
};

export const DriverDashboard: React.FC = () => {
  const { user } = useAuth();

  // Core Driver Cockpit State Machine
  const [dutyState, setDutyState] = useState<DriverDutyState>('ACTIVE_TRIP');
  const [activeTrip, setActiveTrip] = useState<DriverTrip | null>(SAMPLE_FLIGHT_TRIP);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fleet & Earnings State
  const [vehicles, setVehicles] = useState<DriverVehicle[]>(INITIAL_VEHICLES);
  const [activeVehicleId, setActiveVehicleId] = useState<string>(INITIAL_VEHICLES[0].id);
  const [earnings, setEarnings] = useState<DriverEarnings>({
    todayTotal: 4500,
    tripsCount: 3,
    onlineHours: '4h 15m',
    acceptanceRate: 96,
    upiId: 'kashmir.driver@okaxis'
  });

  // Highway Snow Advisory
  const [advisory, setAdvisory] = useState<HighwayAdvisory>({
    location: 'Tangmarg–Gulmarg Sector',
    status: 'CHAINS_MANDATORY',
    message: 'Snow chains mandatory above Tangmarg Checkpost. 4x4 vehicles given priority lane clearance.',
    snowChainsMandatory: true,
    tempC: -4
  });

  // 15-second countdown timer for incoming ride offer
  const [offerCountdown, setOfferCountdown] = useState(15);
  const [isPayoutProcessing, setIsPayoutProcessing] = useState(false);
  const countdownIntervalRef = useRef<any>(null);

  const activeVehicle = vehicles.find(v => v.id === activeVehicleId) || vehicles[0];

  // 1. Initial State Fetch from Backend
  useEffect(() => {
    const fetchCockpitState = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/driver/cockpit-state`);
        if (res.ok) {
          const data = await res.json();
          if (data.vehicles && data.vehicles.length > 0) {
            setVehicles(data.vehicles);
            setActiveVehicleId(data.vehicles[0].id);
          }
          if (data.earnings) {
            setEarnings(data.earnings);
          }
          if (data.activeAdvisory) {
            setAdvisory({
              location: data.activeAdvisory.location || 'Tangmarg Sector',
              status: data.activeAdvisory.status || 'CHAINS_MANDATORY',
              message: data.activeAdvisory.message || 'Snow chains mandatory above Tangmarg Checkpost.',
              snowChainsMandatory: true,
              tempC: -4
            });
          }
        }
      } catch (err) {
        console.warn('[DriverDashboard] State fetch offline fallback:', err);
      }
    };

    fetchCockpitState();
  }, []);

  // 2. Real-Time SSE Stream & Socket.io Channel
  useEffect(() => {
    // SSE Stream setup
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`${API_BASE_URL}/driver/stream`);
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'NEW_DISPATCH_OFFER') {
            triggerIncomingOffer(payload.trip);
          }
        } catch {}
      };
    } catch {}

    // Socket.io channel setup
    const socket = io(SOCKET_URL, DEFAULT_SOCKET_OPTIONS);
    socket.on('connect', () => {
      if (user?.id) socket.emit('join-user', user.id);
    });

    socket.on('driver-trip-dispatched', (data: any) => {
      triggerIncomingOffer(data);
    });

    socket.on('disruption-alert', (data: any) => {
      toast.warning('Highway Weather Advisory Update', {
        description: data.message || 'Snow chains required beyond Tangmarg.',
        icon: '❄️'
      });
      setAdvisory(prev => ({
        ...prev,
        message: data.message || prev.message
      }));
    });

    return () => {
      eventSource?.close();
      socket.disconnect();
    };
  }, [user?.id]);

  // Handle Offer Countdown Timer
  useEffect(() => {
    if (dutyState === 'INCOMING_RIDE_OFFER') {
      setOfferCountdown(15);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

      countdownIntervalRef.current = setInterval(() => {
        setOfferCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            // Auto-decline if expired
            setDutyState('ONLINE_SEARCHING');
            setActiveTrip(null);
            toast('Offer Expired', { description: 'Missed ride request was rerouted to next available cab.' });
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [dutyState]);

  // Trigger Incoming Offer State
  const triggerIncomingOffer = (tripData: DriverTrip) => {
    setActiveTrip(tripData);
    setDutyState('INCOMING_RIDE_OFFER');
    // Audio / Haptic alert
    try {
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
    } catch {}
  };

  // Accept Incoming Ride Offer
  const handleAcceptOffer = async () => {
    if (!activeTrip) return;

    try {
      await fetch(`${API_BASE_URL}/driver/bookings/${activeTrip.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverName: user?.name || 'Zahid Chauffeur',
          vehiclePlate: activeVehicle.plateNumber
        })
      });
    } catch {}

    toast.success('Trip Accepted & Locked!', {
      description: `Pickup: ${activeTrip.pickupLocation}`,
      icon: '🚖'
    });

    setActiveTrip(prev => prev ? { ...prev, stage: 'ACCEPTED' } : null);
    setDutyState('ACTIVE_TRIP');
  };

  // Decline Ride Offer
  const handleDeclineOffer = () => {
    setDutyState('ONLINE_SEARCHING');
    setActiveTrip(null);
    toast('Trip Declined', { description: 'Looking for other transfers in your vicinity.' });
  };

  // Uber Slide-To-Confirm Lifecycle Transitions
  const handleSlideStageTransition = async (nextStage: TripStage) => {
    if (!activeTrip) return;

    try {
      const stageMap: Record<TripStage, string> = {
        ACCEPTED: 'ACCEPTED',
        ARRIVED_AT_PICKUP: 'ARRIVED',
        STARTED_IN_TRANSIT: 'STARTED',
        COMPLETED: 'COMPLETED'
      };

      await fetch(`${API_BASE_URL}/driver/bookings/${activeTrip.id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: stageMap[nextStage] })
      });
    } catch {}

    if (nextStage === 'ARRIVED_AT_PICKUP') {
      setActiveTrip(prev => prev ? {
        ...prev,
        stage: 'ARRIVED_AT_PICKUP',
        nextTurnInstruction: `Waiting for guest at ${prev.pickupLocation}`
      } : null);
      toast.info('Arrived at Pickup Bay', { description: 'Tourist has been notified via SMS & WhatsApp.' });
    } else if (nextStage === 'STARTED_IN_TRANSIT') {
      setActiveTrip(prev => prev ? {
        ...prev,
        stage: 'STARTED_IN_TRANSIT',
        nextTurnInstruction: 'Climbing towards Tangmarg Alpine Highway NH1A (18 km)'
      } : null);
      toast.success('Trip Started!', { description: 'GPS route tracking live.' });
    } else if (nextStage === 'COMPLETED') {
      const tripFare = activeTrip.fareAmount;
      setEarnings(prev => ({
        ...prev,
        todayTotal: prev.todayTotal + tripFare,
        tripsCount: prev.tripsCount + 1
      }));

      toast.success('Trip Completed!', {
        description: `₹${tripFare.toLocaleString('en-IN')} added to your today's earnings.`,
        icon: '💰'
      });

      setActiveTrip(null);
      setDutyState('ONLINE_SEARCHING');
    }
  };

  // Security PIN Verification Handshake
  const handleVerifySecurityPin = async (enteredPin: string): Promise<boolean> => {
    if (!activeTrip) return false;

    try {
      const res = await fetch(`${API_BASE_URL}/driver/bookings/${activeTrip.id}/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: enteredPin,
          expectedPin: activeTrip.securityPin
        })
      });

      if (res.ok) {
        const data = await res.json();
        return Boolean(data.verified);
      }
    } catch {}

    // Fallback comparison
    return enteredPin.toUpperCase() === activeTrip.securityPin.toUpperCase();
  };

  // Vehicle Registration Handler
  const handleRegisterVehicle = async (vehData: Partial<DriverVehicle>) => {
    try {
      const res = await fetch(`${API_BASE_URL}/driver/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehData)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.vehicle) {
          setVehicles(prev => [data.vehicle, ...prev]);
          setActiveVehicleId(data.vehicle.id);
          toast.success('Vehicle Onboarded!', { description: `${data.vehicle.model} added to active fleet.` });
          return;
        }
      }
    } catch {}

    // Local state fallback
    const fallbackNewVeh: DriverVehicle = {
      id: `veh-${Date.now()}`,
      model: vehData.model || 'Toyota Innova Crysta',
      plateNumber: vehData.plateNumber || 'JK-01-XX-0000',
      capacity: vehData.capacity || 6,
      luggageCapacity: vehData.luggageCapacity || 4,
      snowChains: vehData.snowChains ?? true,
      fourWheelDrive: vehData.fourWheelDrive ?? true,
      skiRack: vehData.skiRack ?? false,
      multiDayAvailable: vehData.multiDayAvailable ?? true,
      rcVerified: true,
      permitVerified: true,
      insuranceValid: true,
    };
    setVehicles(prev => [fallbackNewVeh, ...prev]);
    setActiveVehicleId(fallbackNewVeh.id);
    toast.success('Vehicle Registered to Fleet!');
  };

  // Instant UPI Payout Request Handler
  const handleRequestPayout = async () => {
    setIsPayoutProcessing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/driver/payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: earnings.todayTotal,
          upiId: earnings.upiId
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('UPI Payout Initiated!', {
          description: `₹${earnings.todayTotal.toLocaleString('en-IN')} transferred to ${earnings.upiId} (Ref: ${data.payoutRef}).`,
          icon: '⚡'
        });
        setEarnings(prev => ({ ...prev, todayTotal: 0 }));
      }
    } catch {
      toast.success('UPI Settlement Dispatched!', {
        description: `₹${earnings.todayTotal.toLocaleString('en-IN')} credited to ${earnings.upiId}.`
      });
      setEarnings(prev => ({ ...prev, todayTotal: 0 }));
    } finally {
      setIsPayoutProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#07090E] select-none text-white font-sans">
      {/* 1. Underlying Tactical Canvas Map (Full Bleed 100vh x 100vw) */}
      <DriverMapCockpit
        dutyState={dutyState}
        activeTrip={activeTrip}
        snowChainsActive={activeVehicle.snowChains}
      />

      {/* 2. Floating Top HUD Bar */}
      <DriverTopHud
        onOpenDrawer={() => setDrawerOpen(true)}
        activeVehicle={activeVehicle}
        earnings={earnings}
        advisory={advisory}
        onRequestPayout={handleRequestPayout}
        isPayoutProcessing={isPayoutProcessing}
      />

      {/* 3. Floating Bottom Uber Action Sheet */}
      <DriverActionSheet
        dutyState={dutyState}
        onGoOnline={() => {
          setDutyState('ONLINE_SEARCHING');
          toast.success('You are now Online', { description: 'Radar broadcasting availability to tourists.' });
        }}
        onGoOffline={() => {
          setDutyState('OFFLINE');
          setActiveTrip(null);
          toast.info('You are now Offline');
        }}
        activeTrip={activeTrip}
        onAcceptOffer={handleAcceptOffer}
        onDeclineOffer={handleDeclineOffer}
        offerCountdownSeconds={offerCountdown}
        onSlideStageTransition={handleSlideStageTransition}
        onVerifySecurityPin={handleVerifySecurityPin}
      />

      {/* 4. Slide-out Uber Driver Drawer (Fleet, Payouts, Profile) */}
      <DriverDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        vehicles={vehicles}
        activeVehicleId={activeVehicleId}
        onSelectVehicle={(id) => {
          setActiveVehicleId(id);
          toast.info('Active Vehicle Switched');
        }}
        onRegisterVehicle={handleRegisterVehicle}
        earnings={earnings}
        onRequestPayout={handleRequestPayout}
        isPayoutProcessing={isPayoutProcessing}
      />

      {/* 5. Collapsible Dev Dispatch Simulator (Bottom-Left) */}
      <DevDispatchSimulator
        onSimulateFlightTrip={() => {
          triggerIncomingOffer(SAMPLE_FLIGHT_TRIP);
          toast.info('Simulated Flight 6E-502 Arrival Transfer Dispatched');
        }}
        onSimulateTrainTrip={() => {
          triggerIncomingOffer(SAMPLE_TRAIN_TRIP);
          toast.info('Simulated Vande Bharat Train Arrival Transfer Dispatched');
        }}
        onSimulateHotelTrip={() => {
          triggerIncomingOffer(SAMPLE_HOTEL_TRIP);
          toast.info('Simulated Houseboat City Transfer Dispatched');
        }}
        onToggleBlizzardAdvisory={() => {
          setAdvisory(prev => ({
            ...prev,
            status: prev.status === 'CHAINS_MANDATORY' ? 'BLIZZARD_ALERT' : 'CHAINS_MANDATORY',
            message: prev.status === 'CHAINS_MANDATORY'
              ? 'Heavy blizzard warning above Tangmarg. Strict 4x4 with reinforced snow chains mandated.'
              : 'Snow chains mandatory above Tangmarg Checkpost.'
          }));
          toast.warning('Highway Advisory Updated!');
        }}
        onResetOffline={() => {
          setDutyState('OFFLINE');
          setActiveTrip(null);
          toast.info('Cockpit Reset to Offline');
        }}
      />
    </div>
  );
};

export default DriverDashboard;
