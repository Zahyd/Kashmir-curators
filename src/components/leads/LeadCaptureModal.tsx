import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, Phone, Mail, User, CalendarDays, MapPin, Compass, 
  ArrowRight, CheckCircle2, MessageCircle, Loader2, Users, Bed, Car, 
  Flame, Mountain, Heart, Shield, Clock, HelpCircle, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLeadCapture } from '@/contexts/LeadCaptureContext';
import { API_BASE_URL } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Travel style options
const TRAVEL_STYLES = [
  { id: 'Romantic', label: 'Romantic & Honeymoon', icon: Heart, desc: 'Houseboats, candlelights & private shikara' },
  { id: 'Offbeat Explorer', label: 'Offbeat & Hidden Gems', icon: Mountain, desc: 'Gurez, Bangus, Lolab & pristine alpine valleys' },
  { id: 'Family', label: 'Family Vacation', icon: Users, desc: 'Comfortable transits, spacious estates & child-friendly' },
  { id: 'Adventure & Thrill', label: 'Snow & Adventure', icon: Compass, desc: 'Gulmarg Gondola skiing, rafting & high treks' },
  { id: 'Cultural & Leisure', label: 'Heritage & Leisure', icon: Sparkles, desc: 'Old Srinagar, artisan crafts, gardens & cuisine' },
];

// Budget options
const BUDGET_RANGES = [
  { id: 'Standard (₹25k-40k/person)', label: 'Standard Deluxe', desc: '₹25,000 – ₹40,000 / person', star: '3★ / 4★ boutique' },
  { id: 'Premium (₹40k-75k/person)', label: 'Premium Class', desc: '₹40,000 – ₹75,000 / person', star: '4★ / 5★ luxury stays' },
  { id: 'Luxury VIP (₹75k+/person)', label: 'VIP Palatial', desc: '₹75,000+ / person', star: 'Taj, The Khyber & royal houseboats' },
];

// Transportation options
const TRANSPORT_OPTIONS = [
  { id: 'Toyota Innova Crysta VIP', label: 'Innova Crysta VIP', desc: 'Chauffeured luxury mountain MPV' },
  { id: 'Chauffeured Sedan (Etios/Dzire)', label: 'Executive Sedan', desc: 'Comfortable 2-3 traveler sedan' },
  { id: '4x4 Mountain SUV (Scorpio)', label: '4x4 Mountain SUV', desc: 'Heavy terrain mountain cruiser' },
  { id: 'Force Urbania / Tempo Traveller', label: 'Luxury Minibus', desc: '9 to 17-seater group transit' },
  { id: 'No Transport Needed', label: 'Hotels Only', desc: 'I have my own transportation arranged' },
];

// Offbeat options
const OFFBEAT_OPTIONS = [
  { id: 'Yes', label: 'Yes, Take Me Offbeat!', desc: 'Include Gurez Valley, Bangus or Doodhpathri' },
  { id: 'Mix', label: 'Mix of Classic & Offbeat', desc: 'Gulmarg + Pahalgam + 1 hidden secret valley' },
  { id: 'No', label: 'Classic Highlights Only', desc: 'Srinagar, Gulmarg, Pahalgam & Sonamarg' },
];

// Arrival Cities
const ARRIVAL_CITIES = [
  'Srinagar Airport (SXR)',
  'Jammu Tawi Railway Station',
  'Direct Flight from Delhi (DEL)',
  'Direct Flight from Mumbai (BOM)',
  'Other / Self Arrival'
];

