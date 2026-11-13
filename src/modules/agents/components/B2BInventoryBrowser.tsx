import React, { useState } from 'react';
import { 
  Building, 
  Car, 
  Sparkles, 
  ShieldCheck, 
  Check, 
  Lock, 
  Flame, 
  Snowflake, 
  MapPin, 
  Search,
  Filter
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const SAMPLE_B2B_SUPPLY = [
  {
    id: 'b2b-h1',
    category: 'HOUSEBOAT',
    title: 'Nigeen Lake Royal Cedar Houseboat',
    location: 'Nigeen Lake (Peaceful Zone), Srinagar',
    netRate: 6500,
    retailRate: 9800,
    unit: 'night / MAP',
    features: ['Bukhari Wood Heating', 'Private Shikara Crossing', 'Kahwa on Arrival'],
    heatingType: 'Traditional Bukhari & Heated Blankets',
    instantLock: true
  },
  {
    id: 'b2b-h2',
    category: 'HOTEL',
    title: 'The Highland Chalet & Alpine Spa',
    location: 'Near Gondola Base, Gulmarg',
    netRate: 18500,
    retailRate: 26000,
    unit: 'night / CP',
    features: ['Central Radiator Heating', 'Heated Ski Boot Room', 'Priority Gondola Assistance'],
    heatingType: 'Centralized Heating 24/7',
    instantLock: true
  },
  {
    id: 'b2b-h3',
    category: 'HOTEL',
    title: 'Pahalgam Pine Valley Eco Lodge',
    location: 'Aru Road, Pahalgam',
    netRate: 7200,
    retailRate: 11500,
    unit: 'night / MAP',
    features: ['Lidder River Facing', 'Campfire Evening', 'Mountain View Balcony'],
    heatingType: 'Electric Bed Warmers & AC Heating',
    instantLock: true
  },
  {
    id: 'b2b-c1',
    category: 'CAB',
    title: 'Toyota Innova Crysta (Snow Chains Equipped)',
    location: 'All-Kashmir Fleet Transit',
    netRate: 3800,
    retailRate: 5200,
    unit: 'day (Fuel & Driver Included)',
    features: ['Police Verified Chauffeur', 'Gulmarg/Sonamarg Snow Chains', 'Mineral Water & Mints'],
    heatingType: 'Vehicle Cabin Heater Always On',
    instantLock: true
  },
  {
    id: 'b2b-c2',
    category: 'CAB',
    title: 'Mahindra Scorpio-N 4x4 Offbeat SUV',
    location: 'Gurez Valley & Sinthan Top Corridor',
    netRate: 4600,
    retailRate: 6200,
    unit: 'day (High Altitude Clearance)',
    features: ['4x4 Low Range', 'Oxygen Cylinder Onboard', 'Mountain Pass Experienced Chauffeur'],
    heatingType: 'High Capacity Cabin Heating',
    instantLock: true
  }
];

export const B2BInventoryBrowser: React.FC = () => {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const filteredItems = SAMPLE_B2B_SUPPLY.filter(item => {
    const matchCat = filter === 'ALL' || item.category === filter;
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                        item.location.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleLockRate = (item: any) => {
    toast.success(`Wholesale Rate Locked for ${item.title}!`, {
      description: `Rate held at ₹${item.netRate} for the next 48 hours for your agency.`,
      icon: '🔒'
    });
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border/70">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search wholesale property or vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'HOTEL', 'HOUSEBOAT', 'CAB'].map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={filter === cat ? 'default' : 'outline'}
              onClick={() => setFilter(cat)}
              className="rounded-xl text-xs font-semibold shrink-0"
            >
              {cat === 'ALL' ? 'All Inventory' : cat === 'CAB' ? 'Fleets & Cabs' : cat + 's'}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid of Wholesale Supply */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const margin = item.retailRate - item.netRate;
          const marginPct = Math.round((margin / item.netRate) * 100);

          return (
            <Card key={item.id} className="rounded-3xl border border-border/70 overflow-hidden bg-card hover:shadow-md transition-all flex flex-col justify-between">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className="text-[10px] font-semibold tracking-wider uppercase">
                    {item.category}
                  </Badge>
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none font-bold text-[10px]">
                    +{marginPct}% Agency Margin
                  </Badge>
                </div>

                <div>
                  <h4 className="font-bold text-base text-foreground line-clamp-1">{item.title}</h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    {item.location}
                  </p>
                </div>

                <div className="p-3 bg-muted/40 rounded-2xl space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Contract Net Rate
                      </span>
                      <p className="text-lg font-black text-primary">₹{item.netRate.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Retail Rack Rate
                      </span>
                      <p className="text-sm font-semibold line-through text-muted-foreground">
                        ₹{item.retailRate.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{item.unit}</p>
                </div>

                {/* Features & Heating Tag */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                    <Flame className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.heatingType}</span>
                  </div>
                  <ul className="space-y-1 text-muted-foreground text-[11px]">
                    {item.features.map((f, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button 
                  onClick={() => handleLockRate(item)}
                  className="w-full rounded-xl text-xs font-bold gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock B2B Rate for 48h</span>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default B2BInventoryBrowser;
