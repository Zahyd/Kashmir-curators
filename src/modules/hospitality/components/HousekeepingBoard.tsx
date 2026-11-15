import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  User, 
  RefreshCw, 
  BedDouble, 
  Check, 
  ShieldCheck,
  Flame,
  ArrowRight
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

interface HousekeepingTask {
  id: string;
  hotelId: string;
  roomNumber: string;
  taskType: string;
  priority: string;
  status: 'DIRTY' | 'IN_PROGRESS' | 'CLEAN' | 'INSPECTED';
  assignedTo?: string;
  notes?: string;
  linenChanged: boolean;
  inspectedBy?: string;
  completedAt?: string;
  createdAt: string;
}

interface Room {
  id: string;
  roomNumber: string;
  category?: { name: string };
  housekeeping: string;
}

export const HousekeepingBoard: React.FC = () => {
  const { token, user } = useAuth();
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New task form state
  const [newTaskRoom, setNewTaskRoom] = useState('');
  const [newTaskType, setNewTaskType] = useState('TURNOVER');
  const [newTaskPriority, setNewTaskPriority] = useState('HIGH');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');

  const fetchTasksAndRooms = async () => {
    try {
      setIsLoading(true);
      const authToken = token || localStorage.getItem('auth_token') || '';

      const [tasksRes, roomsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/hotels/operations/housekeeping`, {
          headers: { Authorization: `Bearer ${authToken}` }
        }),
        fetch(`${API_BASE_URL}/hotels/operations/rooms`, {
          headers: { Authorization: `Bearer ${authToken}` }
        })
      ]);

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data);
      }
      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        setRooms(roomsData);
        if (roomsData.length > 0 && !newTaskRoom) {
          setNewTaskRoom(roomsData[0].roomNumber);
        }
      }
    } catch (err) {
      console.error('Failed to load housekeeping tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndRooms();
  }, [token]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskRoom) {
      toast.error('Please select a room');
      return;
    }

    try {
      const authToken = token || localStorage.getItem('auth_token') || '';
      const selectedRoom = rooms.find(r => r.roomNumber === newTaskRoom);
      const hotelId = (selectedRoom as any)?.hotelId || undefined;

      const res = await fetch(`${API_BASE_URL}/hotels/operations/housekeeping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          hotelId,
          roomNumber: newTaskRoom,
          taskType: newTaskType,
          priority: newTaskPriority,
          assignedTo: newTaskAssignee || 'Duty Staff',
          notes: newTaskNotes
        })
      });

      if (!res.ok) throw new Error('Failed to create housekeeping task');

      toast.success(`Housekeeping task logged for Room ${newTaskRoom}`);
      setCreateModalOpen(false);
      setNewTaskNotes('');
      fetchTasksAndRooms();
    } catch (err: any) {
      toast.error(err.message || 'Error creating task');
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      const authToken = token || localStorage.getItem('auth_token') || '';
      const updatePayload: any = { status: newStatus };
      if (newStatus === 'INSPECTED') {
        updatePayload.inspectedBy = user?.name || 'Head Housekeeper';
      }

      const res = await fetch(`${API_BASE_URL}/hotels/operations/housekeeping/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(updatePayload)
      });

      if (!res.ok) throw new Error('Failed to update task status');

      toast.success(`Room task marked as ${newStatus}`);
      fetchTasksAndRooms();
    } catch (err: any) {
      toast.error(err.message || 'Could not update status');
    }
  };

  const dirtyTasks = tasks.filter(t => t.status === 'DIRTY');
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
  const readyTasks = tasks.filter(t => t.status === 'CLEAN' || t.status === 'INSPECTED');

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 sm:p-5 rounded-3xl border border-border/80 shadow-sm">
        <div>
          <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
            <span>Housekeeping Command & Readiness</span>
            <Badge variant="outline" className="text-emerald-600 border-emerald-500/40 text-xs">
              Live Room Sync
            </Badge>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time room turnover tracking, staff allocation, and inspection approval.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTasksAndRooms}
            disabled={isLoading}
            className="rounded-xl text-xs gap-1.5 h-10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="rounded-xl text-xs font-bold gap-1.5 h-10 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Log Cleaning Task</span>
          </Button>
        </div>
      </div>

      {/* 3-Column Task Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: DIRTY / PENDING */}
        <div className="p-4 rounded-3xl bg-rose-500/5 border border-rose-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-foreground flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Needs Cleaning (Dirty)</span>
            </span>
            <Badge className="bg-rose-500 text-white text-xs font-mono font-bold">
              {dirtyTasks.length}
            </Badge>
          </div>

          <div className="space-y-3">
            {dirtyTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground p-6 text-center italic">
                No rooms pending cleaning.
              </p>
            ) : (
              dirtyTasks.map((task) => (
                <Card key={task.id} className="rounded-2xl border-border bg-card p-4 space-y-3 shadow-sm hover:border-amber-500/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black font-mono text-foreground">
                      Room #{task.roomNumber}
                    </span>
                    <Badge variant="outline" className={`text-[10px] font-bold ${
                      task.priority === 'URGENT' || task.priority === 'HIGH'
                        ? 'border-rose-500 text-rose-600 bg-rose-500/10'
                        : 'border-border text-muted-foreground'
                    }`}>
                      {task.priority}
                    </Badge>
                  </div>

                  <p className="text-xs text-foreground font-semibold">
                    Type: <span className="text-muted-foreground">{task.taskType}</span>
                  </p>

                  {task.notes && (
                    <p className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded-xl">
                      {task.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                    <span>Staff: <strong>{task.assignedTo || 'Unassigned'}</strong></span>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                      className="h-7 px-3 text-[10px] font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950"
                    >
                      Start Cleaning
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Column 2: IN PROGRESS */}
        <div className="p-4 rounded-3xl bg-amber-500/5 border border-amber-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-foreground flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span>In Cleaning Progress</span>
            </span>
            <Badge className="bg-amber-500 text-slate-950 text-xs font-mono font-bold">
              {inProgressTasks.length}
            </Badge>
          </div>

          <div className="space-y-3">
            {inProgressTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground p-6 text-center italic">
                No rooms currently in progress.
              </p>
            ) : (
              inProgressTasks.map((task) => (
                <Card key={task.id} className="rounded-2xl border-border bg-card p-4 space-y-3 shadow-sm hover:border-amber-500/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black font-mono text-foreground">
                      Room #{task.roomNumber}
                    </span>
                    <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold">
                      Cleaning Now
                    </Badge>
                  </div>

                  <p className="text-xs text-foreground font-semibold">
                    Attendant: <span className="text-muted-foreground">{task.assignedTo || 'Staff'}</span>
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(task.id, 'CLEAN')}
                      className="w-full h-8 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Mark Clean & Ready for Inspect
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Column 3: CLEAN & READY */}
        <div className="p-4 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-foreground flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Cleaned & Inspected</span>
            </span>
            <Badge className="bg-emerald-600 text-white text-xs font-mono font-bold">
              {readyTasks.length}
            </Badge>
          </div>

          <div className="space-y-3">
            {readyTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground p-6 text-center italic">
                No freshly cleaned rooms yet.
              </p>
            ) : (
              readyTasks.map((task) => (
                <Card key={task.id} className="rounded-2xl border-border bg-card p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black font-mono text-foreground">
                      Room #{task.roomNumber}
                    </span>
                    {task.status === 'INSPECTED' ? (
                      <Badge className="bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Inspected
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                        Clean
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {task.status === 'INSPECTED'
                      ? `Approved by ${task.inspectedBy || 'Supervisor'}`
                      : 'Cleaned. Pending supervisor inspection.'}
                  </p>

                  {task.status !== 'INSPECTED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(task.id, 'INSPECTED')}
                      className="w-full h-8 text-xs font-bold rounded-xl border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                      Sign Off Inspection
                    </Button>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Log Cleaning Task Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Log Room Cleaning Task</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateTask} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Select Room
              </label>
              <Select value={newTaskRoom} onValueChange={setNewTaskRoom}>
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue placeholder="Choose Room Number" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map(r => (
                    <SelectItem key={r.id} value={r.roomNumber}>
                      Room #{r.roomNumber} ({r.category?.name || 'Suite'}) — Status: {r.housekeeping}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Cleaning Type
                </label>
                <Select value={newTaskType} onValueChange={setNewTaskType}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TURNOVER">Turnover (Post Check-out)</SelectItem>
                    <SelectItem value="DAILY_CLEAN">Daily Stayover Clean</SelectItem>
                    <SelectItem value="DEEP_CLEAN">Deep Sanitization</SelectItem>
                    <SelectItem value="LINEN_CHANGE">Winter Linen Change</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Priority
                </label>
                <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High Priority</SelectItem>
                    <SelectItem value="URGENT">Urgent (Immediate Guest Arrival)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Assigned Staff Member
              </label>
              <Input
                placeholder="e.g. Shabir Ahmad / Housekeeper 2"
                value={newTaskAssignee}
                onChange={(e) => setNewTaskAssignee(e.target.value)}
                className="rounded-xl h-11"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Special Notes / Instructions
              </label>
              <Input
                placeholder="e.g. Change electric blanket, restock Bukhari firewood"
                value={newTaskNotes}
                onChange={(e) => setNewTaskNotes(e.target.value)}
                className="rounded-xl h-11"
              />
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
                Create Task
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HousekeepingBoard;