export default function LeadCaptureModal() {
  const { isLeadModalOpen, leadModalOptions, closeLeadModal } = useLeadCapture();

  // Multi-step progress (1: Quick Lead, 2: Profiling, 3: Experiences, 4: Success)
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stored lead response from server
  const [createdLead, setCreatedLead] = useState<any>(null);

  // Step 1: Initial Quick Capture Form Data
  const [quickForm, setQuickForm] = useState({
    name: '',
    phone: '',
    email: '',
    travelMonth: 'Next 30 Days',
    intent: 'Bespoke Kashmir Tour',
    destination: 'Kashmir Valley'
  });

  // Step 2 & 3: Detailed Progressive Profiling Data
  const [profileForm, setProfileForm] = useState({
    adultsCount: 2,
    childrenCount: 0,
    arrivalCity: 'Srinagar Airport (SXR)',
    nightsCount: 5,
    budgetRange: 'Premium (₹40k-75k/person)',
    travelStyle: 'Romantic',
    wantOffbeat: 'Mix',
    transportPreference: 'Toyota Innova Crysta VIP',
    preferredAccommodation: '4-Star Boutique',
    placesVisited: 'First Time in Kashmir'
  });

  // Initialize or update fields when modal opens with context options
  useEffect(() => {
    if (isLeadModalOpen) {
      setStep(1);
      setCreatedLead(null);
      setQuickForm(prev => ({
        ...prev,
        intent: leadModalOptions.intent || leadModalOptions.packageTitle || 'Bespoke Kashmir Tour',
        destination: leadModalOptions.destination || 'Kashmir Valley'
      }));

      // Pre-set travel style if honeymoon/romantic package
      const intentLower = (leadModalOptions.intent || leadModalOptions.packageTitle || '').toLowerCase();
      if (intentLower.includes('honeymoon') || intentLower.includes('couple')) {
        setProfileForm(p => ({ ...p, travelStyle: 'Romantic' }));
      } else if (intentLower.includes('offbeat') || intentLower.includes('gurez')) {
        setProfileForm(p => ({ ...p, travelStyle: 'Offbeat Explorer', wantOffbeat: 'Yes' }));
      }
    }
  }, [isLeadModalOpen, leadModalOptions]);

  if (!isLeadModalOpen) return null;

  // STEP 1 SUBMIT: Instant frictionless lead capture
  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickForm.phone && !quickForm.email) {
      toast.error('Please enter your WhatsApp number or email so we can send your itinerary.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/inquiries/quick-capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: quickForm.name || 'Valued Traveler',
          phone: quickForm.phone,
          email: quickForm.email,
          intentQuery: quickForm.intent,
          destination: quickForm.destination,
          travelMonth: quickForm.travelMonth,
          sourceCta: leadModalOptions.sourceCta || 'PLAN_MY_TRIP'
        })
      });

      const data = await res.json();
      if (res.ok && data.lead) {
        setCreatedLead(data.lead);
        toast.success(`Lead ID ${data.leadId} reserved! Let's personalize your trip.`);
        setStep(2); // Advance to conversational profiling
      } else {
        toast.error(data.error || 'Failed to initialize your curation.');
      }
    } catch (err) {
      console.error('Quick capture error:', err);
      toast.error('Network connection issue. Please check your internet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 2 & 3 ENRICHMENT SUBMIT: Progressive profiling update
  const handleEnrichSubmit = async () => {
    if (!createdLead?.id) {
      setStep(4);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/inquiries/${createdLead.id}/enrich`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adultsCount: profileForm.adultsCount,
          childrenCount: profileForm.childrenCount,
          arrivalCity: profileForm.arrivalCity,
          nightsCount: profileForm.nightsCount,
          budgetRange: profileForm.budgetRange,
          preferredAccommodation: profileForm.preferredAccommodation,
          transportPreference: profileForm.transportPreference,
          placesVisited: profileForm.placesVisited,
          travelStyle: profileForm.travelStyle,
          wantOffbeat: profileForm.wantOffbeat,
          destination: quickForm.destination
        })
      });

      const data = await res.json();
      if (res.ok && data.lead) {
        setCreatedLead(data.lead);
        toast.success('Your VIP profile is completely customized!');
      }
    } catch (err) {
      console.error('Enrichment error:', err);
    } finally {
      setIsSubmitting(false);
      setStep(4); // Advance to final success confirmation
    }
  };

  const getModalTitle = () => {
    if (leadModalOptions.packageTitle) return `Customize "${leadModalOptions.packageTitle}"`;
    if (leadModalOptions.sourceCta === 'TALK_TO_EXPERT') return 'Talk to a Kashmir Local Expert';
    if (leadModalOptions.sourceCta === 'BUILD_ITINERARY') return 'Build Your Bespoke Itinerary';
    return 'Plan My Kashmir Trip';
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Frosted Glass Dark Overlay */}
      <div 
        className="fixed inset-0 bg-[#070b0e]/80 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
        onClick={closeLeadModal}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0c1216] border border-slate-200 dark:border-white/10 rounded-3xl sm:rounded-[2.5rem] shadow-2xl z-10 overflow-hidden text-[#111439] dark:text-white my-auto max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeLeadModal}
          className="absolute top-6 right-6 w-10 h-10 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-[#111439] dark:hover:text-white transition-all hover:scale-105 active:scale-95 z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Progress Tracker Header */}
        <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-3 sm:pb-4 border-b border-slate-100 dark:border-white/5 relative z-10 shrink-0">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest">
              <Sparkles className="w-3 h-3" />
              {step === 4 ? 'VIP Concierge Confirmed' : `Stage ${step} of 3 • Progressive Curation`}
            </div>
            {createdLead?.leadId && (
              <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                {createdLead.leadId}
              </span>
            )}
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#111439] dark:text-white">
            {getModalTitle()}
          </h2>
          <p className="text-xs text-[#4A5568] dark:text-white/60 mt-1">
            {step === 1 && "Start your journey. Provide your contact below and our smart engine will tailor the perfect package."}
            {step === 2 && "Configure party size, travel duration, arrival hub, and comfort preference."}
            {step === 3 && "Fine-tune transportation fleet and offbeat territory exploration."}
            {step === 4 && "Your custom itinerary and senior local curator have been assigned."}
          </p>

          {/* Progress Bar */}
          <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden mt-4">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-[#111439] dark:to-amber-300 transition-all duration-500 rounded-full"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STAGE 1: Frictionless 10-Second Quick Lead Capture */}
        {/* ========================================================================= */}
        {step === 1 && (
          <form onSubmit={handleQuickSubmit} className="p-5 sm:p-8 space-y-4 sm:space-y-6 relative z-10 animate-fade-in overflow-y-auto max-h-[calc(92vh-120px)]">
            <div className="space-y-4">
              {/* Intent Selector Quick Pills */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/60">
                  What is your primary travel goal?
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Kashmir Honeymoon Package',
                    'North Kashmir Offbeat Places',
                    'Family Holiday Vacation',
                    'Gulmarg Snow & Ski Adventure',
                    'Custom Scenic Tour'
                  ].map(intent => (
                    <button
                      key={intent}
                      type="button"
                      onClick={() => setQuickForm({ ...quickForm, intent })}
                      className={cn(
                        "px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 border",
                        quickForm.intent === intent
                          ? "bg-[#111439] text-white border-[#111439] dark:bg-amber-400 dark:text-black dark:border-amber-400 shadow-md scale-[1.02]"
                          : "bg-slate-50 dark:bg-white/5 text-[#4A5568] dark:text-white/70 border-slate-200 dark:border-white/10 hover:border-slate-300"
                      )}
                    >
                      {intent}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Phone Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/60">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="e.g. Rahul Sharma"
                      value={quickForm.name}
                      onChange={e => setQuickForm({ ...quickForm, name: e.target.value })}
                      className="h-12 pl-11 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-[#111439] dark:text-white focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/60 flex items-center justify-between">
                    <span>WhatsApp / Phone</span>
                    <span className="text-amber-600 font-bold">*Required</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                    <Input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={quickForm.phone}
                      onChange={e => setQuickForm({ ...quickForm, phone: e.target.value })}
                      className="h-12 pl-11 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl text-xs font-black text-[#111439] dark:text-white focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Email & Tentative Window */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/60">
                    Email Address (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="email"
                      placeholder="rahul@example.com"
                      value={quickForm.email}
                      onChange={e => setQuickForm({ ...quickForm, email: e.target.value })}
                      className="h-12 pl-11 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-[#111439] dark:text-white focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/60">
                    When are you traveling?
                  </label>
                  <div className="relative">
                    <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                    <select
                      value={quickForm.travelMonth}
                      onChange={e => setQuickForm({ ...quickForm, travelMonth: e.target.value })}
                      className="w-full h-12 pl-11 pr-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-[#111439] dark:text-white focus:outline-none focus:bg-white cursor-pointer"
                    >
                      <option value="Immediate (< 15 Days)">Immediate (Next 15 Days)</option>
                      <option value="Next 30 Days">Next 30 Days (Prime Season)</option>
                      <option value="Next 2-3 Months">In 2 - 3 Months</option>
                      <option value="Winter Snow (Dec - Feb)">Winter Snow Season (Dec - Feb)</option>
                      <option value="Spring Tulip Bloom (Mar - Apr)">Spring Tulip Bloom (Mar - Apr)</option>
                      <option value="Summer (May - Jul)">Summer Vacation (May - Jul)</option>
                      <option value="Autumn Maple (Sep - Nov)">Autumn Gold (Sep - Nov)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 rounded-2xl bg-[#111439] hover:bg-[#1a205a] dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-black font-black text-xs uppercase tracking-widest shadow-xl shadow-[#111439]/20 transition-all duration-300 hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Generate My Custom Package & Lead ID</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
              <p className="text-center text-[10px] text-slate-400 dark:text-white/40 mt-3">
                🔒 Zero spam guarantee. A unique lead will be generated with a senior local Kashmiri curator.
              </p>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* STAGE 2: Progressive Profiling — Duration, Party Size & Comfort */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="p-8 space-y-6 relative z-10 animate-fade-in">
            <div className="space-y-6">
              
              {/* Adults & Children Counters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-black uppercase tracking-wider text-[#111439] dark:text-white">Adults</span>
                    <span className="text-[10px] text-slate-400">Ages 12+</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setProfileForm(p => ({ ...p, adultsCount: Math.max(1, p.adultsCount - 1) }))}
                      className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/20 bg-white dark:bg-black flex items-center justify-center font-black text-sm"
                    >
                      -
                    </button>
                    <span className="text-base font-black w-5 text-center">{profileForm.adultsCount}</span>
                    <button
                      type="button"
                      onClick={() => setProfileForm(p => ({ ...p, adultsCount: Math.min(20, p.adultsCount + 1) }))}
                      className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/20 bg-white dark:bg-black flex items-center justify-center font-black text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-black uppercase tracking-wider text-[#111439] dark:text-white">Children</span>
                    <span className="text-[10px] text-slate-400">Below 12 years</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setProfileForm(p => ({ ...p, childrenCount: Math.max(0, p.childrenCount - 1) }))}
                      className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/20 bg-white dark:bg-black flex items-center justify-center font-black text-sm"
                    >
                      -
                    </button>
                    <span className="text-base font-black w-5 text-center">{profileForm.childrenCount}</span>
                    <button
                      type="button"
                      onClick={() => setProfileForm(p => ({ ...p, childrenCount: Math.min(10, p.childrenCount + 1) }))}
                      className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/20 bg-white dark:bg-black flex items-center justify-center font-black text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Number of Nights & Arrival Hub */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/60">
                    Number of Nights
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[3, 5, 7, 9].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setProfileForm({ ...profileForm, nightsCount: n })}
                        className={cn(
                          "py-3 rounded-xl text-xs font-black transition-all border text-center",
                          profileForm.nightsCount === n
                            ? "bg-[#111439] text-white border-[#111439] dark:bg-amber-400 dark:text-black"
                            : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/70 hover:border-slate-300"
                        )}
                      >
                        {n}N / {n + 1}D
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/60">
                    Arrival City / Transit Hub
                  </label>
                  <select
                    value={profileForm.arrivalCity}
                    onChange={e => setProfileForm({ ...profileForm, arrivalCity: e.target.value })}
                    className="w-full h-12 px-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-[#111439] dark:text-white focus:outline-none focus:bg-white cursor-pointer"
                  >
                    {ARRIVAL_CITIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Travel Style */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/60">
                  Preferred Travel Style
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {TRAVEL_STYLES.map(style => {
                    const active = profileForm.travelStyle === style.id;
                    const Icon = style.icon;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setProfileForm({ ...profileForm, travelStyle: style.id })}
                        className={cn(
                          "p-3 rounded-2xl border text-left flex items-start gap-3 transition-all",
                          active
                            ? "border-[#111439] bg-[#111439]/5 dark:border-amber-400 dark:bg-amber-400/10 shadow-sm"
                            : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:border-slate-300"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
                          active ? "bg-[#111439] text-white dark:bg-amber-400 dark:text-black" : "bg-white dark:bg-white/10 text-amber-600"
                        )}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase text-[#111439] dark:text-white leading-tight">{style.label}</p>
                          <p className="text-[10px] text-slate-500 dark:text-white/40 mt-0.5 truncate">{style.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Budget Tier */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/60">
                  Expected Budget Range
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {BUDGET_RANGES.map(b => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setProfileForm({ ...profileForm, budgetRange: b.id })}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all",
                        profileForm.budgetRange === b.id
                          ? "border-[#111439] bg-[#111439]/5 dark:border-amber-400 dark:bg-amber-400/10 shadow-sm"
                          : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:border-slate-300"
                      )}
                    >
                      <p className="text-xs font-black uppercase text-[#111439] dark:text-white">{b.label}</p>
                      <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">{b.desc}</p>
                      <p className="text-[9px] text-slate-400 dark:text-white/40 mt-0.5">{b.star}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 2 Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="h-12 px-6 rounded-xl border-slate-200 dark:border-white/10 text-xs font-black uppercase"
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 h-12 rounded-xl bg-[#111439] hover:bg-[#1c225a] dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-black font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"
              >
                <span>Continue to Offbeat & Transport</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 3: Offbeat Desires, Transportation & Past Visits */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="p-8 space-y-6 relative z-10 animate-fade-in">
            <div className="space-y-6">
              
              {/* Offbeat Destinations Question */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/60">
                  Do you want to include offbeat Kashmir destinations?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {OFFBEAT_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setProfileForm({ ...profileForm, wantOffbeat: opt.id })}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all",
                        profileForm.wantOffbeat === opt.id
                          ? "border-[#111439] bg-[#111439]/5 dark:border-amber-400 dark:bg-amber-400/10 shadow-sm"
                          : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:border-slate-300"
                      )}
                    >
                      <p className="text-xs font-black uppercase text-[#111439] dark:text-white">{opt.label}</p>
                      <p className="text-[10px] text-slate-500 dark:text-white/40 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Transportation Preference */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/60">
                  Dedicated Transportation Preference
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {TRANSPORT_OPTIONS.map(trans => (
                    <button
                      key={trans.id}
                      type="button"
                      onClick={() => setProfileForm({ ...profileForm, transportPreference: trans.id })}
                      className={cn(
                        "p-3 rounded-xl border text-left flex items-start gap-3 transition-all",
                        profileForm.transportPreference === trans.id
                          ? "border-[#111439] bg-[#111439]/5 dark:border-amber-400 dark:bg-amber-400/10 shadow-sm"
                          : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:border-slate-300"
                      )}
                    >
                      <Car className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase text-[#111439] dark:text-white leading-tight">{trans.label}</p>
                        <p className="text-[10px] text-slate-500 dark:text-white/40 mt-0.5 truncate">{trans.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Past Visits & Accommodation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/60">
                    Have you visited Kashmir before?
                  </label>
                  <select
                    value={profileForm.placesVisited}
                    onChange={e => setProfileForm({ ...profileForm, placesVisited: e.target.value })}
                    className="w-full h-12 px-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-[#111439] dark:text-white focus:outline-none focus:bg-white cursor-pointer"
                  >
                    <option value="First Time in Kashmir">First Time in Kashmir</option>
                    <option value="Visited Srinagar & Gulmarg Before">Visited Srinagar & Gulmarg Before</option>
                    <option value="Frequent Kashmir Traveler">Frequent Kashmir Traveler</option>
                    <option value="Visited Only Ladakh / Jammu">Visited Ladakh or Jammu Only</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/60">
                    Preferred Accommodation Class
                  </label>
                  <select
                    value={profileForm.preferredAccommodation}
                    onChange={e => setProfileForm({ ...profileForm, preferredAccommodation: e.target.value })}
                    className="w-full h-12 px-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-[#111439] dark:text-white focus:outline-none focus:bg-white cursor-pointer"
                  >
                    <option value="4-Star Boutique & Heritage Houseboat">4-Star Boutique + Heritage Houseboat</option>
                    <option value="5-Star Ultra Luxury (Khyber / Taj / Lalit)">5-Star Ultra Luxury (Khyber / Taj)</option>
                    <option value="3-Star Comfort Chalets">3-Star Comfort Chalets</option>
                    <option value="Luxury Alpine Houseboats Only">Luxury Alpine Houseboats Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Step 3 Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                className="h-12 px-6 rounded-xl border-slate-200 dark:border-white/10 text-xs font-black uppercase"
              >
                Back
              </Button>
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={handleEnrichSubmit}
                className="flex-1 h-12 rounded-xl bg-[#111439] hover:bg-[#1c225a] dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-black font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Complete Custom Curation</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 4: Confirmation & Instant WhatsApp / Local Expert Hand-Off */}
        {/* ========================================================================= */}
        {step === 4 && (
          <div className="p-8 text-center space-y-6 relative z-10 animate-fade-in">
            {/* Animated Celebration Badge */}
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-600 animate-in zoom-in-50 duration-500 shadow-xl shadow-emerald-500/10">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">
                Lead Registered Successfully
              </span>
              <h3 className="text-3xl font-black uppercase tracking-tight text-[#111439] dark:text-white">
                Bespoke Curation <span className="text-amber-600 dark:text-amber-400">Initiated</span>
              </h3>
              <p className="text-xs text-[#4A5568] dark:text-white/60 max-w-md mx-auto leading-relaxed">
                Your travel profile has been algorithmically scored and prioritized with our senior ground operations team.
              </p>
            </div>

            {/* Lead Summary Ticket */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-left max-w-md mx-auto space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/60">Unique Lead ID</span>
                <span className="font-mono text-sm font-black text-[#111439] dark:text-white bg-white dark:bg-black px-3 py-1 rounded-lg border border-slate-200 dark:border-white/10">
                  {createdLead?.leadId || 'KC-2026-ACTIVE'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/60">Category Segment</span>
                <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                  {(createdLead?.leadCategory || 'BESPOKE_KASHMIR_TOUR').replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/60">Lead Score</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-black">
                  <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                  {createdLead?.leadScore || 85}/100 ({createdLead?.sentiment || 'Hot'} Priority)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/60">Assigned Expert</span>
                <span className="text-xs font-bold text-[#111439] dark:text-white">
                  Kashmir Senior Concierge
                </span>
              </div>
            </div>

            {/* Direct WhatsApp Call to Action */}
            <div className="space-y-3 pt-2 max-w-md mx-auto">
              <a
                href={`https://wa.me/919103798448?text=${encodeURIComponent(
                  `Hello Kashmir Curators! I just created my travel profile with Lead ID: ${createdLead?.leadId || 'NEW'}. Category: ${(createdLead?.leadCategory || '').replace(/_/g, ' ')}. Please connect me with my assigned local expert.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-14 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-[#25D366]/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
              >
                <MessageCircle className="w-5 h-5 fill-white text-transparent" />
                <span>Chat on WhatsApp with Lead ID</span>
              </a>

              <Button
                type="button"
                variant="ghost"
                onClick={closeLeadModal}
                className="w-full text-xs font-black uppercase tracking-widest text-slate-500 hover:text-[#111439] dark:hover:text-white"
              >
                Done & Return to Website
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
