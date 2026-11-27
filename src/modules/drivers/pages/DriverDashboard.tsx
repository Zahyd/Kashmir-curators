import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { API_BASE_URL, SOCKET_URL, DEFAULT_SOCKET_OPTIONS } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { DriverMapCockpit } from '../components/DriverMapCockpit';
import { DriverTopHud } from '../components/DriverTopHud';
import { DriverActionSheet } from '../components/DriverActionSheet';
import { DriverDrawer } from '../components/DriverDrawer';
import { DriverAuthGate } from '../components/DriverAuthGate';
import {
  DriverDutyState,
  DriverTrip,
  DriverVehicle,
  DriverEarnings,
  HighwayAdvisory,
  TripStage,
  DriverRateCard,
  DriverProfileData,
  DriverPayoutRecord,
  OpenRideRequest,
} from '../types/driver';

const DEFAULT_ADVISORY: HighwayAdvisory = {
  location: 'Tangmarg — Gulmarg Road',
  status: 'Snow Chains Recommended',
  message: 'Sub-zero morning frost expected above 6,000 ft. Anti-skid chains required for Gulmarg sector.',
  snowChainsMandatory: true,
  tempC: -1,
};

const EMPTY_EARNINGS: DriverEarnings = {
  todayTotal: 0,
  tripsCount: 0,
  onlineHours: '0.0 hrs',
  acceptanceRate: 96,
  upiId: 'kashmir.driver@okaxis',
  availableBalance: 0,
  lifetimeTotal: 0,
  lifetimeTrips: 0,
};

