import React, { useState } from 'react';
import { 
  X, Phone, Clock, User, CheckCircle2, MessageCircle, 
  Loader2, ShieldCheck, Sparkles, Headphones 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useLeadCapture } from '@/contexts/LeadCaptureContext';
import { API_BASE_URL } from '@/lib/api';
import { toast } from 'sonner';

export default function CallbackRequestModal() {
  const { isCallbackModalOpen, callbackModalOptions, closeCallbackModal } = useLeadCapture();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredTime, setPreferredTime] = useState('Within 15 Minutes');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLead, setSubmittedLead] = useState<any>(null);

  if (!isCallbackModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      toast.error('Please provide your phone number for the callback.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/inquiries/callback-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name || 'VIP Callback Requester',
          phone,
          preferredTime,
          intentQuery: callbackModalOptions.intent || 'Direct Phone Consultation Request',
          notes
        })
      });

      const data = await res.json();
      if (res.ok && data.lead) {
        setSubmittedLead(data.lead);
        toast.success('Callback requested! A local Kashmir expert will call you shortly.');
      } else {
        toast.error(data.error || 'Failed to dispatch callback request.');
      }
    } catch (err) {
      console.error('Callback error:', err);
      toast.error('Network connection issue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmittedLead(null);
    setName('');
    setPhone('');
    setNotes('');
    closeCallbackModal();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#070b0e]/80 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
        onClick={handleClose}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0c1216] border border-slate-200 dark:border-white/10 rounded-3xl sm:rounded-[2.5rem] shadow-2xl z-10 overflow-hidden text-[#111439] dark:text-white my-auto max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-[#111439] dark:hover:text-white transition-all hover:scale-105 active:scale-95 z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {!submittedLead ? (
          <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-4 sm:space-y-6 relative z-10 overflow-y-auto max-h-[calc(92vh-120px)]">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest mb-3">
                <Headphones className="w-3 h-3 text-amber-600" /> Instant Local Expert Liaison
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-[#111439] dark:text-white">
                Request an <span className="text-amber-600 dark:text-amber-400">Instant Callback</span>
              </h3>
              <p className="text-xs text-[#4A5568] dark:text-white/60 mt-1">
                Skip the forms. Leave your phone number and our senior Kashmir travel curator will call you directly to design your trip.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/60">
                  Your Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="e.g. Priya Patel"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="h-12 pl-11 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-[#111439] dark:text-white focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/60 flex items-center justify-between">
                  <span>Phone / Mobile Number</span>
                  <span className="text-amber-600 font-bold">*Required</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                  <Input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="h-12 pl-11 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl text-xs font-black text-[#111439] dark:text-white focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/60">
                  Preferred Call Time Window
                </label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                  <select
                    value={preferredTime}
                    onChange={e => setPreferredTime(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-[#111439] dark:text-white focus:outline-none focus:bg-white cursor-pointer"
                  >
                    <option value="Within 15 Minutes">🔥 Urgent: Within 15 Minutes</option>
                    <option value="Today Afternoon (1 PM - 4 PM)">Today Afternoon (1 PM - 4 PM)</option>
                    <option value="Today Evening (5 PM - 8 PM)">Today Evening (5 PM - 8 PM)</option>
                    <option value="Tomorrow Morning (10 AM - 1 PM)">Tomorrow Morning (10 AM - 1 PM)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/60">
                  Any Specific Question or Destination in Mind?
                </label>
                <Textarea
                  rows={2}
                  placeholder="e.g. Planning a 5-day honeymoon in Gulmarg & Pahalgam with snow activities..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium text-[#111439] dark:text-white focus:bg-white resize-none"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 rounded-2xl bg-[#111439] hover:bg-[#1a205a] dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-black font-black text-xs uppercase tracking-widest shadow-xl transition-all duration-300 hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Phone className="w-4 h-4" />
                  <span>Request Callback Now</span>
                </>
              )}
            </Button>
          </form>
        ) : (
          <div className="p-8 text-center space-y-6 relative z-10 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-600 shadow-xl shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Hot Callback Dispatched</span>
              <h3 className="text-2xl font-black uppercase tracking-tight text-[#111439] dark:text-white">
                We're Preparing <span className="text-amber-600 dark:text-amber-400">Your Call</span>
              </h3>
              <p className="text-xs text-[#4A5568] dark:text-white/60">
                A senior destination specialist will call <span className="font-bold text-[#111439] dark:text-white">{phone}</span> {preferredTime.toLowerCase()}.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono font-bold flex justify-between items-center">
              <span className="text-[10px] uppercase font-sans text-slate-400">Lead ID</span>
              <span className="text-amber-600 dark:text-amber-400">{submittedLead.leadId}</span>
            </div>

            <div className="space-y-3 pt-2">
              <a
                href={`https://wa.me/919103798448?text=${encodeURIComponent(
                  `Hello! I just requested an instant callback on Kashmir Curators (Lead ID: ${submittedLead.leadId}). I need immediate assistance.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg"
              >
                <MessageCircle className="w-4 h-4 fill-white text-transparent" />
                <span>Need Answer Right Now? Chat on WhatsApp</span>
              </a>

              <Button
                variant="ghost"
                onClick={handleClose}
                className="w-full text-xs font-black uppercase tracking-widest text-slate-500 hover:text-[#111439] dark:hover:text-white"
              >
                Close Window
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
