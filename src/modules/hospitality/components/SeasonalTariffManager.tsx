import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  Calendar, 
  Sparkles, 
  Save, 
  Check, 
  Flame, 
  Sun, 
  Snowflake, 
  Flower2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface SeasonRate {
  id: string;
  seasonName: string;
  icon: any;
  months: string;
  multiplier: number;
  baseRate: number;
}

const SEASONS: SeasonRate[] = [
  { id: 'winter', seasonName: 'Winter Snow & Ski Gold', icon: Snowflake, months: 'Dec 15 - Feb 28', multiplier: 1.4, baseRate: 14500 },
  { id: 'spring', seasonName: 'Spring Tulip & Almond Bloom', icon: Flower2, months: 'Mar 15 - Apr 30', multiplier: 1.25, baseRate: 12000 },
  { id: 'summer', seasonName: 'Summer Peak Leisure', icon: Sun, months: 'May 01 - Jul 15', multiplier: 1.35, baseRate: 13500 },
  { id: 'autumn', seasonName: 'Autumn Golden Chinar', icon: Flame, months: 'Sep 15 - Nov 10', multiplier: 1.15, baseRate: 11000 },
];

export const SeasonalTariffManager: React.FC = () => {
  const [rates, setRates] = useState<SeasonRate[]>(SEASONS);
  const [isSaving, setIsSaving] = useState(false);

  const handleRateChange = (id: string, newRate: number) => {
    setRates(prev => prev.map(r => r.id === id ? { ...r, baseRate: newRate } : r));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Seasonal Tariffs updated and synced with B2B Agent Network!', {
        description: 'New rates are live across Kashmir Connect booking engines.',
        icon: '🚀'
      });
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-lg text-foreground">Dynamic Seasonal Tariffs & Meal Add-ons</h3>
          <p className="text-xs text-muted-foreground">
            Configure rates per season. Kashmir Connect automatically calculates B2B contract vs retail rates.
          </p>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="rounded-xl text-xs font-bold gap-2 self-start sm:self-auto shadow-sm"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? 'Syncing...' : 'Save & Publish Tariffs'}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rates.map((season) => {
          const Icon = season.icon;

          return (
            <Card key={season.id} className="rounded-3xl border border-border/70 p-5 bg-card space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{season.seasonName}</h4>
                    <span className="text-[11px] text-muted-foreground">{season.months}</span>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {season.multiplier}x Multiplier
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Standard Suite B2B Base Rate (Per Night, EP)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₹</span>
                  <Input 
                    type="number"
                    value={season.baseRate}
                    onChange={(e) => handleRateChange(season.id, Number(e.target.value))}
                    className="pl-7 rounded-xl font-mono text-sm font-bold"
                  />
                </div>
              </div>

              {/* Meal Plan Breakdown Preview */}
              <div className="p-3 bg-muted/40 rounded-2xl text-[11px] space-y-1 text-muted-foreground">
                <div className="flex justify-between">
                  <span>With Breakfast (CP):</span>
                  <span className="font-semibold text-foreground">₹{(season.baseRate + 800).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Modified American Plan (MAP - Bkfst + Dinner):</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    ₹{(season.baseRate + 1800).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SeasonalTariffManager;
