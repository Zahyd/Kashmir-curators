import { useState, useEffect } from 'react';
import { 
  Sparkles, Plus, Edit, Trash2, ArrowUp, ArrowDown, 
  Save, Calendar, Clock, MapPin, Coffee, Compass, 
  Plane, CheckCircle2, Image as ImageIcon, ChevronRight 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';
import MediaPicker from './MediaPicker';

interface ItineraryDay {
  day: number;
  title: string;
  subtitle: string;
  route: string;
  duration: string;
  image: string;
  description: string;
  highlights: string[];
  inclusions: Array<{ icon: string; label: string }>;
}

const DEFAULT_DAYS: ItineraryDay[] = [
  {
    day: 1,
    title: "Srinagar Arrival & Shikara Sunset",
    subtitle: "VALLEY ENTRY PROTOCOL",
    route: "SXR Airport ➔ Dal Lake",
    duration: "15 km | 40 mins",
    image: "https://images.unsplash.com/photo-1566837493203-d2d46e01a5d6?auto=format&fit=crop&q=80&w=800",
    description: "Land at Srinagar Airport where your private chauffeur awaits. Check-in to a hand-carved cedarwood luxury houseboat. As dusk falls, board a private Shikara for a sunset cruise on the mirror-like waters of Dal Lake.",
    highlights: ["VIP airport greeting & transfer", "Luxury Heritage Houseboat boarding", "Sunset Shikara ride with Kashmiri Kahwa"],
    inclusions: [
      { icon: "plane", label: "Private Airport Transfer" },
      { icon: "compass", label: "Private Shikara Excursion" },
      { icon: "coffee", label: "Welcome Kahwa & High Tea" }
    ]
  },
  {
    day: 2,
    title: "Srinagar to Pahalgam Valley",
    subtitle: "RIVERSIDE COTTAGES & SAFFRON MEADOWS",
    route: "Srinagar ➔ Pahalgam",
    duration: "95 km | 2.5 hrs",
    image: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&q=80&w=800",
    description: "Drive through the saffron fields of Pampore. Pass by ancient stone ruins of Avantipura before ascending into Pahalgam—the Valley of Shepherds. Check in to your ultra-private, riverside luxury cottage overlooking the Lidder River.",
    highlights: ["Saffron fields visit & tasting", "10th-century Avantipura ruins guided stop", "Soundscapes at Lidder riverside cottage"],
    inclusions: [
      { icon: "clock", label: "Private Chauffeur Escort" },
      { icon: "checkCircle", label: "Heritage Ruins Permits" },
      { icon: "coffee", label: "Riverside Fine-Dining Dinner" }
    ]
  },
  {
    day: 3,
    title: "Aru & Betaab Valleys",
    subtitle: "SHEPHERDS TRAILS & GLACIER STREAMWAYS",
    route: "Pahalgam Local Loop",
    duration: "30 km | 1.5 hrs",
    image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=800",
    description: "Embark on an exclusive excursion to Betaab Valley and the high-altitude meadow of Aru Valley. Walk along glacier streams and meet native shepherd families in their high pastures.",
    highlights: ["Guided hike through pine-forested meadows", "Picnic lunch beside glacier stream", "Interaction with local shepherd communities"],
    inclusions: [
      { icon: "compass", label: "Local Nature Guide" },
      { icon: "checkCircle", label: "Betaab & Aru Entry Permits" },
      { icon: "coffee", label: "Gourmet Meadow Picnic" }
    ]
  },
  {
    day: 4,
    title: "Pahalgam to Alpine Gulmarg",
    subtitle: "HIGHLANDS & PINE SKI CHALETS",
    route: "Pahalgam ➔ Gulmarg",
    duration: "140 km | 3.5 hrs",
    image: "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&q=80&w=800",
    description: "Journey towards the majestic Pir Panjal range to Gulmarg—the Meadow of Flowers. Check in to a premium alpine ski resort. End the day with a forest walk beneath towering, snow-capped conifers.",
    highlights: ["Scenic drive passing high apple orchards", "Luxury alpine resort check-in", "Sunset woodland trail trek"],
    inclusions: [
      { icon: "clock", label: "Premium SUV Transfer" },
      { icon: "checkCircle", label: "Gulmarg Eco-Zone Access" },
      { icon: "coffee", label: "Traditional Wazwan Dinner" }
    ]
  },
  {
    day: 5,
    title: "Gondola Peak Ascend (Aphrawat)",
    subtitle: "HIGHEST CABLE CAR IN ASIA",
    route: "Gulmarg Gondola Loop",
    duration: "10 km | 30 mins",
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=800",
    description: "Ascend to Apharwat Peak at 14,000 feet using Asia's highest and longest cable car system (Phase 1 & 2 pre-booked to skip all crowds). Walk on high-altitude snow fields and enjoy breathtaking views of Nanga Parbat.",
    highlights: ["Pre-booked VIP Gondola passes (both phases)", "Apharwat peak snow photography", "Hot tea at 14,000 feet alpine cafe"],
    inclusions: [
      { icon: "compass", label: "Pre-booked Gondola Tickets" },
      { icon: "checkCircle", label: "Ski / Snow Marshal Liaison" },
      { icon: "coffee", label: "High-Altitude Tea Service" }
    ]
  },
  {
    day: 6,
    title: "Gulmarg to Srinagar Airport",
    subtitle: "PASHMINA CRAFT & FAREWELL VALLEY",
    route: "Gulmarg ➔ Srinagar Airport",
    duration: "56 km | 1.5 hrs",
    image: "https://images.unsplash.com/photo-1617653202545-931490e875e6?auto=format&fit=crop&q=80&w=800",
    description: "Descend back to Srinagar for an exclusive craft tour—visiting authentic weavers of Pashmina shawls and hand-knotted silk carpets. Chauffeur transfer to Srinagar Airport for departure.",
    highlights: ["Verified handloom artisan house visit", "Authentic souvenir & spice shopping guide", "Premium airport drop-off protocol"],
    inclusions: [
      { icon: "plane", label: "Airport Drop-off Escort" },
      { icon: "compass", label: "Curated Craft Tour Guide" },
      { icon: "coffee", label: "Farewell Saffron Kehwa" }
    ]
  }
];

export default function CMSItineraryBuilder() {
  const [days, setDays] = useState<ItineraryDay[]>(DEFAULT_DAYS);
  const [editingDay, setEditingDay] = useState<ItineraryDay | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSignatureItinerary();
  }, []);

  const fetchSignatureItinerary = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/site-content`);
      if (res.ok) {
        const data = await res.json();
        if (data.signatureItinerary?.content?.days && data.signatureItinerary.content.days.length > 0) {
          setDays(data.signatureItinerary.content.days);
        }
      }
    } catch (err) {
      console.error('Failed to load itinerary:', err);
    }
  };

  const handleSaveToBackend = async (updatedDays: ItineraryDay[]) => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('teamToken') || localStorage.getItem('token');
      const payload = {
        title: 'THE SIGNATURE ITINERARY',
        subtitle: 'Day-by-day blueprint of our flagship 6-day Kashmir expedition.',
        content: {
          days: updatedDays
        }
      };

      const res = await fetch(`${API_BASE_URL}/site-content/signatureItinerary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success('Signature itinerary synchronized live!');
      } else {
        toast.error('Failed to save itinerary');
      }
    } catch (err) {
      toast.error('Network error saving itinerary');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenAddDay = () => {
    const nextDayNum = days.length + 1;
    setEditingDay({
      day: nextDayNum,
      title: `Day ${nextDayNum} Valley Exploration`,
      subtitle: 'BESPOKE ROUTE',
      route: 'Srinagar Local',
      duration: '40 km | 2 hrs',
      image: 'https://images.unsplash.com/photo-1597074866923-dc0589150358?w=800',
      description: 'Private chauffeur excursion through scenic mountain valleys and heritage cedar estates.',
      highlights: ['Scenic photography stops', 'Private local guide escort', 'Traditional Kashmiri tea stop'],
      inclusions: [
        { icon: 'clock', label: 'Private Chauffeur Escort' },
        { icon: 'coffee', label: 'Welcome Refreshments' }
      ]
    });
    setIsModalOpen(true);
  };

  const handleOpenEditDay = (day: ItineraryDay) => {
    setEditingDay({ ...day });
    setIsModalOpen(true);
  };

  const handleSaveModal = () => {
    if (!editingDay || !editingDay.title.trim()) {
      toast.error('Day title is required');
      return;
    }

    const exists = days.some(d => d.day === editingDay.day);
    let updated: ItineraryDay[];
    if (exists) {
      updated = days.map(d => d.day === editingDay.day ? editingDay : d);
    } else {
      updated = [...days, editingDay];
    }

    // Sort by day number
    updated.sort((a, b) => a.day - b.day);
    setDays(updated);
    setIsModalOpen(false);
    setEditingDay(null);
    handleSaveToBackend(updated);
  };

  const handleDeleteDay = (dayNum: number) => {
    if (days.length <= 1) {
      toast.error('Itinerary must have at least 1 day');
      return;
    }
    const updated = days.filter(d => d.day !== dayNum).map((d, idx) => ({ ...d, day: idx + 1 }));
    setDays(updated);
    handleSaveToBackend(updated);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Header Card */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-500/10 via-white/[0.02] to-transparent border border-purple-400/20 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-400/15 border border-purple-400/30 text-purple-300 text-[10px] font-black uppercase tracking-wider mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>Master Expedition Architect</span>
          </div>
          <h2 className="text-3xl font-display font-black text-white">Visual Itinerary Builder</h2>
          <p className="text-white/60 text-xs sm:text-sm mt-1 max-w-xl">
            Design day-by-day blueprints with route waypoints, high-res photos, inclusions, and client highlights for packages and public itineraries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleOpenAddDay}
            className="h-11 px-5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-400/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Day</span>
          </Button>
          <Button
            onClick={() => handleSaveToBackend(days)}
            disabled={isSaving}
            className="h-11 px-5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider border border-white/15 flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>{isSaving ? 'Saving...' : 'Sync Live'}</span>
          </Button>
        </div>
      </div>

      {/* Days Timeline View */}
      <div className="space-y-6">
        {days.map((day) => (
          <Card key={day.day} className="bg-[#0a0f14]/85 border border-white/10 p-6 rounded-3xl backdrop-blur-xl overflow-hidden hover:border-amber-400/40 transition-all">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-1 flex flex-col items-center justify-center">
                <span className="w-12 h-12 rounded-2xl bg-amber-400 text-black font-display font-black text-lg flex items-center justify-center shadow-lg shadow-amber-400/20">
                  {day.day}
                </span>
                <span className="text-[9px] font-mono uppercase tracking-widest text-white/40 mt-1">DAY</span>
              </div>

              <div className="md:col-span-3 h-32 rounded-2xl overflow-hidden bg-black/40 relative">
                <img src={day.image} alt={day.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-3 right-3 text-[10px] text-white/80 font-mono">
                  {day.route}
                </div>
              </div>

              <div className="md:col-span-6 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-amber-400 border-amber-400/30 text-[9px] font-mono">
                    {day.subtitle}
                  </Badge>
                  <span className="text-xs text-white/40 font-mono">{day.duration}</span>
                </div>
                <h4 className="text-lg font-bold text-white">{day.title}</h4>
                <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                  {day.description}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {day.highlights.map((h, idx) => (
                    <span key={idx} className="text-[9px] bg-white/5 text-white/70 px-2 py-0.5 rounded-md border border-white/10">
                      ✓ {h}
                    </span>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEditDay(day)}
                  className="rounded-xl border-white/15 text-white hover:bg-amber-400 hover:text-black text-xs font-bold"
                >
                  <Edit className="w-3.5 h-3.5 mr-1" />
                  Edit Day
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteDay(day.day)}
                  className="w-9 h-9 rounded-xl text-red-400 hover:bg-red-400/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Day Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl bg-[#0c1218] border border-amber-400/30 text-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              <span>Configure Day {editingDay?.day}</span>
            </DialogTitle>
          </DialogHeader>

          {editingDay && (
            <div className="space-y-4 py-3 max-h-[500px] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1 block">Day Title</label>
                  <Input
                    value={editingDay.title}
                    onChange={e => setEditingDay({ ...editingDay, title: e.target.value })}
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1 block">Protocol Subtitle</label>
                  <Input
                    value={editingDay.subtitle}
                    onChange={e => setEditingDay({ ...editingDay, subtitle: e.target.value })}
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1 block">Transit Route</label>
                  <Input
                    value={editingDay.route}
                    onChange={e => setEditingDay({ ...editingDay, route: e.target.value })}
                    placeholder="e.g. SXR Airport ➔ Dal Lake"
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1 block">Distance / Duration</label>
                  <Input
                    value={editingDay.duration}
                    onChange={e => setEditingDay({ ...editingDay, duration: e.target.value })}
                    placeholder="e.g. 15 km | 40 mins"
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1 block">Detailed Day Description</label>
                <Textarea
                  value={editingDay.description}
                  onChange={e => setEditingDay({ ...editingDay, description: e.target.value })}
                  rows={3}
                  className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1 block">Cover Photo URL</label>
                <div className="flex gap-2">
                  <Input
                    value={editingDay.image}
                    onChange={e => setEditingDay({ ...editingDay, image: e.target.value })}
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl flex-1 font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsMediaPickerOpen(true)}
                    className="border-white/15 hover:bg-white/10 text-xs rounded-xl text-amber-300"
                  >
                    <ImageIcon className="w-4 h-4 mr-1" />
                    Browse
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1 block">Highlights (One per line)</label>
                <Textarea
                  value={editingDay.highlights.join('\n')}
                  onChange={e => setEditingDay({ ...editingDay, highlights: e.target.value.split('\n').filter(Boolean) })}
                  rows={3}
                  className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 gap-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-xs text-white/60">
              Cancel
            </Button>
            <Button onClick={handleSaveModal} className="bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase px-5 rounded-xl">
              Save Day Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MediaPicker
        open={isMediaPickerOpen}
        onOpenChange={setIsMediaPickerOpen}
        onSelect={(url) => {
          if (editingDay) {
            setEditingDay({ ...editingDay, image: url });
          }
          setIsMediaPickerOpen(false);
        }}
      />
    </div>
  );
}
