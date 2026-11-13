import React from 'react';
import { 
  Car, 
  ShieldCheck, 
  Star, 
  Power, 
  AlertTriangle,
  Phone,
  Navigation
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export type DriverDutyStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFFLINE';

interface DriverHeaderProps {
  driverName: string;
  driverCode: string;
  vehicleRegNo: string;
  vehicleType: string;
  rating: number;
  dutyStatus: DriverDutyStatus;
  policeVerification: string;
  onToggleStatus: (newStatus: DriverDutyStatus) => void;
  onTriggerSos: () => void;
}

export const DriverHeader: React.FC<DriverHeaderProps> = ({
  driverName,
  driverCode,
  vehicleRegNo,
  vehicleType,
  rating,
  dutyStatus,
  policeVerification,
  onToggleStatus,
  onTriggerSos
}) => {
  return (
    <div className="bg-card border-b border-border p-4 sm:p-5 sticky top-0 z-30 shadow-sm space-y-4">
      {/* Top Driver Info Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0">
            {driverName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-base text-foreground line-clamp-1">{driverName}</h2>
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0 flex items-center gap-0.5">
                <ShieldCheck className="w-3 h-3" />
                Verified
              </Badge>
            </div>
            <p className="text-xs font-mono text-muted-foreground">
              {vehicleRegNo} • {vehicleType}
            </p>
          </div>
        </div>

        {/* SOS Emergency button */}
        <Button
          variant="destructive"
          size="sm"
          onClick={onTriggerSos}
          className="rounded-xl text-xs font-bold gap-1 shrink-0 px-3 shadow-sm shadow-rose-500/20"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>SOS</span>
        </Button>
      </div>

      {/* Duty Status Segmented Controller (Big Mobile Touch Targets) */}
      <div className="grid grid-cols-3 gap-2 bg-muted/50 p-1.5 rounded-2xl border border-border/50">
        <button
          onClick={() => onToggleStatus('AVAILABLE')}
          className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            dutyStatus === 'AVAILABLE'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Available</span>
        </button>

        <button
          onClick={() => onToggleStatus('ON_TRIP')}
          className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            dutyStatus === 'ON_TRIP'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Car className="w-3.5 h-3.5" />
          <span>On Tour</span>
        </button>

        <button
          onClick={() => onToggleStatus('OFFLINE')}
          className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            dutyStatus === 'OFFLINE'
              ? 'bg-foreground text-background shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>Off Duty</span>
        </button>
      </div>
    </div>
  );
};

export default DriverHeader;
