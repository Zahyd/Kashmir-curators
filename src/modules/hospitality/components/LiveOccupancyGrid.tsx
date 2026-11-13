import React, { useState } from 'react';
import { 
  BedDouble, 
  Flame, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Sliders, 
  Zap, 
  Droplet,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Room {
  id: string;
  roomNumber: string;
  category: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
  housekeeping: 'CLEAN' | 'DIRTY' | 'INSPECTED';
  bukhariActive: boolean;
  guestName?: string;
}

const INITIAL_ROOMS: Room[] = [
  { id: 'r1', roomNumber: '101', category: 'Royal Cedar Suite', status: 'OCCUPIED', housekeeping: 'INSPECTED', bukhariActive: true, guestName: 'Dr. Rahul Sharma' },
  { id: 'r2', roomNumber: '102', category: 'Royal Cedar Suite', status: 'AVAILABLE', housekeeping: 'CLEAN', bukhariActive: true },
  { id: 'r3', roomNumber: '103', category: 'Deluxe Lake View', status: 'RESERVED', housekeeping: 'CLEAN', bukhariActive: false, guestName: 'Ananya Roy (Arriving Today)' },
  { id: 'r4', roomNumber: '104', category: 'Deluxe Lake View', status: 'AVAILABLE', housekeeping: 'CLEAN', bukhariActive: false },
  { id: 'r5', roomNumber: '201', category: 'Alpine Heated Chalet', status: 'OCCUPIED', housekeeping: 'INSPECTED', bukhariActive: true, guestName: 'Zubair Al-Mansoor' },
  { id: 'r6', roomNumber: '202', category: 'Alpine Heated Chalet', status: 'AVAILABLE', housekeeping: 'CLEAN', bukhariActive: true },
  { id: 'r7', roomNumber: '203', category: 'Alpine Heated Chalet', status: 'MAINTENANCE', housekeeping: 'DIRTY', bukhariActive: false },
  { id: 'r8', roomNumber: '204', category: 'Deluxe Lake View', status: 'AVAILABLE', housekeeping: 'CLEAN', bukhariActive: false },
];

export const LiveOccupancyGrid: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);

  const toggleRoomStatus = (roomId: string) => {
    setRooms(prev => prev.map(r => {
      if (r.id === roomId) {
        const nextStatus = r.status === 'AVAILABLE' ? 'OCCUPIED' : 'AVAILABLE';
        toast.info(`Room ${r.roomNumber} status set to ${nextStatus}`);
        return { ...r, status: nextStatus };
      }
      return r;
    }));
  };

  const toggleBukhari = (roomId: string) => {
    setRooms(prev => prev.map(r => {
      if (r.id === roomId) {
        const next = !r.bukhariActive;
        toast.success(`Room ${r.roomNumber} Bukhari Heating ${next ? 'Activated' : 'Extinguished'}`);
        return { ...r, bukhariActive: next };
      }
      return r;
    }));
  };

  const availableCount = rooms.filter(r => r.status === 'AVAILABLE').length;
  const occupiedCount = rooms.filter(r => r.status === 'OCCUPIED').length;
  const occupancyPct = Math.round((occupiedCount / rooms.length) * 100);

  return (
    <div className="space-y-6">
      {/* Overview Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-card p-4 rounded-3xl border border-border/70 shadow-sm">
        <div className="p-3 bg-muted/30 rounded-2xl">
          <span className="text-xs text-muted-foreground">Total Capacity</span>
          <p className="text-2xl font-black text-foreground mt-0.5">{rooms.length} Suites</p>
        </div>
        <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Available Rooms</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{availableCount}</p>
        </div>
        <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
          <span className="text-xs text-primary font-semibold">Occupied Today</span>
          <p className="text-2xl font-black text-primary mt-0.5">{occupiedCount}</p>
        </div>
        <div className="p-3 bg-muted/30 rounded-2xl">
          <span className="text-xs text-muted-foreground">Live Occupancy</span>
          <p className="text-2xl font-black text-foreground mt-0.5">{occupancyPct}%</p>
        </div>
      </div>

      {/* Kashmir Winter Readiness Highlights */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-foreground">Winter Heating & Power Systems Live</h4>
            <p className="text-xs text-muted-foreground">
              Central wood Bukhari stoves & 24/7 silent diesel generator operating normally.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs shrink-0 font-medium">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <Zap className="w-3.5 h-3.5" /> 220V Grid Online
          </span>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <Droplet className="w-3.5 h-3.5" /> Hot Water Boilers Active
          </span>
        </div>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {rooms.map((room) => {
          const isAvail = room.status === 'AVAILABLE';
          const isOcc = room.status === 'OCCUPIED';
          const isRes = room.status === 'RESERVED';

          return (
            <Card 
              key={room.id}
              className={`rounded-3xl border transition-all overflow-hidden ${
                isAvail ? 'border-emerald-500/30 bg-emerald-500/5' :
                isOcc ? 'border-primary/30 bg-card' :
                isRes ? 'border-purple-500/30 bg-purple-500/5' : 'border-border bg-muted/30'
              }`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-base text-foreground">
                    #{room.roomNumber}
                  </span>
                  <Badge 
                    className={`text-[10px] font-bold ${
                      isAvail ? 'bg-emerald-500 text-white' :
                      isOcc ? 'bg-primary text-primary-foreground' :
                      isRes ? 'bg-purple-500 text-white' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {room.status}
                  </Badge>
                </div>

                <div>
                  <h5 className="font-semibold text-xs text-foreground line-clamp-1">{room.category}</h5>
                  {room.guestName ? (
                    <p className="text-[11px] text-primary font-medium mt-0.5 line-clamp-1">
                      Guest: {room.guestName}
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground mt-0.5">Vacant & Clean</p>
                  )}
                </div>

                {/* Bukhari Heating Toggle */}
                <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                  <button
                    onClick={() => toggleBukhari(room.id)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${
                      room.bukhariActive 
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' 
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>{room.bukhariActive ? 'Bukhari Hot' : 'Heating Off'}</span>
                  </button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleRoomStatus(room.id)}
                    className="text-[11px] h-7 px-2 hover:bg-muted"
                  >
                    Toggle
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default LiveOccupancyGrid;
