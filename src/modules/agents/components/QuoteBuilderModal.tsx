import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  MapPin, 
  Calendar, 
  Car, 
  Hotel, 
  Sparkles, 
  Send, 
  Download, 
  Share2, 
  Check, 
  Percent, 
  ArrowRight,
  Eye,
  Building
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface QuoteBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadData?: any;
}

export const QuoteBuilderModal: React.FC<QuoteBuilderModalProps> = ({
  isOpen,
  onClose,
  leadData
}) => {
  const [customerName, setCustomerName] = useState(leadData?.customerName || 'Valued Traveler');
  const [phone, setPhone] = useState(leadData?.phone || '');
  const [duration, setDuration] = useState(leadData?.duration || '5 Nights / 6 Days');
  const [travelers, setTravelers] = useState(leadData?.travelers || '2 Adults');
  
  // Customization parameters
  const [hotelTier, setHotelTier] = useState('4_STAR');
  const [vehicleType, setVehicleType] = useState('INNOVA');
  const [includeHouseboat, setIncludeHouseboat] = useState(true);
  const [includeGondola, setIncludeGondola] = useState(true);
  const [markupPct, setMarkupPct] = useState(15); // 15% markup

  // Calculate pricing
  const baseWholesaleCosts: Record<string, number> = {
    '3_STAR': 24000,
    '4_STAR': 39000,
    '5_STAR': 72000,
  };

  const vehicleCosts: Record<string, number> = {
    'SEDAN': 12000,
    'INNOVA': 19500,
    'TEMPO': 32000,
  };

  const netCost = (baseWholesaleCosts[hotelTier] || 39000) 
    + (vehicleCosts[vehicleType] || 19500) 
    + (includeHouseboat ? 6500 : 0) 
    + (includeGondola ? 4000 : 0);

  const markupAmount = Math.round((netCost * markupPct) / 100);
  const finalClientPrice = netCost + markupAmount;

  const handleSendWhatsAppQuote = () => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const inquiryRef = leadData?.id || 'KC-QUOTE-' + Math.floor(1000 + Math.random() * 9000);
    const itineraryLink = `${window.location.origin}/itinerary/${inquiryRef}`;

    const message = encodeURIComponent(
      `🏔️ *EXCLUSIVE KASHMIR PROPOSAL* 🏔️\n` +
      `Prepared for: *${customerName}*\n` +
      `Duration: *${duration}* | Travelers: *${travelers}*\n\n` +
      `✨ *Package Highlights*:\n` +
      `• Premium Stays: ${hotelTier === '5_STAR' ? '5-Star Luxury Chalets' : hotelTier === '4_STAR' ? '4-Star Boutique Mountain Resorts' : '3-Star Premium Hotels'}\n` +
      `• Transit: ${vehicleType === 'INNOVA' ? 'Private Toyota Innova Crysta (Police Verified)' : 'Private Dedicated Vehicle'}\n` +
      (includeHouseboat ? `• Authentic Nigeen Lake Luxury Cedar Houseboat with Shikara transfer\n` : '') +
      (includeGondola ? `• Gulmarg Gondola Phase 1 & 2 Assistance\n` : '') +
      `• 24/7 Kashmir Ground Support & Trip Safety Shield\n\n` +
      `💰 *Total Package Price*: ₹${finalClientPrice.toLocaleString('en-IN')} (All-inclusive)\n\n` +
      `👉 *View Complete Interactive Itinerary, Hotels & Day-by-Day Route*:\n${itineraryLink}\n\n` +
      `Reply to this message to customize dates or confirm booking!`
    );

    window.open(`https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${message}`, '_blank');
    toast.success('Proposal drafted and opened in WhatsApp!');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-3xl p-6 bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">Kashmir Quote & Proposal Builder</DialogTitle>
              <DialogDescription>
                Build instant B2B itineraries with custom markups and 1-click WhatsApp dispatch.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 my-2">
          {/* Client summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/30 p-3.5 rounded-2xl border border-border/50">
            <div>
              <Label className="text-xs text-muted-foreground">Guest Name</Label>
              <Input 
                value={customerName} 
                onChange={(e) => setCustomerName(e.target.value)} 
                className="mt-1 h-8 rounded-lg text-xs" 
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">WhatsApp Number</Label>
              <Input 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="+91..."
                className="mt-1 h-8 rounded-lg text-xs" 
              />
            </div>
          </div>

          {/* Accommodation & Fleet Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Hotel className="w-3.5 h-3.5 text-primary" />
                Hotel Standard
              </Label>
              <Select value={hotelTier} onValueChange={setHotelTier}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3_STAR">3-Star Premium (₹24,000 net)</SelectItem>
                  <SelectItem value="4_STAR">4-Star Boutique Chalets (₹39,000 net)</SelectItem>
                  <SelectItem value="5_STAR">5-Star Luxury Resorts (₹72,000 net)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-primary" />
                Dedicated Transport
              </Label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEDAN">Etios / Dzire (₹12,000 net)</SelectItem>
                  <SelectItem value="INNOVA">Innova Crysta + Snow Chains (₹19,500 net)</SelectItem>
                  <SelectItem value="TEMPO">Tempo Traveller 12-Seater (₹32,000 net)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Addons */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Curated Inclusions</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-3 bg-muted/40 rounded-xl cursor-pointer hover:bg-muted/60 transition-colors border border-border/40">
                <input 
                  type="checkbox" 
                  checked={includeHouseboat} 
                  onChange={(e) => setIncludeHouseboat(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                <span className="text-xs font-medium">Nigeen Royal Houseboat Stay (+₹6,500)</span>
              </label>

              <label className="flex items-center gap-2 p-3 bg-muted/40 rounded-xl cursor-pointer hover:bg-muted/60 transition-colors border border-border/40">
                <input 
                  type="checkbox" 
                  checked={includeGondola} 
                  onChange={(e) => setIncludeGondola(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                <span className="text-xs font-medium">Gulmarg Gondola Pass Coord (+₹4,000)</span>
              </label>
            </div>
          </div>

          {/* Pricing & Markup Engine */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">Net Wholesale Cost:</span>
                <p className="font-bold text-foreground text-sm">₹{netCost.toLocaleString('en-IN')}</p>
              </div>

              <div className="text-right">
                <span className="text-xs text-muted-foreground">Your Markup ({markupPct}%):</span>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  + ₹{markupAmount.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-primary/20 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Final Client Quotation
                </span>
                <p className="text-2xl font-black text-primary">₹{finalClientPrice.toLocaleString('en-IN')}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Markup:</span>
                <div className="flex items-center gap-1">
                  {[10, 15, 20, 25].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setMarkupPct(pct)}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                        markupPct === pct 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-background border hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl text-xs">
            Cancel
          </Button>
          <Button 
            onClick={handleSendWhatsAppQuote} 
            className="rounded-xl text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Proposal via WhatsApp</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteBuilderModal;
