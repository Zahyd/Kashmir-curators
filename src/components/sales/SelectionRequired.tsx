import React, { useState } from 'react';
import { Search, Zap, ArrowRight, MessageSquare, PlusCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';
import { cn } from '@/lib/utils';

interface SelectionRequiredProps {
  title: string;
  description: string;
  icon: any;
  inquiries: any[];
  onSelect: (inquiry: any) => void;
  teamUser?: any;
}

export default function SelectionRequired({ title, description, icon: Icon, inquiries, onSelect, teamUser }: SelectionRequiredProps) {
  const activeLeads = inquiries.filter(inq => inq.status !== 'Lost' && inq.status !== 'Booked');

  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customForm, setCustomForm] = useState({
    customerName: '',
    email: '',
    phone: '',
    destination: 'Kashmir',
    duration: '6 Days',
    travelers: '2',
    budget: 'Premium',
    accommodation: 'Premium Hotel'
  });

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingCustom(true);

    try {
      const token = localStorage.getItem('teamToken');
      
      // 1. Create Inquiry
      const response = await fetch(`${API_BASE_URL}/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customerName: customForm.customerName,
          email: customForm.email,
          phone: customForm.phone,
          destination: customForm.destination,
          duration: customForm.duration,
          travelers: customForm.travelers,
          budget: customForm.budget,
          accommodation: customForm.accommodation
        })
      });

      if (!response.ok) throw new Error('Failed to create custom package lead');
      const newInq = await response.json();

      // 2. Assign to current agent if teamUser is provided
      if (teamUser?.code) {
        const assignResponse = await fetch(`${API_BASE_URL}/inquiries/${newInq.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            assignedTo: teamUser.code,
            status: 'Pending Curation'
          })
        });

        if (assignResponse.ok) {
          const updatedInq = await assignResponse.json();
          toast.success('Custom itinerary inquiry created & assigned successfully!');
          setIsCustomModalOpen(false);
          onSelect(updatedInq); // Go directly to builder
          return;
        }
      }

      toast.success('Custom itinerary inquiry created successfully!');
      setIsCustomModalOpen(false);
      onSelect(newInq); // Go directly to builder
    } catch (error) {
      console.error(error);
      toast.error('Failed to create customized package.');
    } finally {
      setIsCreatingCustom(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 md:py-20 animate-in fade-in slide-in-from-bottom-8 duration-700 px-4 md:px-0">
      <div className="text-center mb-16">
        <div 
          onClick={() => {
            if (title === 'Itinerary Builder') {
              setIsCustomModalOpen(true);
            }
          }}
          className={cn(
            "w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8 shadow-2xl transition-all duration-500",
            title === 'Itinerary Builder' ? "cursor-pointer hover:bg-kashmir-gold/10 hover:border-kashmir-gold/40 hover:scale-105 group" : ""
          )}
        >
          <Icon className={cn("w-10 h-10 text-kashmir-gold", title === 'Itinerary Builder' ? "group-hover:scale-110 transition-transform" : "")} />
        </div>
        <h2 className="text-4xl font-display font-bold text-white mb-4 tracking-tight">{title}</h2>
        <p className="text-white/40 text-lg max-w-xl mx-auto leading-relaxed">{description}</p>
        
        {title === 'Itinerary Builder' && (
          <Button 
            onClick={() => setIsCustomModalOpen(true)}
            className="mt-8 bg-kashmir-gold text-black hover:bg-amber-500 font-black px-8 py-6 rounded-2xl shadow-2xl shadow-kashmir-gold/10 transition-all duration-500 hover:scale-[1.02] gap-3"
          >
            <PlusCircle className="w-5 h-5" />
            <span className="text-xs uppercase tracking-widest font-black">Create Custom Package</span>
          </Button>
        )}
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-4 h-4 text-kashmir-gold" />
            Quick Select Active Lead
          </h3>
          <Badge className="bg-white/5 text-white/30 border-none font-bold uppercase tracking-widest text-[9px]">
            {activeLeads.length} Available
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {activeLeads.length > 0 ? (
            activeLeads.slice(0, 5).map((inq) => (
              <Card 
                key={inq.id}
                onClick={() => onSelect(inq)}
                className="group bg-white/[0.03] border-white/5 p-4 md:p-6 rounded-[2rem] hover:bg-white/[0.06] hover:border-kashmir-gold/30 transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 md:gap-6 min-w-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform shrink-0">
                    {inq.customerName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-white group-hover:text-kashmir-gold transition-colors truncate">{inq.customerName}</h4>
                    <p className="text-[9px] md:text-[10px] text-white/20 uppercase tracking-widest mt-0.5 truncate">{inq.id} • {inq.destination}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden md:block">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Status</p>
                    <Badge variant="outline" className="bg-white/5 border-white/10 text-white/40 text-[9px] uppercase tracking-widest">{inq.status}</Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl text-white/20 group-hover:text-kashmir-gold group-hover:bg-kashmir-gold/10 transition-all">
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <div className="py-20 flex flex-col items-center justify-center bg-white/[0.02] border-2 border-dashed border-white/5 rounded-[3rem]">
              <MessageSquare className="w-10 h-10 text-white/10 mb-4" />
              <p className="text-white/20 font-bold uppercase tracking-widest text-xs mb-6">No Active Leads Found</p>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()} 
                className="bg-white/5 border-white/10 text-kashmir-gold hover:bg-kashmir-gold hover:text-black rounded-xl font-bold text-[10px] uppercase tracking-widest px-8"
              >
                Refresh Cloud Queue
              </Button>
            </div>
          )}
        </div>

        <div className="pt-8 text-center">
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">
            Tip: Select a lead from the <span className="text-kashmir-gold">Live Queue</span> to start building
          </p>
        </div>
      </div>

      {/* Custom Package Form Modal */}
      {isCustomModalOpen && (
        <Dialog open={isCustomModalOpen} onOpenChange={setIsCustomModalOpen}>
          <DialogContent className="max-w-2xl bg-[#0a0f12]/95 backdrop-blur-3xl border-white/5 text-white p-12 overflow-hidden rounded-[3rem] shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="absolute top-0 right-0 w-64 h-64 bg-kashmir-gold/5 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
            
            <div className="text-center mb-8">
              <Badge className="bg-kashmir-gold/10 text-kashmir-gold border-none px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] mb-4">
                Manual Inquiry Configuration
              </Badge>
              <h2 className="text-3xl font-display font-black text-white leading-tight">Create <span className="text-kashmir-gold">Customized</span> Package</h2>
            </div>

            <form onSubmit={handleCustomSubmit} className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Customer Name</label>
                  <Input 
                    required 
                    value={customForm.customerName}
                    onChange={(e) => setCustomForm({...customForm, customerName: e.target.value})}
                    placeholder="Jane Doe" 
                    className="bg-white/[0.02] border-white/5 text-white placeholder:text-white/10 rounded-xl focus:ring-kashmir-gold/20 text-sm focus:border-kashmir-gold/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Email Address</label>
                  <Input 
                    type="email"
                    required
                    value={customForm.email}
                    onChange={(e) => setCustomForm({...customForm, email: e.target.value})}
                    placeholder="jane@example.com" 
                    className="bg-white/[0.02] border-white/5 text-white placeholder:text-white/10 rounded-xl focus:ring-kashmir-gold/20 text-sm focus:border-kashmir-gold/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Phone Number</label>
                  <Input 
                    required 
                    value={customForm.phone}
                    onChange={(e) => setCustomForm({...customForm, phone: e.target.value})}
                    placeholder="+91 98765 43210" 
                    className="bg-white/[0.02] border-white/5 text-white placeholder:text-white/10 rounded-xl focus:ring-kashmir-gold/20 text-sm focus:border-kashmir-gold/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Destination</label>
                  <select 
                    value={customForm.destination}
                    onChange={(e) => setCustomForm({...customForm, destination: e.target.value})}
                    className="w-full h-10 px-3 rounded-xl bg-[#0c1216] border border-white/5 text-white text-sm focus:ring-kashmir-gold/20 focus:border-kashmir-gold/20"
                  >
                    <option value="Kashmir">Kashmir (General)</option>
                    <option value="Srinagar & Gulmarg">Srinagar & Gulmarg</option>
                    <option value="Pahalgam & Sonamarg">Pahalgam & Sonamarg</option>
                    <option value="Leh Ladakh">Leh Ladakh</option>
                    <option value="Complete Kashmir Valley">Complete Kashmir Valley</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Duration</label>
                  <select 
                    value={customForm.duration}
                    onChange={(e) => setCustomForm({...customForm, duration: e.target.value})}
                    className="w-full h-10 px-3 rounded-xl bg-[#0c1216] border border-white/5 text-white text-sm focus:ring-kashmir-gold/20 focus:border-kashmir-gold/20"
                  >
                    <option value="4 Days">4 Days (3 Nights)</option>
                    <option value="5 Days">5 Days (4 Nights)</option>
                    <option value="6 Days">6 Days (5 Nights)</option>
                    <option value="7 Days">7 Days (6 Nights)</option>
                    <option value="8 Days">8 Days (7 Nights)</option>
                    <option value="9 Days">9 Days (8 Nights)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Travelers</label>
                  <Input 
                    type="number"
                    min="1"
                    required
                    value={customForm.travelers}
                    onChange={(e) => setCustomForm({...customForm, travelers: e.target.value})}
                    className="bg-white/[0.02] border-white/5 text-white rounded-xl focus:ring-kashmir-gold/20 text-sm focus:border-kashmir-gold/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Budget Tier</label>
                  <select 
                    value={customForm.budget}
                    onChange={(e) => setCustomForm({...customForm, budget: e.target.value})}
                    className="w-full h-10 px-3 rounded-xl bg-[#0c1216] border border-white/5 text-white text-sm focus:ring-kashmir-gold/20 focus:border-kashmir-gold/20"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                    <option value="Luxury">Luxury</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Accommodation</label>
                <select 
                  value={customForm.accommodation}
                  onChange={(e) => setCustomForm({...customForm, accommodation: e.target.value})}
                  className="w-full h-10 px-3 rounded-xl bg-[#0c1216] border border-white/5 text-white text-sm focus:ring-kashmir-gold/20 focus:border-kashmir-gold/20"
                >
                  <option value="Standard Hotel">Standard Hotels</option>
                  <option value="Premium Hotel">Premium Hotels</option>
                  <option value="Luxury Resort">Luxury Resorts</option>
                  <option value="Houseboat & Hotel">Houseboat & Hotel Mix</option>
                </select>
              </div>

              <div className="flex gap-4 pt-6">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsCustomModalOpen(false)} 
                  className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isCreatingCustom}
                  className="flex-[2] h-14 rounded-2xl bg-kashmir-gold text-black hover:bg-amber-500 font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-kashmir-gold/20"
                >
                  {isCreatingCustom ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Configuring...</span>
                    </div>
                  ) : (
                    <span>Launch Builder</span>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
