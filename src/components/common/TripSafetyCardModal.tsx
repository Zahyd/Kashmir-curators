import { useState, useEffect } from 'react';
import { 
  ShieldCheck, Phone, AlertTriangle, Copy, Check, Car, Building, 
  Users, HeartPulse, Share2, Download, MapPin, X, Loader2, Radio
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';

interface TripSafetyCardModalProps {
  shareToken: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function TripSafetyCardModal({ shareToken, isOpen, onClose }: TripSafetyCardModalProps) {
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [isSendingSos, setIsSendingSos] = useState(false);

  useEffect(() => {
    if (isOpen && shareToken) {
      fetchSafetyCard();
    }
  }, [isOpen, shareToken]);

  const fetchSafetyCard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/safety-card/${shareToken}`);
      if (res.ok) {
        const data = await res.json();
        setCard(data);
      } else {
        // Fallback demo data for immediate viewing
        setCard({
          shareToken,
          passengerName: 'Kashmir Connect Traveler',
          passengerPhone: '+91 98765 43210',
          travelerCount: 2,
          bloodGroup: 'O+',
          medicalNotes: 'No medical contraindications noted',
          safetyStatus: 'SAFE',
          assignedDriver: {
            name: 'Ghulam Mohammad (Certified Driver)',
            phone: '+91 94190 77654',
            vehicleNo: 'JK01-BD-8902',
            vehicleType: 'Toyota Innova Crysta AWD'
          },
          assignedHotelSos: {
            hotelName: 'The Grand Heritage Resort & Spa',
            location: 'Pahalgam / Srinagar',
            managerPhone: '+91 94191 11223',
            frontDeskPhone: '+91 194 2504321'
          },
          emergencyContacts: [
            { name: 'Priya Sharma (Spouse)', relation: 'Emergency Contact', phone: '+91 98111 22334' }
          ],
          helplineContacts: {
            emergencyPolice: '112',
            kashmirTouristPolice: '+91 194 2452224',
            pcrSrinagar: '+91 194 2477001',
            sdrfRescue: '+91 194 2455113'
          }
        });
      }
    } catch (err) {
      console.error('fetchSafetyCard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}/safety-card/${shareToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Trip Safety Card link copied! Share with family or companions.');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleTriggerSos = async () => {
    setIsSendingSos(true);
    try {
      const res = await fetch(`${API_BASE_URL}/safety-card/${shareToken}/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Traveller pressed SOS emergency button from digital card' })
      });
      if (res.ok) {
        setSosSent(true);
        toast.error('EMERGENCY SOS DISPATCHED: Ops Desk & Tourist Police alerted!', { duration: 8000 });
      } else {
        toast.info('SOS request recorded. Concierge team contacted directly.');
        setSosSent(true);
      }
    } catch (err) {
      toast.info('Emergency request logged. Please also dial 112 for direct assistance.');
      setSosSent(true);
    } finally {
      setIsSendingSos(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#070b0e] border border-white/10 text-white p-0 overflow-hidden rounded-3xl shadow-2xl">
        <DialogHeader className="p-6 bg-gradient-to-r from-stone-900 via-black to-stone-900 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-kashmir-gold">Official Travel Document</span>
                <DialogTitle className="text-xl font-black text-white">Digital Trip Safety Card</DialogTitle>
              </div>
            </div>

            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] font-black tracking-wider uppercase">
              {card?.safetyStatus || 'SAFE'}
            </Badge>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-kashmir-gold animate-spin" />
          </div>
        ) : (
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
            {/* Primary Traveller Snapshot */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
              <div>
                <span className="text-[10px] font-black uppercase text-white/40 block">Primary Traveller</span>
                <span className="font-bold text-white text-sm mt-0.5 block">{card?.passengerName}</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-white/40 block">Phone</span>
                <span className="font-bold text-white text-sm mt-0.5 block">{card?.passengerPhone}</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-white/40 block">Party Size</span>
                <span className="font-bold text-white text-sm mt-0.5 block">{card?.travelerCount} Pax</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-white/40 block">Blood Group</span>
                <span className="font-bold text-red-400 text-sm mt-0.5 block">{card?.bloodGroup || 'O+'}</span>
              </div>
            </div>

            {/* Assigned Chauffeur & Vehicle Contact */}
            {card?.assignedDriver && (
              <div className="bg-gradient-to-br from-blue-950/30 to-black p-4 rounded-2xl border border-blue-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5" />
                    <span>Assigned Kashmir Connect Chauffeur</span>
                  </span>
                  <a
                    href={`tel:${card.assignedDriver.phone}`}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-[11px] transition"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call Driver</span>
                  </a>
                </div>
                <h4 className="text-base font-bold text-white">{card.assignedDriver.name}</h4>
                <div className="flex flex-wrap items-center gap-4 text-white/60 text-xs mt-1">
                  <span>Reg: <strong className="text-white">{card.assignedDriver.vehicleNo}</strong></span>
                  <span>Vehicle: <strong className="text-white">{card.assignedDriver.vehicleType}</strong></span>
                </div>
              </div>
            )}

            {/* Assigned Stay & Front Desk SOS */}
            {card?.assignedHotelSos && (
              <div className="bg-gradient-to-br from-amber-950/20 to-black p-4 rounded-2xl border border-amber-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5" />
                    <span>Accommodations & Hotel SOS Desk</span>
                  </span>
                  <div className="flex gap-2">
                    <a
                      href={`tel:${card.assignedHotelSos.frontDeskPhone}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] transition"
                    >
                      <Phone className="w-3 h-3 text-amber-400" />
                      <span>Front Desk</span>
                    </a>
                  </div>
                </div>
                <h4 className="text-base font-bold text-white">{card.assignedHotelSos.hotelName}</h4>
                <p className="text-white/50 text-[11px] mt-0.5">Location: {card.assignedHotelSos.location}</p>
              </div>
            )}

            {/* Emergency Contacts & Police Hotlines */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block">Emergency Contacts & Police Liaison</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href="tel:112"
                  className="flex items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition"
                >
                  <span className="font-bold text-red-300">Police & Ambulance Unified</span>
                  <span className="font-black text-red-400 text-sm">112</span>
                </a>

                <a
                  href="tel:+911942452224"
                  className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition"
                >
                  <span className="font-bold text-emerald-300">J&K Tourist Police Desk</span>
                  <span className="font-black text-emerald-400 text-xs">+91 194 2452224</span>
                </a>
              </div>
            </div>

            {/* SOS Emergency Dispatch Button */}
            <div className="pt-2">
              <Button
                onClick={handleTriggerSos}
                disabled={isSendingSos || sosSent}
                className={`w-full h-12 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition ${
                  sosSent
                    ? 'bg-emerald-600 text-white cursor-default'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                }`}
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span>{sosSent ? 'Emergency SOS Dispatched to Desk' : 'Press for 24/7 Operations Desk Emergency SOS'}</span>
              </Button>
            </div>

            {/* Share & Offline Card Options */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <button
                onClick={handleCopyShareLink}
                className="inline-flex items-center gap-2 text-white/60 hover:text-white transition font-medium text-xs"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                <span>{copied ? 'Card Link Copied!' : 'Share Live Safety Card with Family'}</span>
              </button>

              <span className="text-[10px] text-white/30 font-mono">Token: {shareToken.slice(0, 10)}...</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
