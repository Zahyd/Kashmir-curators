import React, { useState } from 'react';
import { 
  Compass, 
  Calendar, 
  MapPin, 
  Users, 
  Building, 
  Car, 
  FileText, 
  MessageSquare, 
  Download, 
  ArrowRight, 
  ChevronRight, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Send,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { CustomerInquiry } from '../types';

interface CustomProposalsDeskProps {
  inquiries: CustomerInquiry[];
  onUpdateInquiryFeedback: (inquiryId: string, feedback: string) => Promise<boolean>;
  onNavigateToConcierge: (contextMsg?: string) => void;
}

export const CustomProposalsDesk: React.FC<CustomProposalsDeskProps> = ({
  inquiries,
  onUpdateInquiryFeedback,
  onNavigateToConcierge
}) => {
  const [selectedInquiry, setSelectedInquiry] = useState<CustomerInquiry | null>(null);
  const [itineraryDays, setItineraryDays] = useState<any[]>([]);
  const [activeDayNumber, setActiveDayNumber] = useState(1);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterTab, setFilterTab] = useState<'ALL' | 'READY' | 'CURATING' | 'BOOKED'>('ALL');

  const filteredInquiries = inquiries.filter(inq => {
    if (filterTab === 'READY' && inq.status !== 'Ready for Review') return false;
    if (filterTab === 'CURATING' && inq.status !== 'Pending Curation' && inq.status !== 'New') return false;
    if (filterTab === 'BOOKED' && inq.status !== 'Booked') return false;
    return true;
  });

  const handleOpenItinerary = (inq: CustomerInquiry) => {
    setSelectedInquiry(inq);
    setFeedbackInput(inq.feedback || '');

    // Parse quoteData days if available, else generate structured schedule
    let parsedDays: any[] = [];
    if (inq.quoteData) {
      try {
        const parsed = JSON.parse(inq.quoteData);
        if (Array.isArray(parsed.days)) {
          parsedDays = parsed.days;
        } else if (Array.isArray(parsed)) {
          parsedDays = parsed;
        }
      } catch (e) {
        console.warn('Failed to parse quoteData JSON');
      }
    }

    if (parsedDays.length === 0) {
      // Graceful fallback days based on duration
      const totalDays = parseInt(inq.duration) || 5;
      parsedDays = Array.from({ length: totalDays }, (_, i) => ({
        day: i + 1,
        title: i === 0 ? `Arrival in Srinagar & Dal Lake Shikara` :
               i === 1 ? `Srinagar Mughal Gardens & Heritage Old City` :
               i === 2 ? `Gulmarg Alpine Meadow & Gondola Summit` :
               i === 3 ? `Pahalgam Lidder Valley & Pine Forest Trails` :
               `Departure & Souvenir Curations`,
        activities: `Curated bespoke exploration of ${inq.destination || 'Kashmir'} featuring scenic mountain transfers, local Kehwa refreshments, and certified travel coordinators.`,
        hotelName: inq.accommodation || 'Selected 5-Star Heritage Estate',
        roomType: 'Deluxe Peak View Chalet',
        mealPlan: 'MAP (Breakfast + Dinner)',
        transport: 'Private Toyota Innova Crysta with Chauffeur'
      }));
    }

    setItineraryDays(parsedDays);
    setActiveDayNumber(1);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry || !feedbackInput.trim()) return;

    setIsSubmitting(true);
    const success = await onUpdateInquiryFeedback(selectedInquiry.id, feedbackInput.trim());
    setIsSubmitting(false);

    if (success) {
      setSelectedInquiry(prev => prev ? { ...prev, feedback: feedbackInput.trim() } : null);
      toast.success('Your feedback has been submitted to the lead curator!');
    }
  };

  const activeDay = itineraryDays.find(d => d.day === activeDayNumber) || itineraryDays[0];

  return (
    <div className="space-y-6 text-left animate-fade-in">
      
      {/* Header & Controls */}
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-black text-white">Custom Proposals & Quotations</h2>
            <p className="text-xs text-white/50">
              Personalized luxury itineraries architected by our local Kashmiri ground curators for your review.
            </p>
          </div>

          <Button
            onClick={() => window.location.href = '/planner'}
            className="rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 gap-1.5 shadow-md self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4" />
            <span>+ Request New Proposal</span>
          </Button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-white/10 pt-3">
          {[
            { id: 'ALL', label: `All Proposals (${inquiries.length})` },
            { id: 'READY', label: `Ready for Review (${inquiries.filter(i => i.status === 'Ready for Review').length})` },
            { id: 'CURATING', label: `Pending Curation (${inquiries.filter(i => i.status === 'Pending Curation' || i.status === 'New').length})` },
            { id: 'BOOKED', label: `Booked / Locked (${inquiries.filter(i => i.status === 'Booked').length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                filterTab === tab.id
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 border border-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Proposals Cards List */}
      {filteredInquiries.length === 0 ? (
        <div className="bg-slate-900/60 border border-dashed border-white/15 p-12 rounded-3xl text-center space-y-3">
          <Compass className="w-12 h-12 text-white/20 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Proposals Found</h3>
          <p className="text-xs text-white/50 max-w-sm mx-auto">
            You don't have any bespoke trip proposals in this stage. Click below to craft a tailored itinerary.
          </p>
          <Button
            onClick={() => window.location.href = '/planner'}
            className="rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 mt-2"
          >
            Curate Custom Trip
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredInquiries.map(inq => {
            const isReady = inq.status === 'Ready for Review';
            const isBooked = inq.status === 'Booked';

            return (
              <div 
                key={inq.id}
                className="bg-slate-900/80 border border-white/10 hover:border-amber-500/40 rounded-3xl p-5 sm:p-6 space-y-4 transition-all shadow-md flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-3">
                    <div>
                      <span className="text-[10px] font-mono text-amber-400 uppercase font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                        PROPOSAL #{inq.id.toUpperCase().slice(0, 8)}
                      </span>
                      <h3 className="font-display text-lg font-bold text-white mt-1.5">{inq.destination} Escape</h3>
                    </div>

                    <Badge className={`text-[10px] font-black uppercase ${
                      isReady ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 animate-pulse' :
                      isBooked ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' :
                      'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {inq.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-white/[0.02] border border-white/5 p-2.5 rounded-xl">
                      <span className="text-[10px] text-white/40 block font-bold">Duration</span>
                      <span className="font-semibold text-white">{inq.duration} Days</span>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-2.5 rounded-xl">
                      <span className="text-[10px] text-white/40 block font-bold">Travelers</span>
                      <span className="font-semibold text-white">{inq.travelers} Guests</span>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-2.5 rounded-xl col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-white/40 block font-bold">Budget Tier</span>
                      <span className="font-semibold text-amber-400">{inq.budget}</span>
                    </div>
                  </div>

                  {inq.feedback && (
                    <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs">
                      <span className="text-[10px] font-bold text-amber-400 block mb-0.5">Your Feedback to Curator:</span>
                      <p className="text-white/70 italic">"{inq.feedback}"</p>
                    </div>
                  )}
                </div>

                {/* Card Action Row */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/5">
                  <Button
                    size="sm"
                    onClick={() => handleOpenItinerary(inq)}
                    className="flex-1 h-9 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 gap-1.5 shadow-sm"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Inspect Daily Route</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onNavigateToConcierge(`Hello, I'd like to discuss my custom proposal #${inq.id.slice(0, 8)} for ${inq.destination}.`)}
                    className="h-9 px-3 rounded-xl text-xs font-bold border-white/15 hover:bg-white/10 text-white gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                    <span>Chat Curator</span>
                  </Button>

                  {inq.proposalUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(inq.proposalUrl, '_blank')}
                      className="h-9 px-3 rounded-xl text-xs font-bold border-white/15 hover:bg-white/10 text-white"
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Day-by-Day Itinerary Viewer Dialog */}
      <Dialog open={!!selectedInquiry} onOpenChange={(open) => !open && setSelectedInquiry(null)}>
        {selectedInquiry && (
          <DialogContent className="rounded-3xl bg-slate-950 text-white border-white/10 shadow-2xl p-6 sm:p-8 max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="text-left border-b border-white/10 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <DialogTitle className="font-display text-2xl text-white">
                  {selectedInquiry.destination} Custom Curation
                </DialogTitle>
                <Badge variant="outline" className="text-amber-400 border-amber-500/40 text-xs">
                  {selectedInquiry.duration} Days • {selectedInquiry.travelers} Guests
                </Badge>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
              
              {/* Left Column: Day Route Selector */}
              <div className="space-y-2 lg:border-r border-white/10 lg:pr-4 max-h-[400px] overflow-y-auto scrollbar-thin">
                <span className="text-[10px] font-black uppercase text-white/40 tracking-widest block mb-2">
                  Daily Journey Map
                </span>
                {itineraryDays.map(d => (
                  <button
                    key={d.day}
                    onClick={() => setActiveDayNumber(d.day)}
                    className={`w-full p-3 rounded-2xl text-left border transition-all flex items-center justify-between ${
                      activeDayNumber === d.day
                        ? 'bg-amber-500 text-slate-950 font-black border-amber-500 shadow-md'
                        : 'bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <span className={`text-[10px] uppercase font-bold block ${activeDayNumber === d.day ? 'text-slate-950' : 'text-amber-400'}`}>
                        Day {d.day}
                      </span>
                      <h4 className="text-xs font-bold truncate max-w-[170px] mt-0.5">{d.title}</h4>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 ${activeDayNumber === d.day ? 'text-slate-950' : 'opacity-40'}`} />
                  </button>
                ))}
              </div>

              {/* Right Column: Active Day Plan Details & Feedback Loop */}
              <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
                {activeDay && (
                  <div className="space-y-5 animate-fade-in text-left">
                    <div>
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] font-black uppercase mb-2">
                        Day {activeDay.day} Expedition
                      </Badge>
                      <h3 className="font-display text-2xl font-black text-white">{activeDay.title}</h3>
                      <p className="text-xs text-white/70 mt-2 leading-relaxed whitespace-pre-wrap">
                        {activeDay.activities}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-white/10">
                      <div className="bg-black/40 border border-white/10 p-3.5 rounded-2xl">
                        <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5 mb-1">
                          <Building className="w-3.5 h-3.5" />
                          <span>Curated Estate</span>
                        </span>
                        <h5 className="font-bold text-white text-xs truncate">{activeDay.hotelName}</h5>
                        <p className="text-[10px] text-white/50 mt-0.5">{activeDay.roomType} • {activeDay.mealPlan}</p>
                      </div>

                      <div className="bg-black/40 border border-white/10 p-3.5 rounded-2xl">
                        <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5 mb-1">
                          <Car className="w-3.5 h-3.5" />
                          <span>Chauffeur Transit</span>
                        </span>
                        <h5 className="font-bold text-white text-xs truncate">{activeDay.transport}</h5>
                        <p className="text-[10px] text-white/50 mt-0.5">Licensed Mountain Driver Included</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Feedback Form */}
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <span className="text-[11px] font-bold text-white/80 block">
                    Request Itinerary Modification (Feedback Loop):
                  </span>
                  <form onSubmit={handleFeedbackSubmit} className="flex gap-2">
                    <Input
                      placeholder="e.g. Can we change Day 3 hotel to a heritage houseboat on Nigeen Lake?..."
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      className="bg-black/40 border-white/10 h-10 rounded-xl text-xs text-white placeholder:text-white/30"
                    />
                    <Button
                      type="submit"
                      disabled={isSubmitting || !feedbackInput.trim()}
                      className="h-10 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shrink-0 gap-1.5"
                    >
                      {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Submit</span>
                    </Button>
                  </form>
                </div>
              </div>

            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedInquiry(null)}
                className="w-full rounded-xl border-white/10 text-white"
              >
                Close Itinerary
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

    </div>
  );
};

export default CustomProposalsDesk;
