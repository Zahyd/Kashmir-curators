import React, { useState, useEffect } from 'react';
import { 
  SlidersHorizontal, 
  Calendar, 
  Sparkles, 
  Save, 
  Check, 
  Flame, 
  Sun, 
  Snowflake, 
  Flower2,
  RefreshCw,
  BedDouble
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { getHospitalityToken } from '../utils/hospitalityAuth';

interface SeasonalTariffManagerProps {
  selectedHotelId?: string;
}

interface DBSeasonalRate {
  id: string;
  categoryId: string;
  seasonName: string;
  startDate: string;
  endDate: string;
  multiplier: number;
  flatRate: number | null;
  category?: {
    id: string;
    name: string;
    basePrice: number;
  };
}

interface RoomCategory {
  id: string;
  name: string;
  basePrice: number;
}

export const SeasonalTariffManager: React.FC<SeasonalTariffManagerProps> = ({ selectedHotelId }) => {
  const { token } = useAuth();
  const [rates, setRates] = useState<DBSeasonalRate[]>([]);
  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTariffsAndCategories = async () => {
    try {
      setIsLoading(true);
      const authToken = getHospitalityToken(token);
      const hotelParam = selectedHotelId ? `?hotelId=${encodeURIComponent(selectedHotelId)}` : '';

      const [tariffsRes, catRes] = await Promise.all([
        fetch(`${API_BASE_URL}/hotels/operations/tariffs${hotelParam}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        }),
        fetch(`${API_BASE_URL}/hotels/operations/categories${hotelParam}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        })
      ]);

      if (tariffsRes.ok) {
        const tariffsData = await tariffsRes.json();
        setRates(Array.isArray(tariffsData) ? tariffsData : []);
      }

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(Array.isArray(catData) ? catData : []);
      }
    } catch (err) {
      console.error('Failed to load seasonal tariffs:', err);
      toast.error('Could not load seasonal tariffs from database');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTariffsAndCategories();
  }, [token, selectedHotelId]);

  const handleRateMultiplierChange = (id: string, newMultiplier: number) => {
    setRates(prev => prev.map(r => {
      if (r.id === id) {
        const base = r.category?.basePrice || 14500;
        return {
          ...r,
          multiplier: newMultiplier,
          flatRate: Math.round(base * newMultiplier)
        };
      }
      return r;
    }));
  };

  const handleCategoryBasePriceChange = (catId: string, newPrice: number) => {
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, basePrice: newPrice } : c));
    setRates(prev => prev.map(r => {
      if (r.categoryId === catId) {
        return {
          ...r,
          category: r.category ? { ...r.category, basePrice: newPrice } : undefined,
          flatRate: Math.round(newPrice * (r.multiplier || 1.0))
        };
      }
      return r;
    }));
  };

  const handleSaveTariff = async (rate: DBSeasonalRate) => {
    try {
      setIsSaving(true);
      const authToken = getHospitalityToken(token);

      const res = await fetch(`${API_BASE_URL}/hotels/operations/tariffs/${rate.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          multiplier: rate.multiplier,
          flatRate: rate.flatRate,
          seasonName: rate.seasonName
        })
      });

      if (!res.ok) throw new Error('Failed to update seasonal tariff');

      toast.success(`Season "${rate.seasonName}" rate updated!`, {
        description: `Multiplier ${rate.multiplier}x (₹${rate.flatRate?.toLocaleString('en-IN')}) synced live with B2B network.`,
        icon: '🚀'
      });
    } catch (err: any) {
      toast.error(err.message || 'Error saving seasonal tariff');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCategoryBase = async (cat: RoomCategory) => {
    try {
      setIsSaving(true);
      const authToken = getHospitalityToken(token);

      const res = await fetch(`${API_BASE_URL}/hotels/operations/categories/${cat.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: cat.name,
          basePrice: cat.basePrice
        })
      });

      if (!res.ok) throw new Error('Failed to update category base rate');

      toast.success(`${cat.name} base rate updated to ₹${cat.basePrice.toLocaleString('en-IN')}/night!`);
      fetchTariffsAndCategories();
    } catch (err: any) {
      toast.error(err.message || 'Error saving category base price');
    } finally {
      setIsSaving(false);
    }
  };

  const getSeasonIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('winter') || lower.includes('ski') || lower.includes('snow')) return Snowflake;
    if (lower.includes('spring') || lower.includes('tulip') || lower.includes('bloom')) return Flower2;
    if (lower.includes('summer')) return Sun;
    return Flame;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 sm:p-5 rounded-3xl border border-border/80 shadow-sm">
        <div>
          <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
            <span>Dynamic Seasonal Tariffs & Meal Plan Add-ons</span>
            <Badge variant="outline" className="text-emerald-600 border-emerald-500/40 text-xs">
              Autoritative Neon DB
            </Badge>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure rates per season and room category. Kashmir Connect automatically calculates B2B contract vs retail rates.
          </p>
        </div>

        <Button 
          variant="outline"
          size="sm"
          onClick={fetchTariffsAndCategories} 
          disabled={isLoading || isSaving}
          className="rounded-xl text-xs font-bold gap-1.5 h-10 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Sync Tariffs</span>
        </Button>
      </div>

      {/* Room Categories Base Rate Manager */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <BedDouble className="w-4 h-4 text-amber-500" />
          <span>Category Contract Base Rates (EP - Room Only)</span>
        </h4>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="h-24 bg-card border border-border/60 rounded-2xl animate-pulse" />
            <div className="h-24 bg-card border border-border/60 rounded-2xl animate-pulse" />
          </div>
        ) : categories.length === 0 ? (
          <Card className="p-6 rounded-2xl border border-dashed border-border text-center bg-card/60">
            <p className="text-xs text-muted-foreground">No categories registered for this property yet.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((cat) => (
              <Card key={cat.id} className="p-4 rounded-2xl border border-border/70 bg-card flex items-center justify-between gap-3">
                <div>
                  <h5 className="font-bold text-xs text-foreground">{cat.name}</h5>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Base B2B EP Tariff</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-28">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      value={cat.basePrice}
                      onChange={(e) => handleCategoryBasePriceChange(cat.id, Number(e.target.value))}
                      className="pl-6 h-9 rounded-xl font-mono text-xs font-bold"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSaveCategoryBase(cat)}
                    disabled={isSaving}
                    className="h-9 rounded-xl text-xs font-bold"
                  >
                    Save
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Seasonal Multipliers Grid */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-amber-500" />
          <span>Kashmir Peak & Shoulder Season Multipliers</span>
        </h4>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="h-44 bg-card border border-border/60 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : rates.length === 0 ? (
          <Card className="rounded-3xl border border-dashed border-border p-10 text-center bg-card/60">
            <Calendar className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <h5 className="font-bold text-sm text-foreground">No Seasonal Rates Configured</h5>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
              Seasonal rates have not been configured for this property yet. Room category base tariffs will apply all year round.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rates.map((season) => {
              const Icon = getSeasonIcon(season.seasonName);
              const basePrice = season.category?.basePrice || 14500;
              const calculatedRate = season.flatRate || Math.round(basePrice * (season.multiplier || 1.0));

              return (
                <Card key={season.id} className="rounded-3xl border border-border/70 p-5 bg-card space-y-4 shadow-sm hover:border-amber-500/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{season.seasonName}</h4>
                        <span className="text-[11px] text-muted-foreground">
                          {season.category?.name || 'Category'} • {new Date(season.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} – {new Date(season.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs font-bold border-amber-500/30 text-amber-600">
                      {season.multiplier}x Multiplier
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Multiplier (vs Base)</Label>
                      <Input 
                        type="number"
                        step="0.05"
                        min="0.5"
                        max="3.0"
                        value={season.multiplier}
                        onChange={(e) => handleRateMultiplierChange(season.id, parseFloat(e.target.value) || 1.0)}
                        className="rounded-xl font-mono text-xs font-bold h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Calculated B2B Rate</Label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₹</span>
                        <Input 
                          type="number"
                          readOnly
                          value={calculatedRate}
                          className="pl-6 rounded-xl font-mono text-xs font-black h-9 bg-muted/40 cursor-default"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Meal Plan Breakdown Preview */}
                  <div className="p-3 bg-muted/30 rounded-2xl text-[11px] space-y-1 text-muted-foreground border border-border/50">
                    <div className="flex justify-between">
                      <span>Bed & Breakfast (CP):</span>
                      <span className="font-semibold text-foreground">₹{(calculatedRate + 800).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Modified American Plan (MAP):</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        ₹{(calculatedRate + 1800).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1 flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => handleSaveTariff(season)}
                      disabled={isSaving}
                      className="rounded-xl text-xs font-bold gap-1.5 h-8 bg-amber-500 hover:bg-amber-400 text-slate-950"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Tariff</span>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SeasonalTariffManager;
