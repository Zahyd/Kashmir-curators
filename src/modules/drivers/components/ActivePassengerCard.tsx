import React, { useState } from 'react';
import { 
  User, 
  MapPin, 
  Phone, 
  Navigation, 
  Plane, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Luggage,
  Sparkles
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export interface ActiveTrip {
  id: string;
  passengerName: string;
  passengerPhone: string;
  travelerCount: number;
  luggageCount?: number;
  pickupLocation: string;
  dropLocation: string;
  flightNumber?: string;
  flightStatus?: string;
  eta: string;
  securityCode: string;
  status: 'ASSIGNED' | 'EN_ROUTE_PICKUP' | 'TRIP_STARTED' | 'COMPLETED';
}

interface ActivePassengerCardProps {
  trip?: ActiveTrip | null;
  onUpdateTripStatus: (status: ActiveTrip['status']) => void;
}

export const ActivePassengerCard: React.FC<ActivePassengerCardProps> = ({
  trip,
  onUpdateTripStatus
}) => {
  if (!trip) {
    return (
      <Card className="rounded-3xl border border-dashed border-border/80 p-8 text-center bg-card">
        <Clock className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
        <h4 className="font-bold text-base text-foreground">No Active Trip Assigned</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
          Keep your duty toggle set to "Available". Operations will dispatch incoming airport pickups and tour routes directly to this screen.
        </p>
      </Card>
    );
  }

  const handleCall = () => {
    window.location.href = `tel:${trip.passengerPhone}`;
  };

  const handleNavigate = () => {
    const destination = encodeURIComponent(
      trip.status === 'EN_ROUTE_PICKUP' ? trip.pickupLocation : trip.dropLocation
    );
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
  };

  return (
    <Card className="rounded-3xl border-2 border-primary/30 shadow-md bg-card overflow-hidden">
      {/* Top Banner */}
      <div className="bg-primary/10 px-5 py-3 border-b border-primary/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Active Assignment
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">Security PIN:</span>
          <span className="font-mono font-black text-sm bg-background px-2 py-0.5 rounded-md border text-foreground">
            {trip.securityCode}
          </span>
        </div>
      </div>

      <CardContent className="p-5 space-y-4">
        {/* Passenger Profile */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-black text-foreground">{trip.passengerName}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
              <span>{trip.travelerCount} Travelers</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Luggage className="w-3 h-3" /> {trip.luggageCount || 2} Bags
              </span>
            </p>
          </div>

          <Badge className="bg-primary text-primary-foreground font-bold text-xs">
            {trip.status.replace(/_/g, ' ')}
          </Badge>
        </div>

        {/* Airport Flight Tracker (if airport pickup) */}
        {trip.flightNumber && (
          <div className="p-3 bg-muted/40 rounded-2xl flex items-center justify-between text-xs border border-border/50">
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-primary" />
              <div>
                <span className="font-mono font-bold text-foreground">{trip.flightNumber}</span>
                <p className="text-[10px] text-muted-foreground">Srinagar Airport (SXR)</p>
              </div>
            </div>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              {trip.flightStatus || 'Landed / On Time'}
            </span>
          </div>
        )}

        {/* Route Details */}
        <div className="space-y-3 bg-muted/20 p-4 rounded-2xl border border-border/50 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
            <div>
              <span className="text-muted-foreground text-[10px] uppercase font-semibold">Pickup</span>
              <p className="font-bold text-foreground text-sm">{trip.pickupLocation}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1 shrink-0" />
            <div>
              <span className="text-muted-foreground text-[10px] uppercase font-semibold">Destination</span>
              <p className="font-bold text-foreground text-sm">{trip.dropLocation}</p>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons (Call & Maps) */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            variant="outline"
            onClick={handleCall}
            className="rounded-2xl h-11 text-xs font-bold gap-2 border-border/80 hover:bg-muted"
          >
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>Call Guest</span>
          </Button>

          <Button
            variant="outline"
            onClick={handleNavigate}
            className="rounded-2xl h-11 text-xs font-bold gap-2 border-border/80 hover:bg-muted"
          >
            <Navigation className="w-4 h-4 text-primary" />
            <span>Open Maps</span>
          </Button>
        </div>

        {/* Trip Progression Button */}
        <div className="pt-2">
          {trip.status === 'ASSIGNED' && (
            <Button
              onClick={() => onUpdateTripStatus('EN_ROUTE_PICKUP')}
              className="w-full rounded-2xl h-12 text-sm font-bold bg-primary text-primary-foreground shadow-md shadow-primary/20"
            >
              Start Driving to Pickup Point
            </Button>
          )}

          {trip.status === 'EN_ROUTE_PICKUP' && (
            <Button
              onClick={() => onUpdateTripStatus('TRIP_STARTED')}
              className="w-full rounded-2xl h-12 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
            >
              Guest Picked Up & Start Tour
            </Button>
          )}

          {trip.status === 'TRIP_STARTED' && (
            <Button
              onClick={() => onUpdateTripStatus('COMPLETED')}
              className="w-full rounded-2xl h-12 text-sm font-bold bg-foreground text-background"
            >
              Complete Trip & Destination Reached
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivePassengerCard;
