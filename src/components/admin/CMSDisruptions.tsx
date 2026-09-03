import { useState, useEffect } from 'react';
import { 
  ShieldAlert, AlertTriangle, Plus, RefreshCw, CheckCircle2, 
  Clock, MapPin, Trash2, Edit3, Loader2, Radio, Check, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';

export default function CMSDisruptions() {
  const [advisories, setAdvisories] = useState<any[]>([]);
  const [affectedBookings, setAffectedBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [isTogglingEmergency, setIsTogglingEmergency] = useState(false);

  // New Advisory Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    location: '',
    status: 'Caution',
    severity: 'WARNING',
    category: 'ROAD_HIGHWAY',
    source: 'J&K Traffic Police',
    message: '',
    recommendedAction: ''
  });

  const token = localStorage.getItem('teamToken') || localStorage.getItem('auth_token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const advRes = await fetch(`${API_BASE_URL}/advisories`);
      if (advRes.ok) {
        const advData = await advRes.json();
        setAdvisories(advData);
        setEmergencyActive(advData.some((a: any) => a.emergencyModeActive || a.severity === 'CRITICAL_EMERGENCY'));
      }

      const affRes = await fetch(`${API_BASE_URL}/disruptions/affected-bookings`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (affRes.ok) {
        const affData = await affRes.json();
        setAffectedBookings(affData);
      }
    } catch (err) {
      console.error('CMSDisruptions fetchData error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdvisory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.location || !formData.message) {
      toast.error('Location and Message are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/advisories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success('Advisory published! Affected bookings scanned automatically.');
        setIsModalOpen(false);
        fetchData();
        setFormData({
          location: '',
          status: 'Caution',
          severity: 'WARNING',
          category: 'ROAD_HIGHWAY',
          source: 'J&K Traffic Police',
          message: '',
          recommendedAction: ''
        });
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to create advisory');
      }
    } catch (err) {
      toast.error('Network error publishing advisory');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdvisory = async (id: string) => {
    if (!confirm('Are you sure you want to remove this advisory?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/advisories/${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        toast.success('Advisory deleted');
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to delete advisory');
    }
  };

  const handleToggleEmergencyMode = async () => {
    setIsTogglingEmergency(true);
    const nextState = !emergencyActive;
    try {
      const res = await fetch(`${API_BASE_URL}/advisories/emergency-mode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          active: nextState,
          alertMessage: nextState
            ? 'HIGH-SEVERITY GROUND ALERT: Extreme snowfall and highway disruptions across Kashmir corridors. Operations monitoring active.'
            : 'All Kashmir corridors operating under standard protocols.'
        })
      });

      if (res.ok) {
        setEmergencyActive(nextState);
        toast.success(nextState ? 'EMERGENCY MODE ACTIVATED PLATFORM-WIDE' : 'Emergency Mode Deactivated');
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to toggle emergency mode');
    } finally {
      setIsTogglingEmergency(false);
    }
  };

  return (
    <div className="space-y-8 text-left">
      {/* Header with Emergency Toggle & New Advisory */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Disruptions & Travel Advisories</h2>
          <p className="text-xs text-white/50 mt-1">
            Publish verified traffic, snow, and pass bulletins with automated traveler alert dispatch and alternative routing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleToggleEmergencyMode}
            disabled={isTogglingEmergency}
            className={`font-black text-xs uppercase tracking-wider h-11 px-5 rounded-xl transition ${
              emergencyActive
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <Radio className="w-4 h-4 mr-1.5 animate-pulse" />
            <span>{emergencyActive ? 'Emergency Protocol: ACTIVE' : 'Trigger Emergency Protocol'}</span>
          </Button>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-kashmir-gold hover:bg-kashmir-gold/90 text-black font-bold text-xs uppercase tracking-wider h-11 px-5 rounded-xl shadow-lg"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Publish Advisory</span>
          </Button>
        </div>
      </div>

      {/* Disruption Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
          <span className="text-[10px] font-black uppercase text-white/40 block">Published Advisories</span>
          <span className="text-2xl font-black text-white mt-1 block">{advisories.length}</span>
          <span className="text-[11px] text-white/50 mt-0.5 block">Verified Ground Bulletins</span>
        </div>

        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
          <span className="text-[10px] font-black uppercase text-amber-400 block">Affected Bookings</span>
          <span className="text-2xl font-black text-white mt-1 block">{affectedBookings.length}</span>
          <span className="text-[11px] text-white/50 mt-0.5 block">Cross-referenced with corridor itineraries</span>
        </div>

        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
          <span className="text-[10px] font-black uppercase text-emerald-400 block">Kashmir Flex Status</span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block">READY</span>
          <span className="text-[11px] text-white/50 mt-0.5 block">Automated wallet refunds & rerouting</span>
        </div>
      </div>

      {/* Advisories List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Active Advisory Bulletins</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {advisories.map((item) => (
            <div key={item.id} className="bg-white/[0.02] border border-white/10 p-5 rounded-2xl space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`text-[10px] uppercase font-bold ${
                      item.severity === 'CRITICAL_EMERGENCY' || item.status === 'Closed'
                        ? 'bg-red-500/20 text-red-400 border-red-500/40'
                        : item.severity === 'WARNING' || item.status === 'Caution'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    }`}>
                      {item.severity} - {item.status}
                    </Badge>
                    <span className="text-[10px] text-white/40">{item.category}</span>
                  </div>
                  <h4 className="text-base font-bold text-white">{item.location}</h4>
                </div>

                <Button
                  onClick={() => handleDeleteAdvisory(item.id)}
                  variant="ghost"
                  className="text-white/40 hover:text-red-400 p-2 h-8 w-8"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-xs text-white/80 bg-black/20 p-3 rounded-xl border border-white/5">{item.message}</p>

              {item.recommendedAction && (
                <p className="text-[11px] text-kashmir-gold bg-kashmir-gold/[0.03] p-2 rounded-lg border border-kashmir-gold/10">
                  👉 {item.recommendedAction}
                </p>
              )}

              <div className="flex items-center justify-between text-[11px] text-white/40 pt-2 border-t border-white/5">
                <span>Source: {item.source}</span>
                <span>Updated {new Date(item.lastUpdated || item.updatedAt).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Publish Advisory Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg bg-[#0a0e13] border border-white/10 text-white p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Publish Verified Travel Advisory</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateAdvisory} className="space-y-4 text-xs mt-2">
            <div>
              <label className="text-[10px] font-black uppercase text-white/40 block mb-1">Corridor / Location Name</label>
              <Input
                placeholder="e.g. Sonamarg & Zojila Pass or Gulmarg Gondola Phase 2"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="bg-white/5 border-white/10 text-white h-10 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-white/40 block mb-1">Corridor Status</label>
                <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-stone-900 border-white/10 text-white">
                    <SelectItem value="Open">Open (Clear)</SelectItem>
                    <SelectItem value="Caution">Caution Advised</SelectItem>
                    <SelectItem value="Restricted">Restricted (Convoy Only)</SelectItem>
                    <SelectItem value="Closed">Closed (No Transit)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-white/40 block mb-1">Severity Level</label>
                <Select value={formData.severity} onValueChange={(val) => setFormData({ ...formData, severity: val })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-stone-900 border-white/10 text-white">
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="ADVISORY">Advisory</SelectItem>
                    <SelectItem value="WARNING">Warning</SelectItem>
                    <SelectItem value="SEVERE">Severe</SelectItem>
                    <SelectItem value="CRITICAL_EMERGENCY">Critical Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-white/40 block mb-1">Official Verification Source</label>
              <Input
                placeholder="e.g. J&K Traffic Police, IMD Srinagar, Border Roads Organisation"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="bg-white/5 border-white/10 text-white h-10 rounded-xl"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-white/40 block mb-1">Ground Observations & Details</label>
              <Textarea
                placeholder="Describe road clearance, snow accumulation, flight diversions, or pass opening times..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="bg-white/5 border-white/10 text-white min-h-[80px] rounded-xl"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-white/40 block mb-1">Recommended Tourist Action</label>
              <Input
                placeholder="e.g. Divert to Doodhpathri, carry tire snow chains, or shift departure time"
                value={formData.recommendedAction}
                onChange={(e) => setFormData({ ...formData, recommendedAction: e.target.value })}
                className="bg-white/5 border-white/10 text-white h-10 rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2 flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="text-white/60 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-kashmir-gold text-black font-bold px-5 rounded-xl"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                <span>Broadcast Advisory</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