export default function DriverDashboard() {
  const navigate = useNavigate();
  const { user: authUser, token: authToken, logout: authLogout } = useAuth();

  const [portalToken, setPortalToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('driver_portal_token') || null;
    } catch {
      return null;
    }
  });
  const [portalKey, setPortalKey] = useState<string | null>(() => {
    try {
      return localStorage.getItem('driver_portal_key') || null;
    } catch {
      return null;
    }
  });

  const activeToken = portalToken || authToken || null;

  const [isLoadingCockpit, setIsLoadingCockpit] = useState<boolean>(true);
  const [authRequiredMode, setAuthRequiredMode] = useState<
    null | 'LOGIN' | 'PENDING_KYC' | 'REJECTED_KYC' | 'APPLY_CURRENT_USER'
  >(null);

  const [driverProfile, setDriverProfile] = useState<DriverProfileData | null>(null);
  const [dutyState, setDutyState] = useState<DriverDutyState>('OFFLINE');
  const [vehicles, setVehicles] = useState<DriverVehicle[]>([]);
  const [activeVehicleId, setActiveVehicleId] = useState<string>('');
  const [earnings, setEarnings] = useState<DriverEarnings>(EMPTY_EARNINGS);
  const [advisory, setAdvisory] = useState<HighwayAdvisory>(DEFAULT_ADVISORY);
  const [openRequests, setOpenRequests] = useState<OpenRideRequest[]>([]);
  const [tripHistory, setTripHistory] = useState<DriverTrip[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<DriverPayoutRecord[]>([]);

  const [activeTrip, setActiveTrip] = useState<DriverTrip | null>(null);
  const [offerCountdown, setOfferCountdown] = useState<number>(30);
  const [sector, setSector] = useState<string>('Srinagar SXR Airport');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPayoutProcessing, setIsPayoutProcessing] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const dutyStateRef = useRef<DriverDutyState>(dutyState);
  const updateDutyState = useCallback((next: DriverDutyState) => {
    dutyStateRef.current = next;
    setDutyState(next);
  }, []);
  useEffect(() => {
    dutyStateRef.current = dutyState;
  }, [dutyState]);

  const buildHeaders = useCallback(
    (includeJson = true): Record<string, string> => {
      const headers: Record<string, string> = {};
      if (includeJson) headers['Content-Type'] = 'application/json';
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;
      if (portalKey) headers['x-portal-key'] = portalKey;
      return headers;
    },
    [activeToken, portalKey]
  );

  const loadCockpitData = useCallback(async () => {
    if (!activeToken && !portalKey) {
      setIsLoadingCockpit(false);
      setAuthRequiredMode('LOGIN');
      return;
    }

    try {
      const [cockpitRes, tripRes] = await Promise.all([
        fetch(`${API_BASE_URL}/driver/cockpit-state`, { headers: buildHeaders(false) }),
        fetch(`${API_BASE_URL}/driver/active-trip`, { headers: buildHeaders(false) }),
      ]);

      if (cockpitRes.status === 401) {
        localStorage.removeItem('driver_portal_token');
        localStorage.removeItem('driver_portal_key');
        setPortalToken(null);
        setPortalKey(null);
        setAuthRequiredMode('LOGIN');
        setIsLoadingCockpit(false);
        return;
      }

      if (cockpitRes.status === 403) {
        setAuthRequiredMode(authUser ? 'APPLY_CURRENT_USER' : 'LOGIN');
        setIsLoadingCockpit(false);
        return;
      }

      if (cockpitRes.ok) {
        const data = await cockpitRes.json();
        const profile: DriverProfileData | null = data.driverProfile || null;
        setDriverProfile(profile);

        if (profile && profile.approvalStatus === 'PENDING_APPROVAL') {
          setAuthRequiredMode('PENDING_KYC');
        } else if (profile && (profile.approvalStatus === 'REJECTED' || profile.approvalStatus === 'SUSPENDED')) {
          setAuthRequiredMode('REJECTED_KYC');
        } else {
          setAuthRequiredMode(null);
        }

        if (Array.isArray(data.vehicles)) {
          setVehicles(data.vehicles);
          const preferredId =
            data.activeVehicle?.id || profile?.activeVehicleId || data.vehicles[0]?.id || '';
          setActiveVehicleId(preferredId);
        }

        if (data.earnings) {
          setEarnings({
            todayTotal: Number(data.earnings.todayTotal || 0),
            tripsCount: Number(data.earnings.tripsCount || 0),
            onlineHours: `${data.earnings.onlineHours ?? '0.0'} hrs`,
            acceptanceRate: Number(data.earnings.acceptanceRate ?? 96),
            upiId: data.earnings.upiId || profile?.upiId || 'kashmir.driver@okaxis',
            availableBalance: Number(data.earnings.availableBalance ?? 0),
            lifetimeTotal: Number(data.earnings.lifetimeTotal ?? 0),
            lifetimeTrips: Number(data.earnings.lifetimeTrips ?? 0),
          });
        }

        if (data.advisory) {
          setAdvisory({
            id: data.advisory.id,
            location: data.advisory.location || 'Tangmarg — Gulmarg Road',
            status: data.advisory.status || data.advisory.severity || 'Advisory Active',
            message: data.advisory.message || DEFAULT_ADVISORY.message,
            snowChainsMandatory: true,
          });
        }

        if (profile?.currentSector) setSector(profile.currentSector);
        if (Array.isArray(data.openRequests)) setOpenRequests(data.openRequests);
        if (Array.isArray(data.recentTrips)) setTripHistory(data.recentTrips);
        if (Array.isArray(data.payoutHistory)) setPayoutHistory(data.payoutHistory);

        let hasLiveTrip = false;
        if (tripRes.ok) {
          const tripData = await tripRes.json();
          if (tripData.activeTrip) {
            const t = tripData.activeTrip as DriverTrip & { status?: string };
            if (['DISPATCHED', 'AT_PICKUP', 'ON_TRIP', 'ALLOCATED'].includes(String(t.status || '').toUpperCase())) {
              hasLiveTrip = true;
              setActiveTrip(t);
              updateDutyState('ACTIVE_TRIP');
            }
          }
        }

        if (!hasLiveTrip) {
          if (dutyStateRef.current === 'INCOMING_RIDE_OFFER') {
            // Preserve incoming offer card while driver inspects or counters
          } else if (profile?.status === 'AVAILABLE') {
            updateDutyState('ONLINE_SEARCHING');
          } else {
            updateDutyState('OFFLINE');
          }
        }
      }
    } catch (err) {
      console.error('[DriverDashboard] Failed to load cockpit:', err);
    } finally {
      setIsLoadingCockpit(false);
    }
  }, [activeToken, portalKey, authUser, buildHeaders, updateDutyState]);

  useEffect(() => {
    void loadCockpitData();
  }, [loadCockpitData]);

  // Countdown timer when inspecting an incoming offer
  useEffect(() => {
    if (dutyState !== 'INCOMING_RIDE_OFFER') return;
    if (offerCountdown <= 0) {
      updateDutyState('ONLINE_SEARCHING');
      setActiveTrip(null);
      return;
    }
    const timer = setTimeout(() => setOfferCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [dutyState, offerCountdown, updateDutyState]);

  const toDriverTripFromDispatch = useCallback(
    (payload: Record<string, unknown>): DriverTrip => ({
      id: String(payload.reservationId || payload.tripId || payload.bookingId || ''),
      passengerName: String(payload.passengerName || 'Kashmir Guest'),
      passengerPhone: String(payload.passengerPhone || '+91 98111 22334'),
      travelerCount: Number(payload.travelerCount || payload.travelers || payload.travelersCount || 2),
      luggageCount: Number(payload.luggageCount || 2),
      pickupLocation: String(payload.pickupLocation || payload.pickup || 'Srinagar Airport (SXR)'),
      dropLocation: String(payload.dropLocation || payload.drop || 'Dal Lake / Gulmarg'),
      distanceKm: Number(payload.distanceKm || payload.estimatedDistanceKm || 28),
      estimatedDuration: String(
        payload.estimatedDuration || `${payload.estimatedDurationMin || 45} mins`
      ),
      fareAmount: Number(payload.offeredFare || payload.fare || payload.fareAmount || 1800),
      securityPin: String(payload.securityPin || '4821'),
      arrivalTelemetry: (payload.arrivalTelemetry as DriverTrip['arrivalTelemetry']) || {
        type: 'HOTEL',
        propertyName: String(payload.pickupLocation || payload.pickup || 'Srinagar Hub'),
        area: 'Kashmir Valley',
      },
      stage: 'ACCEPTED',
    }),
    []
  );

  // Dual Real-Time Listeners: Socket.IO + Scoped SSE Stream
  useEffect(() => {
    if (
      (!activeToken && !portalKey) ||
      isLoadingCockpit ||
      authRequiredMode === 'LOGIN' ||
      authRequiredMode === 'APPLY_CURRENT_USER' ||
      authRequiredMode === 'REJECTED_KYC'
    ) {
      return;
    }

    const sock = io(SOCKET_URL, {
      ...DEFAULT_SOCKET_OPTIONS,
      auth: {
        token: activeToken || undefined,
        portalKey: portalKey || undefined,
      },
    });
    socketRef.current = sock;

    sock.on('connect', () => {
      setIsRealtimeConnected(true);
      const drvRoomId = driverProfile?.userId || authUser?.id;
      if (drvRoomId) {
        sock.emit('join-driver', drvRoomId);
      }
      sock.emit('join-room', 'driver-room');
    });

    sock.on('disconnect', () => setIsRealtimeConnected(false));

    sock.on('driver-kyc-reviewed', (data: { approvalStatus?: string }) => {
      if (data?.approvalStatus === 'APPROVED') {
        toast.success('KYC Approved! Welcome to the Fleet', {
          description: 'Your Chauffeur Cockpit is now unlocked.',
        });
      }
      void loadCockpitData();
    });

    sock.on('VEHICLE_VERIFIED', (data: { plateNumber?: string; status?: string }) => {
      toast.info(`Vehicle ${data.plateNumber || ''} ${data.status || 'Updated'}`);
      void loadCockpitData();
    });

    sock.on('driver-trip-dispatched', (payload: Record<string, unknown>) => {
      const incoming = toDriverTripFromDispatch(payload);
      toast.info('New Ride Request Received!', {
        id: `trip-dispatch-${incoming.id || incoming.pickupLocation}`,
        duration: 3500,
        description: `${incoming.pickupLocation} → ${incoming.dropLocation} (₹${incoming.fareAmount.toLocaleString('en-IN')})`,
      });
      if (dutyStateRef.current === 'ONLINE_SEARCHING') {
        setActiveTrip(incoming);
        setOfferCountdown(30);
        updateDutyState('INCOMING_RIDE_OFFER');
      }
      void loadCockpitData();
    });

    sock.on('tourist-counter-offer', (payload: { touristCounter?: number; reservationId?: string }) => {
      toast.info('Tourist Sent Counter-Offer', {
        description: `Guest proposed ₹${Number(payload.touristCounter || 0).toLocaleString('en-IN')}`,
      });
      void loadCockpitData();
    });

    sock.on('trip-confirmed', () => {
      toast.success('Tourist Confirmed Your Ride!', {
        description: 'Proceed to pickup point with passenger Boarding PIN.',
      });
      void loadCockpitData();
    });

    sock.on('cab-reservation-cancelled', () => {
      toast.warning('Ride request cancelled by guest');
      void loadCockpitData();
    });

    const sseParams = new URLSearchParams();
    if (activeToken) sseParams.set('token', activeToken);
    if (portalKey) sseParams.set('portalKey', portalKey);
    const es = new EventSource(`${API_BASE_URL}/driver/stream?${sseParams.toString()}`);

    es.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as { type?: string } & Record<string, unknown>;
        if (msg.type === 'DRIVER_KYC_REVIEWED' || msg.type === 'VEHICLE_VERIFIED') {
          void loadCockpitData();
        } else if (msg.type === 'TRIP_DISPATCHED' || msg.type === 'driver-trip-dispatched') {
          const incoming = toDriverTripFromDispatch(msg);
          if (dutyStateRef.current === 'ONLINE_SEARCHING') {
            setActiveTrip(incoming);
            setOfferCountdown(30);
            updateDutyState('INCOMING_RIDE_OFFER');
          }
          void loadCockpitData();
        } else if (msg.type === 'TOURIST_COUNTER_OFFER' || msg.type === 'TRIP_CONFIRMED') {
          void loadCockpitData();
        }
      } catch {
        // Ignore keepalive or malformed frame
      }
    };

    return () => {
      sock.disconnect();
      socketRef.current = null;
      es.close();
    };
  }, [
    activeToken,
    portalKey,
    isLoadingCockpit,
    authRequiredMode,
    driverProfile?.userId,
    authUser?.id,
    loadCockpitData,
    toDriverTripFromDispatch,
    updateDutyState,
  ]);

  const handleAuthenticated = async (payload: {
    token: string;
    portalKey?: string;
    user?: Record<string, unknown>;
  }) => {
    localStorage.setItem('driver_portal_token', payload.token);
    setPortalToken(payload.token);
    if (payload.portalKey) {
      localStorage.setItem('driver_portal_key', payload.portalKey);
      setPortalKey(payload.portalKey);
    }
    setAuthRequiredMode(null);
    setIsLoadingCockpit(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('driver_portal_token');
    localStorage.removeItem('driver_portal_key');
    setPortalToken(null);
    setPortalKey(null);
    setDriverProfile(null);
    authLogout();
    setAuthRequiredMode('LOGIN');
    toast.success('Shift ended cleanly');
  };

  const handleGoOnline = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/driver/duty`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
          status: 'AVAILABLE',
          sector,
          activeVehicleId: activeVehicleId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error('Cannot Go Online', { description: data.error || 'Verify KYC & vehicle approval first.' });
        if (res.status === 403) void loadCockpitData();
        return;
      }
      updateDutyState('ONLINE_SEARCHING');
      if (Array.isArray(data.openRequests)) setOpenRequests(data.openRequests);
      toast.success('You are LIVE & Online!', {
        description: `Broadcasting from ${sector}`,
      });
    } catch {
      toast.error('Network error toggling online status');
    }
  };

  const handleGoOffline = async () => {
    try {
      await fetch(`${API_BASE_URL}/driver/duty`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ status: 'OFFLINE', sector }),
      });
      updateDutyState('OFFLINE');
      setActiveTrip(null);
      toast.info('Duty paused — Offline');
    } catch {
      toast.error('Failed to go offline');
    }
  };

  const handleSelectSector = async (newSector: string) => {
    setSector(newSector);
    try {
      await fetch(`${API_BASE_URL}/driver/location`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ sector: newSector }),
      });
      toast.success(`Staging hub updated to ${newSector}`);
    } catch {
      // Silent fallback
    }
  };

  const handleSelectOpenRequest = (reqItem: OpenRideRequest) => {
    setActiveTrip({
      id: reqItem.reservationId,
      passengerName: reqItem.passengerName,
      passengerPhone: reqItem.passengerPhone || '+91 98111 22334',
      travelerCount: reqItem.travelerCount,
      luggageCount: reqItem.luggageCount,
      pickupLocation: reqItem.pickupLocation,
      dropLocation: reqItem.dropLocation,
      distanceKm: reqItem.distanceKm,
      estimatedDuration: reqItem.estimatedDuration,
      fareAmount: reqItem.touristCounter || reqItem.fareAmount,
      securityPin: reqItem.securityPin,
      arrivalTelemetry: reqItem.arrivalTelemetry,
      stage: 'ACCEPTED',
    });
    setOfferCountdown(30);
    updateDutyState('INCOMING_RIDE_OFFER');
  };

  const handleAcceptOffer = async () => {
    if (!activeTrip) return;
    try {
      const res = await fetch(`${API_BASE_URL}/driver/bookings/${activeTrip.id}/accept`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to accept offer');
        return;
      }
      if (data.awaitingTouristConfirm) {
        toast.success('Offer Accepted!', {
          description: 'Waiting for tourist confirmation on Kashmir Curators app.',
        });
        updateDutyState('ONLINE_SEARCHING');
        setActiveTrip(null);
        void loadCockpitData();
      } else {
        updateDutyState('ACTIVE_TRIP');
        toast.success('Trip Locked!', { description: 'Proceed to tourist pickup location.' });
        void loadCockpitData();
      }
    } catch {
      toast.error('Network error accepting offer');
    }
  };

  const handleDeclineOffer = async () => {
    if (activeTrip) {
      await fetch(`${API_BASE_URL}/driver/bookings/${activeTrip.id}/decline`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ reason: 'Chauffeur declined offer' }),
      }).catch(() => null);
    }
    setActiveTrip(null);
    updateDutyState('ONLINE_SEARCHING');
    void loadCockpitData();
  };

  const handleCounterOffer = async (tripId: string, proposedFare: number, reason: string) => {
    const res = await fetch(`${API_BASE_URL}/driver/bookings/${tripId}/counter-offer`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ proposedFare, reason }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'Failed to send counter-offer');
      return;
    }
    toast.success(`Counter-Offer ₹${proposedFare.toLocaleString('en-IN')} Sent!`);
    void loadCockpitData();
  };

  const handleVerifySecurityPin = async (enteredPin: string): Promise<boolean> => {
    if (!activeTrip) return false;
    const res = await fetch(`${API_BASE_URL}/driver/bookings/${activeTrip.id}/verify-pin`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ pin: enteredPin }),
    });
    const data = await res.json();
    return Boolean(res.ok && data.verified);
  };

  const handleSlideStageTransition = async (stage: TripStage) => {
    if (!activeTrip) return;
    const apiStageMap: Record<TripStage, string> = {
      ACCEPTED: 'ARRIVED',
      ARRIVED_AT_PICKUP: 'ARRIVED',
      STARTED_IN_TRANSIT: 'STARTED',
      COMPLETED: 'COMPLETED',
    };
    const res = await fetch(`${API_BASE_URL}/driver/bookings/${activeTrip.id}/transition`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ stage: apiStageMap[stage] }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'Failed to transition trip stage');
      return;
    }

    if (stage === 'COMPLETED') {
      toast.success('Trip Completed! Earnings Credited.', {
        description: `₹${activeTrip.fareAmount.toLocaleString('en-IN')} added to your withdrawable balance.`,
      });
      setActiveTrip(null);
      updateDutyState('ONLINE_SEARCHING');
      void loadCockpitData();
    } else {
      setActiveTrip((prev) => (prev ? { ...prev, stage } : null));
      toast.success(`Trip stage updated: ${data.status}`);
    }
  };

  const handleRequestPayout = async () => {
    setIsPayoutProcessing(true);
    try {
      const amount = earnings.availableBalance ?? earnings.todayTotal;
      const res = await fetch(`${API_BASE_URL}/driver/payout`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ amount, upiId: earnings.upiId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Payout failed');
        return;
      }
      toast.success('Instant UPI Payout Settled!', {
        description: `₹${Number(data.amount).toLocaleString('en-IN')} sent to ${data.upiId} (${data.payoutRef})`,
      });
      void loadCockpitData();
    } finally {
      setIsPayoutProcessing(false);
    }
  };

  const handleTriggerSos = async (incidentType: string, notes?: string) => {
    const res = await fetch(`${API_BASE_URL}/driver/sos`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({
        incidentType,
        notes,
        location: sector,
        reservationId: activeTrip?.id,
      }),
    });
    if (res.ok) {
      toast.error('SOS Emergency Transmitted to Command Desk!', {
        description: `Rescue desk alerted at ${sector}. Keep phone line clear.`,
      });
    } else {
      toast.error('Failed to send SOS alert — Call 112 immediately!');
    }
  };

  const handleRegisterVehicle = async (vehicle: Partial<DriverVehicle>) => {
    const res = await fetch(`${API_BASE_URL}/driver/vehicles`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(vehicle),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'Failed to register vehicle');
      throw new Error(data.error || 'Registration failed');
    }
    void loadCockpitData();
  };

  const handleEditVehicle = async (id: string, patch: Partial<DriverVehicle>) => {
    const res = await fetch(`${API_BASE_URL}/driver/vehicles/${id}`, {
      method: 'PATCH',
      headers: buildHeaders(),
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || 'Failed to update vehicle');
      return;
    }
    toast.success('Vehicle specs updated');
    void loadCockpitData();
  };

  const handleDeleteVehicle = async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/driver/vehicles/${id}`, {
      method: 'DELETE',
      headers: buildHeaders(false),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || 'Failed to remove vehicle');
      return;
    }
    toast.success('Vehicle removed from your fleet');
    void loadCockpitData();
  };

  const handleSaveRateCard = async (vehicleId: string, rateCard: DriverRateCard) => {
    const res = await fetch(`${API_BASE_URL}/driver/rate-card`, {
      method: 'PATCH',
      headers: buildHeaders(),
      body: JSON.stringify({ vehicleId, rateCard }),
    });
    if (!res.ok) {
      toast.error('Failed to save rate card');
      throw new Error('Failed to save rate card');
    }
    void loadCockpitData();
  };

  const handleUpdateProfile = async (patch: Record<string, unknown>) => {
    const res = await fetch(`${API_BASE_URL}/driver/profile`, {
      method: 'PATCH',
      headers: buildHeaders(),
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || 'Failed to update profile');
      return;
    }
    toast.success('KYC & Payout Profile Saved');
    void loadCockpitData();
  };

  const handleSelectVehicle = async (id: string) => {
    setActiveVehicleId(id);
    if (driverProfile) {
      await fetch(`${API_BASE_URL}/driver/profile`, {
        method: 'PATCH',
        headers: buildHeaders(),
        body: JSON.stringify({ activeVehicleId: id }),
      }).catch(() => null);
    }
  };

  const activeVehicle = vehicles.find((v) => v.id === activeVehicleId) || vehicles[0] || null;

  if (isLoadingCockpit) {
    return (
      <div className="fixed inset-0 bg-[#07090E] text-white flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl border-2 border-amber-500/50 border-t-amber-400 animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest text-amber-400">
          Syncing Kashmir Curators Chauffeur OS...
        </p>
      </div>
    );
  }

  if (authRequiredMode) {
    return (
      <DriverAuthGate
        mode={authRequiredMode}
        driverProfile={driverProfile}
        currentUserEmail={authUser?.email || null}
        currentUserName={authUser?.name || null}
        onAuthenticated={handleAuthenticated}
        onRefreshStatus={loadCockpitData}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="relative w-full h-[100dvh] min-h-[100dvh] overflow-hidden bg-[#07090E] select-none font-sans">
      {/* 1. Interactive Full-Bleed Dark Tactical Valley Cockpit */}
      <DriverMapCockpit
        dutyState={dutyState}
        activeTrip={activeTrip}
        snowChainsActive={activeVehicle?.snowChains ?? true}
        sector={sector}
        onSelectSector={handleSelectSector}
      />

      {/* 2. Top Floating Glassmorphic HUD */}
      <DriverTopHud
        onOpenDrawer={() => setIsDrawerOpen(true)}
        activeVehicle={activeVehicle}
        earnings={earnings}
        advisory={advisory}
        onRequestPayout={handleRequestPayout}
        isPayoutProcessing={isPayoutProcessing}
        onTriggerSos={handleTriggerSos}
        isRealtimeConnected={isRealtimeConnected}
      />

      {/* 3. Uber-Style Floating Bottom Action Sheet */}
      <DriverActionSheet
        dutyState={dutyState}
        onGoOnline={handleGoOnline}
        onGoOffline={handleGoOffline}
        activeTrip={activeTrip}
        activeVehicle={activeVehicle}
        openRequests={openRequests}
        onSelectRequest={handleSelectOpenRequest}
        onAcceptOffer={handleAcceptOffer}
        onDeclineOffer={handleDeclineOffer}
        onCounterOffer={handleCounterOffer}
        offerCountdownSeconds={offerCountdown}
        onSlideStageTransition={handleSlideStageTransition}
        onVerifySecurityPin={handleVerifySecurityPin}
      />

      {/* 4. Slide-out Fleet, Rate Card, Wallet & Profile Drawer */}
      <DriverDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        vehicles={vehicles}
        activeVehicleId={activeVehicleId}
        onSelectVehicle={handleSelectVehicle}
        onRegisterVehicle={handleRegisterVehicle}
        onEditVehicle={handleEditVehicle}
        onDeleteVehicle={handleDeleteVehicle}
        earnings={earnings}
        onRequestPayout={handleRequestPayout}
        isPayoutProcessing={isPayoutProcessing}
        onSaveRateCard={handleSaveRateCard}
        driverName={driverProfile?.name || authUser?.name || 'Kashmir Chauffeur'}
        driverProfile={driverProfile}
        tripHistory={tripHistory}
        payoutHistory={payoutHistory}
        onUpdateProfile={handleUpdateProfile}
        onLogout={handleLogout}
        onExitToHome={() => navigate('/')}
      />
    </div>
  );
}
