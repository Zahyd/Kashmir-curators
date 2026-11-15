import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  DollarSign, 
  RefreshCw, 
  Flame,
  ShieldAlert,
  Building2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface MaintenanceTicket {
  id: string;
  hotelId: string;
  roomNumber: string;
  task: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  cost: number;
  loggedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface Room {
  id: string;
  roomNumber: string;
  category?: { name: string };
  status: string;
}

interface MaintenanceDeskProps {
  selectedHotelId?: string;
}

export const MaintenanceDesk: React.FC<MaintenanceDeskProps> = ({ selectedHotelId }) => {
  const { token, user } = useAuth();
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form state
  const [roomNumber, setRoomNumber] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [estimatedCost, setEstimatedCost] = useState('0');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const authToken = token || localStorage.getItem('auth_token') || '';
      const hotelParam = selectedHotelId ? `?hotelId=${encodeURIComponent(selectedHotelId)}` : '';

      const [ticketsRes, roomsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/hotels/operations/maintenance${hotelParam}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        }),
        fetch(`${API_BASE_URL}/hotels/operations/rooms${hotelParam}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        })
      ]);

      if (ticketsRes.ok) {
        const data = await ticketsRes.json();
        setTickets(Array.isArray(data) ? data : []);
      }
      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        const rList = Array.isArray(roomsData) ? roomsData : [];
        setRooms(rList);
        if (rList.length > 0 && !roomNumber) {
          setRoomNumber(rList[0].roomNumber);
        }
      }
    } catch (err) {
      console.error('Failed to load maintenance data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, selectedHotelId]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber || !taskDesc.trim()) {
      toast.error('Please select a room and describe the issue');
      return;
    }

    try {
      const authToken = token || localStorage.getItem('auth_token') || '';
      const selectedRoom = rooms.find(r => r.roomNumber === roomNumber);
      const hotelId = selectedHotelId || (selectedRoom as any)?.hotelId || undefined;

      const res = await fetch(`${API_BASE_URL}/hotels/operations/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          hotelId,
          roomNumber,
          task: taskDesc,
          priority,
          status: 'PENDING',
          cost: parseFloat(estimatedCost) || 0
        })
      });

      if (!res.ok) throw new Error('Failed to log maintenance ticket');

      toast.success(`Maintenance ticket created. Room ${roomNumber} flagged under maintenance.`);
      setCreateModalOpen(false);
      setTaskDesc('');
      setEstimatedCost('0');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error logging ticket');
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    try {
      const authToken = token || localStorage.getItem('auth_token') || '';

      const res = await fetch(`${API_BASE_URL}/hotels/operations/maintenance/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ status: 'RESOLVED' })
      });

      if (!res.ok) throw new Error('Failed to resolve ticket');

      toast.success('Maintenance ticket resolved. Room returned to service.');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Could not resolve ticket');
    }
  };

  const activeTickets = tickets.filter(t => t.status !== 'RESOLVED');
  const resolvedTickets = tickets.filter(t => t.status === 'RESOLVED');
  const totalCost = tickets.reduce((s, t) => s + (t.cost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 sm:p-5 rounded-3xl border border-border/80 shadow-sm">
        <div>
          <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
            <span>Property Maintenance & Winter Repairs</span>
            <Badge variant="outline" className="text-amber-600 border-amber-500/40 text-xs">
              Room Blocking Enabled
            </Badge>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log heating equipment faults, plumbing issues, and track repair work orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="rounded-xl text-xs gap-1.5 h-10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="rounded-xl text-xs font-bold gap-1.5 h-10 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Log Repair Ticket</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 rounded-2xl border-border bg-card">
          <span className="text-xs font-semibold text-muted-foreground">Active Work Orders</span>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{activeTickets.length}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Rooms blocked from check-in</p>
        </Card>

        <Card className="p-4 rounded-2xl border-border bg-card">
          <span className="text-xs font-semibold text-muted-foreground">Resolved This Month</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{resolvedTickets.length}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Restored to available</p>
        </Card>

        <Card className="p-4 rounded-2xl border-border bg-card">
          <span className="text-xs font-semibold text-muted-foreground">Recorded Maintenance Cost</span>
          <p className="text-2xl font-black text-foreground mt-1">₹{totalCost.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Spare parts & technician dues</p>
        </Card>
      </div>

      {/* Tickets Table */}
      <Card className="rounded-3xl border border-border bg-card shadow-lg overflow-hidden">
        <div className="p-4 border-b border-border/70 flex items-center justify-between">
          <h4 className="font-bold text-sm text-foreground">Maintenance Requests & Work Orders</h4>
          <span className="text-xs text-muted-foreground font-mono">{tickets.length} total logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-bold uppercase tracking-wider text-muted-foreground">
                <th className="p-3.5">Room</th>
                <th className="p-3.5">Issue / Description</th>
                <th className="p-3.5">Priority</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Cost</th>
                <th className="p-3.5">Logged</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground italic">
                    No maintenance issues reported. All rooms fully operational.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-3.5 font-mono font-black text-sm text-foreground">
                      #{t.roomNumber}
                    </td>
                    <td className="p-3.5 font-medium text-foreground max-w-xs">
                      {t.task}
                    </td>
                    <td className="p-3.5">
                      <Badge className={`text-[10px] uppercase font-black ${
                        t.priority === 'CRITICAL' || t.priority === 'HIGH'
                          ? 'bg-rose-500 text-white'
                          : t.priority === 'MEDIUM'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {t.priority}
                      </Badge>
                    </td>
                    <td className="p-3.5">
                      <Badge variant="outline" className={`text-[10px] font-bold ${
                        t.status === 'RESOLVED'
                          ? 'border-emerald-500/40 text-emerald-600 bg-emerald-500/10'
                          : 'border-amber-500/40 text-amber-600 bg-amber-500/10'
                      }`}>
                        {t.status}
                      </Badge>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-foreground">
                      ₹{t.cost.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 text-muted-foreground text-[11px]">
                      {new Date(t.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-3.5 text-right">
                      {t.status !== 'RESOLVED' ? (
                        <Button
                          size="sm"
                          onClick={() => handleResolveTicket(t.id)}
                          className="h-7 px-3 text-[10px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Resolve & Free Room
                        </Button>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          Resolved
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Log Ticket Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-500" />
              <span>Log Maintenance / Repair Ticket</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateTicket} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Select Room to Block
              </label>
              <Select value={roomNumber} onValueChange={setRoomNumber}>
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue placeholder="Choose Room Number" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map(r => (
                    <SelectItem key={r.id} value={r.roomNumber}>
                      Room #{r.roomNumber} ({r.category?.name || 'Suite'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Fault / Issue Description
              </label>
              <Input
                placeholder="e.g. Bukhari stove flue draft issue, Geyser thermistor failure"
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                className="rounded-xl h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Priority Level
                </label>
                <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low (Cosmetic)</SelectItem>
                    <SelectItem value="MEDIUM">Medium (Fix Today)</SelectItem>
                    <SelectItem value="HIGH">High (Guest Affected)</SelectItem>
                    <SelectItem value="CRITICAL">Critical (Heating / Power)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Estimated Repair Cost (₹)
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md"
              >
                Create Ticket & Block Room
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaintenanceDesk;
