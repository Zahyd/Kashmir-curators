import React, { useState } from 'react';
import { 
  Sparkles, 
  MapPin, 
  Calendar, 
  Users, 
  Send, 
  Clock, 
  Check, 
  Car, 
  Hotel, 
  Flame, 
  ChevronRight, 
  Loader2,
  Share2,
  ExternalLink,
  Bot
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';

interface AiTripCuratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiTripCuratorModal: React.FC<AiTripCuratorModalProps> = ({
  isOpen,
  onClose
}) => {
  const [duration, setDuration] = useState('5 Days / 4 Nights');
  const [travelers, setTravelers] = useState('2 Adults (Honeymoon)');
  const [theme, setTheme] = useState('HONEYMOON');
  const [budgetTier, setBudgetTier] = useState('PREMIUM');
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);

  const handleCurate = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/ai/curate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration,
          travelers,
          theme,
          budgetTier,
          customNotes: notes
        })
      });

      if (!res.ok) {
        throw new Error('AI Curator failed');
      }

      const data = await res.json();
      setGeneratedPlan(data);
      toast.success('Bespoke Kashmir Itinerary Curated!', {
        description: `Generated via ${data.generatedVia === 'NEON_AI_GATEWAY' ? 'Neon AI Gateway' : 'Kashmir Expert Engine'}.`,
        icon: '✨'
      });
    } catch (err: any) {
      toast.error('Failed to generate AI plan. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!generatedPlan) return;
    const text = encodeURIComponent(
      `🏔️ *AI CURATED KASHMIR EXPEDITION* 🏔️\n` +
      `*${generatedPlan.packageName}*\n` +
      `Duration: ${duration} | Budget: ₹${generatedPlan.estimatedPrice.toLocaleString('en-IN')}\n\n` +
      generatedPlan.days.map((d: any) => `*Day ${d.day}: ${d.title}*\n• Stay: ${d.stayRecommendation}\n• Highlights: ${d.activities.slice(0, 2).join(', ')}`).join('\n\n') +
      `\n\n👉 Curated instantly on Kashmir Connect!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl rounded-3xl p-6 bg-card max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-primary/20 text-primary">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
                Kashmir AI Tour Curator
                <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-[10px]">
                  Neon AI Gateway
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Describe your dream Kashmir getaway. Our AI synthesizes real-time mountain conditions, road clearances, and luxury stays.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!generatedPlan ? (
          <div className="space-y-4 my-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Trip Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4 Days / 3 Nights">4 Days / 3 Nights (Quick Escape)</SelectItem>
                    <SelectItem value="5 Days / 4 Nights">5 Days / 4 Nights (Classic Kashmir)</SelectItem>
                    <SelectItem value="7 Days / 6 Nights">7 Days / 6 Nights (Grand Discovery)</SelectItem>
                    <SelectItem value="9 Days / 8 Nights">9 Days / 8 Nights (Offbeat & Gurez)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Travelers & Group</Label>
                <Input
                  value={travelers}
                  onChange={(e) => setTravelers(e.target.value)}
                  placeholder="e.g. 2 Adults (Honeymoon)"
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Holiday Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HONEYMOON">Honeymoon & Romantic Retreat</SelectItem>
                    <SelectItem value="FAMILY">Family Leisure & Meadows</SelectItem>
                    <SelectItem value="ADVENTURE_SKI">Winter Powder Skiing & Snow</SelectItem>
                    <SelectItem value="OFFBEAT_GUREZ">Gurez Valley & Alpine Lakes</SelectItem>
                    <SelectItem value="HERITAGE_CRAFT">Kashmiri Crafts & Sufi Heritage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Comfort Tier</Label>
                <Select value={budgetTier} onValueChange={setBudgetTier}>
                  <SelectTrigger className="rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STANDARD">Standard Boutique (3-Star)</SelectItem>
                    <SelectItem value="PREMIUM">Premium Mountain Chalets (4-Star)</SelectItem>
                    <SelectItem value="LUXURY">Luxury VIP Chalets & Royal Houseboats (5-Star)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Special Wishes (Optional)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. heated bed warmers, candle-light dinner, ski equipment"
                className="rounded-xl text-xs"
              />
            </div>

            <Button
              onClick={handleCurate}
              disabled={isLoading}
              className="w-full rounded-2xl h-12 text-sm font-bold gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/25"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Authentic Kashmir Route...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Curate Tailored Kashmir Itinerary with AI</span>
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-5 my-2">
            {/* Header Result */}
            <div className="p-4 bg-muted/40 rounded-2xl border border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <Badge className="bg-primary/20 text-primary border-none text-[10px] font-bold uppercase mb-1">
                  AI Synthesized Package
                </Badge>
                <h3 className="font-bold text-lg text-foreground">{generatedPlan.packageName}</h3>
                <p className="text-xs text-muted-foreground">
                  Estimated Total: <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{generatedPlan.estimatedPrice.toLocaleString('en-IN')}</span> (All-inclusive)
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setGeneratedPlan(null)}
                className="rounded-xl text-xs shrink-0"
              >
                Re-Curate
              </Button>
            </div>

            {/* Recommended Vehicle */}
            <div className="p-3 bg-muted/20 rounded-xl text-xs flex items-center gap-2 text-muted-foreground border border-border/40">
              <Car className="w-4 h-4 text-primary shrink-0" />
              <span>Recommended Transport: <strong className="text-foreground">{generatedPlan.recommendedVehicle}</strong></span>
            </div>

            {/* Days Accordion / List */}
            <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
              {generatedPlan.days.map((day: any) => (
                <div key={day.day} className="p-4 bg-card rounded-2xl border border-border/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-primary">Day {day.day} • {day.location}</span>
                    <Badge variant="outline" className="text-[10px]">{day.mealPlan}</Badge>
                  </div>
                  <h4 className="font-bold text-sm text-foreground">{day.title}</h4>
                  
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                    {day.activities.map((act: string, idx: number) => (
                      <li key={idx}>{act}</li>
                    ))}
                  </ul>

                  <div className="pt-2 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Hotel className="w-3 h-3 text-primary" /> Stay: <strong className="text-foreground">{day.stayRecommendation}</strong>
                    </span>
                    <span className="italic text-amber-600 dark:text-amber-400">
                      Tip: {day.localProTip}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border/40">
              <Button variant="outline" onClick={onClose} className="rounded-xl text-xs">
                Close
              </Button>
              <Button
                onClick={handleShareWhatsApp}
                className="rounded-xl text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share via WhatsApp</span>
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AiTripCuratorModal;
