import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Bell, 
  Fingerprint, 
  MessageSquare, 
  Smartphone, 
  CheckCircle2, 
  Loader2, 
  Download, 
  Lock, 
  HeartHandshake,
  Compass,
  Utensils
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface AccountSettingsDeskProps {
  user: any;
  editName: string;
  setEditName: (v: string) => void;
  editPhone: string;
  setEditPhone: (v: string) => void;
  isSaving: boolean;
  onSaveProfile: (e: React.FormEvent) => void;
  notifyWhatsApp: boolean;
  setNotifyWhatsApp: (v: boolean) => void;
  notifySMS: boolean;
  setNotifySMS: (v: boolean) => void;
  notifyBiometrics: boolean;
  setNotifyBiometrics: (v: boolean) => void;
}

export const AccountSettingsDesk: React.FC<AccountSettingsDeskProps> = ({
  user,
  editName,
  setEditName,
  editPhone,
  setEditPhone,
  isSaving,
  onSaveProfile,
  notifyWhatsApp,
  setNotifyWhatsApp,
  notifySMS,
  setNotifySMS,
  notifyBiometrics,
  setNotifyBiometrics
}) => {
  const [preferredPace, setPreferredPace] = useState<'relaxed' | 'balanced' | 'active'>('balanced');
  const [dietary, setDietary] = useState<string>('Standard / Wazwan');
  const [emergencyContact, setEmergencyContact] = useState({ name: '', phone: '', relationship: 'Family' });

  const handleExportData = () => {
    const data = {
      user: { id: user?.id, name: user?.name, email: user?.email, phone: user?.phone },
      exportedAt: new Date().toISOString(),
      platform: 'Kashmir Curators Enterprise Portal'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kashmir_curators_profile_${user?.id?.slice(-4) || 'export'}.json`;
    a.click();
    toast.success('Your encrypted travel profile export is ready.');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-amber-400 mb-2">
            <Lock className="w-3 h-3 text-amber-400" />
            <span>Profile Governance</span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Account Settings & Privacy
          </h2>
          <p className="text-white/50 text-xs md:text-sm mt-0.5">
            Manage your personal profile, travel preferences, emergency contacts, and real-time alerts.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/50 bg-slate-900/80 border border-white/5 px-3.5 py-2 rounded-2xl shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Verified Account</span>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl border border-white/10 space-y-8">
        {/* Profile Information Form */}
        <div>
          <h3 className="font-bold text-base text-white mb-1 flex items-center gap-2">
            <User className="w-4 h-4 text-amber-400" />
            <span>Traveler Identity & Contact</span>
          </h3>
          <p className="text-xs text-white/40 mb-6">These details appear on your resort vouchers and driver dispatch sheets.</p>

          <form onSubmit={onSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] font-black text-white/50 block mb-2 uppercase tracking-wider">
                  Full Legal Name
                </label>
                <Input 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  className="bg-black/40 border-white/10 h-12 rounded-2xl text-white font-medium focus-visible:ring-amber-500 text-xs md:text-sm" 
                  placeholder="e.g. Zahid Riyaz"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-white/50 block mb-2 uppercase tracking-wider">
                  Primary Email (Immutable Identity)
                </label>
                <div className="relative">
                  <Input 
                    value={user?.email || ''} 
                    readOnly 
                    className="bg-black/55 border-white/5 h-12 rounded-2xl text-white/50 font-medium text-xs md:text-sm cursor-not-allowed pl-4 pr-10" 
                  />
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-white/50 block mb-2 uppercase tracking-wider">
                  Mobile / WhatsApp Number
                </label>
                <Input 
                  value={editPhone} 
                  onChange={(e) => setEditPhone(e.target.value)} 
                  placeholder="+91 98XXX XXXXX"
                  className="bg-black/40 border-white/10 h-12 rounded-2xl text-white font-medium focus-visible:ring-amber-500 text-xs md:text-sm" 
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-white/50 block mb-2 uppercase tracking-wider">
                  Membership Standing
                </label>
                <div className="h-12 bg-black/40 border border-white/5 rounded-2xl px-4 flex items-center justify-between text-xs">
                  <span className="text-white/60">Privilege Status</span>
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] font-black uppercase">
                    {user?.membershipTier || 'Explorer'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button 
                type="submit" 
                variant="gold" 
                disabled={isSaving}
                className="rounded-2xl px-8 h-11 font-extrabold text-slate-950 bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-500/20 text-xs"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving Changes...
                  </>
                ) : (
                  'Save Profile Details'
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Travel Preferences */}
        <div className="pt-8 border-t border-white/5 space-y-6">
          <div>
            <h3 className="font-bold text-base text-white mb-1 flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Bespoke Travel Preferences</span>
            </h3>
            <p className="text-xs text-white/40">These preferences customize your personalized itinerary curation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-[10px] font-black text-white/50 block mb-2 uppercase tracking-wider">
                Preferred Travel Pace
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'relaxed', label: 'Relaxed' },
                  { id: 'balanced', label: 'Balanced' },
                  { id: 'active', label: 'Adventure' }
                ].map(pace => (
                  <button
                    key={pace.id}
                    type="button"
                    onClick={() => setPreferredPace(pace.id as any)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                      preferredPace === pace.id
                        ? 'bg-amber-500 text-slate-950 border-amber-500 font-extrabold shadow-md'
                        : 'bg-black/30 text-white/60 border-white/5 hover:border-white/20'
                    }`}
                  >
                    {pace.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-white/50 block mb-2 uppercase tracking-wider">
                Dietary Requirements
              </label>
              <select 
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl h-11 px-3 text-xs text-white outline-none focus:border-amber-400 transition-colors"
              >
                <option value="Standard / Wazwan">Authentic Kashmiri (Halal / Wazwan)</option>
                <option value="Vegetarian">Strict Pure Vegetarian (No Onion/Garlic option)</option>
                <option value="Jain">Jain Friendly Meals</option>
                <option value="Continental">Continental / Western Cuisine</option>
              </select>
            </div>
          </div>
        </div>

        {/* Real-time Alert & Notification Channels */}
        <div className="pt-8 border-t border-white/5 space-y-4">
          <div>
            <h3 className="font-bold text-base text-white mb-1 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Notification & Safety Channels</span>
            </h3>
            <p className="text-xs text-white/40">Select where ground coordinators transmit trip alerts and driver details.</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-black/30 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-bold text-white">WhatsApp Real-Time Dispatch</h4>
                  <p className="text-[10px] text-white/40">Instant booking confirmations, chauffeur phone numbers, and safety alerts.</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={notifyWhatsApp} 
                onChange={(e) => setNotifyWhatsApp(e.target.checked)} 
                className="w-5 h-5 rounded border-white/10 text-amber-500 bg-black/40 accent-amber-500 focus:ring-0 cursor-pointer" 
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-black/30 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-bold text-white">SMS Offline Backup</h4>
                  <p className="text-[10px] text-white/40">Critical alerts when mobile data coverage drops in remote mountain passes.</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={notifySMS} 
                onChange={(e) => setNotifySMS(e.target.checked)} 
                className="w-5 h-5 rounded border-white/10 text-amber-500 bg-black/40 accent-amber-500 focus:ring-0 cursor-pointer" 
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-black/30 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-bold text-white">Biometric Quick Entry</h4>
                  <p className="text-[10px] text-white/40">Enable WebAuthn fingerprint / FaceID recognition on supported devices.</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={notifyBiometrics} 
                onChange={(e) => setNotifyBiometrics(e.target.checked)} 
                className="w-5 h-5 rounded border-white/10 text-amber-500 bg-black/40 accent-amber-500 focus:ring-0 cursor-pointer" 
              />
            </div>
          </div>
        </div>

        {/* Security & Data Export */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-white">Data Privacy & Sovereignty</h4>
            <p className="text-[10px] text-white/40 mt-0.5">You can download a complete GDPR-compliant JSON archive of your Kashmir travel history.</p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportData}
            className="h-10 px-4 rounded-xl text-xs font-bold border-white/10 hover:border-amber-500/40 text-white hover:text-amber-400 bg-white/5 gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Travel Profile</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
