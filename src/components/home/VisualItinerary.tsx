import React, { useState, useEffect } from 'react';
import { Clock, MapPin, CheckCircle, ChevronRight, Compass, Calendar, Plane, Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_BASE_URL, SOCKET_URL } from '@/lib/api';
import { io } from 'socket.io-client';

interface ItineraryDay {
  day: number;
  title: string;
  subtitle: string;
  route: string;
  duration: string;
  image: string;
  description: string;
  highlights: string[];
  inclusions: { icon: React.ReactNode; label: string }[];
}

const ITINERARY_DAYS: ItineraryDay[] = [
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
      { icon: <Plane className="w-3.5 h-3.5" />, label: "Private Airport Transfer" },
      { icon: <Compass className="w-3.5 h-3.5" />, label: "Private Shikara Excursion" },
      { icon: <Coffee className="w-3.5 h-3.5" />, label: "Welcome Kahwa & High Tea" }
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
      { icon: <Clock className="w-3.5 h-3.5" />, label: "Private Chauffeur Escort" },
      { icon: <CheckCircle className="w-3.5 h-3.5" />, label: "Heritage Ruins Permits" },
      { icon: <Coffee className="w-3.5 h-3.5" />, label: "Riverside Fine-Dining Dinner" }
    ]
  },
  {
    day: 3,
    title: "Aru & Betaab Valleys",
    subtitle: "SHEPHERDS TRAILS & GLACIER STREAMWAYS",
    route: "Pahalgam Local Loop",
    duration: "30 km | 1.5 hrs",
    image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=800",
    description: "Embark on an exclusive excursion to Betaab Valley—named after the famous Bollywood film—and the high-altitude meadow of Aru Valley. Walk along glacier streams and meet native shepherd families in their high pastures.",
    highlights: ["Guided hike through pine-forested meadows", "Picnic lunch beside glacier stream", "Interaction with local shepherd communities"],
    inclusions: [
      { icon: <Compass className="w-3.5 h-3.5" />, label: "Local Nature Guide" },
      { icon: <CheckCircle className="w-3.5 h-3.5" />, label: "Betaab & Aru Entry Permits" },
      { icon: <Coffee className="w-3.5 h-3.5" />, label: "Gourmet Meadow Picnic" }
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
      { icon: <Clock className="w-3.5 h-3.5" />, label: "Premium SUV Transfer" },
      { icon: <CheckCircle className="w-3.5 h-3.5" />, label: "Gulmarg Eco-Zone Access" },
      { icon: <Coffee className="w-3.5 h-3.5" />, label: "Traditional Wazwan Dinner" }
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
      { icon: <Compass className="w-3.5 h-3.5" />, label: "Pre-booked Gondola Tickets" },
      { icon: <CheckCircle className="w-3.5 h-3.5" />, label: "Ski / Snow Marshal Liaison" },
      { icon: <Coffee className="w-3.5 h-3.5" />, label: "High-Altitude Tea Service" }
    ]
  },
  {
    day: 6,
    title: "Gulmarg to Srinagar Airport",
    subtitle: "PASHMINA CRAFT & FAREWELL VALLEY",
    route: "Gulmarg ➔ Srinagar Airport",
    duration: "56 km | 1.5 hrs",
    image: "https://images.unsplash.com/photo-1617653202545-931490e875e6?auto=format&fit=crop&q=80&w=800",
    description: "Descend back to Srinagar for an exclusive, curated shopping excursion—visiting authentic weavers of Pashmina shawls and hand-knotted silk carpets. Chauffeur transfer to Srinagar Airport for departure.",
    highlights: ["Verified handloom artisan house visit", "Authentic souvenir & spice shopping guide", "Premium airport drop-off protocol"],
    inclusions: [
      { icon: <Plane className="w-3.5 h-3.5" />, label: "Airport Drop-off Escort" },
      { icon: <Compass className="w-3.5 h-3.5" />, label: "Curated Craft Tour Guide" },
      { icon: <Coffee className="w-3.5 h-3.5" />, label: "Farewell Saffron Kehwa" }
    ]
  }
];

export default function VisualItinerary() {
  const [activeDay, setActiveDay] = useState(1);
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>(ITINERARY_DAYS);
  const [sectionTitle, setSectionTitle] = useState('THE SIGNATURE ITINERARY');
  const [sectionSubtitle, setSectionSubtitle] = useState('Day-by-day blueprint of our flagship 6-day Kashmir expedition.');

  useEffect(() => {
    const fetchItineraryData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/site-content`);
        if (response.ok) {
          const data = await response.json();
          if (data.signatureItinerary) {
            setSectionTitle(data.signatureItinerary.title || 'THE SIGNATURE ITINERARY');
            setSectionSubtitle(data.signatureItinerary.subtitle || 'Day-by-day blueprint of our flagship 6-day Kashmir expedition.');
            if (data.signatureItinerary.content && Array.isArray(data.signatureItinerary.content.days) && data.signatureItinerary.content.days.length > 0) {
              setItineraryDays(data.signatureItinerary.content.days);
            }
          }
        }
      } catch (error) {
        console.error('[VisualItinerary] Error fetching itinerary data:', error);
      }
    };

    fetchItineraryData();

    // Listen to real-time updates via WebSocket
    const socket = io(SOCKET_URL);
    socket.on('site-content-updated', (update) => {
      if (update.sectionKey === 'signatureItinerary') {
        const sectionData = update.data;
        if (sectionData) {
          setSectionTitle(sectionData.title || 'THE SIGNATURE ITINERARY');
          setSectionSubtitle(sectionData.subtitle || 'Day-by-day blueprint of our flagship 6-day Kashmir expedition.');
          if (sectionData.content && Array.isArray(sectionData.content.days) && sectionData.content.days.length > 0) {
            setItineraryDays(sectionData.content.days);
          }
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const getInclusionIcon = (iconName: string) => {
    switch (iconName) {
      case 'plane': return <Plane className="w-3.5 h-3.5" />;
      case 'compass': return <Compass className="w-3.5 h-3.5" />;
      case 'coffee': return <Coffee className="w-3.5 h-3.5" />;
      case 'clock': return <Clock className="w-3.5 h-3.5" />;
      case 'checkCircle': return <CheckCircle className="w-3.5 h-3.5" />;
      default: return <Compass className="w-3.5 h-3.5" />;
    }
  };

  const currentDay = itineraryDays[activeDay - 1] || itineraryDays[0] || ITINERARY_DAYS[0];

  return (
    <section className="py-32 bg-[#05080a] relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-10 left-10 w-80 h-80 bg-kashmir-gold/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-[130px]" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="flex flex-col items-center text-center mb-20">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
              <Compass className="w-3.5 h-3.5 text-kashmir-gold animate-spin-slow" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">Bespoke Experience Route</span>
            </div>
            <h2 className="font-display text-5xl md:text-7xl font-black text-white tracking-tighter uppercase mb-6">
              {sectionTitle.toUpperCase().includes('ITINERARY') ? (
                <>
                  {sectionTitle.toUpperCase().replace('ITINERARY', '')}
                  <span className="text-kashmir-gold italic">ITINERARY</span>
                </>
              ) : (
                sectionTitle
              )}
            </h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto font-medium leading-relaxed">
              {sectionSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: Vertical Day Selector (Lg screens) & Top row (Sm screens) */}
            <div className="lg:col-span-4 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-3 pb-4 lg:pb-0 scrollbar-none">
              {itineraryDays.map((dayObj) => (
                <button
                  key={dayObj.day}
                  onClick={() => setActiveDay(dayObj.day)}
                  className={cn(
                    "flex-shrink-0 flex items-center gap-4 text-left p-5 rounded-2xl border transition-all duration-500 w-64 lg:w-full",
                    activeDay === dayObj.day
                      ? "border-kashmir-gold/30 bg-kashmir-gold/5 shadow-[0_0_20px_rgba(212,175,55,0.06)]"
                      : "border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-display font-black text-sm transition-all duration-500",
                    activeDay === dayObj.day
                      ? "bg-kashmir-gold text-black shadow-[0_0_12px_rgba(212,175,55,0.25)]"
                      : "bg-white/5 text-white/40"
                  )}>
                    D0{dayObj.day}
                  </div>
                  <div className="min-w-0">
                    <p className={cn(
                      "text-xs font-bold transition-all",
                      activeDay === dayObj.day ? "text-white" : "text-white/40"
                    )}>
                      {dayObj.title ? dayObj.title.split(" & ")[0] : `Day ${dayObj.day}`}
                    </p>
                    <span className="text-[9px] text-white/30 uppercase tracking-widest">{dayObj.subtitle ? dayObj.subtitle.split(" & ")[0] : ''}</span>
                  </div>
                  {activeDay === dayObj.day && (
                    <ChevronRight className="hidden lg:block w-4 h-4 text-kashmir-gold ml-auto animate-bounce-horizontal" />
                  )}
                </button>
              ))}
            </div>

            {/* Right Column: Display Window */}
            <div className="lg:col-span-8 bg-[#070b0d] border border-white/5 rounded-[3rem] p-6 md:p-10 shadow-2xl relative overflow-hidden group">
              {/* Image Hub */}
              <div className="relative h-64 md:h-96 rounded-2xl md:rounded-[2rem] overflow-hidden mb-8">
                {currentDay.image && (
                  <img
                    src={currentDay.image}
                    alt={currentDay.title}
                    className="w-full h-full object-cover transition-transform duration-[3000ms] group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#070b0d] via-transparent to-transparent opacity-80" />
                
                {/* Float badges on image */}
                <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 bg-[#05080a]/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-white">
                    <MapPin className="w-4 h-4 text-kashmir-gold" />
                    <span className="text-xs font-black uppercase tracking-widest">{currentDay.route}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#05080a]/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-white">
                    <Clock className="w-4 h-4 text-kashmir-gold" />
                    <span className="text-xs font-black uppercase tracking-widest">{currentDay.duration}</span>
                  </div>
                </div>
              </div>

              {/* Text Content */}
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-kashmir-gold/70">{currentDay.subtitle}</span>
                  <h3 className="font-display text-3xl md:text-4xl font-black text-white mt-1 uppercase">
                    {currentDay.title}
                  </h3>
                </div>

                <p className="text-white/50 text-sm md:text-base leading-relaxed font-medium">
                  {currentDay.description}
                </p>

                {/* Highlights List */}
                {currentDay.highlights && currentDay.highlights.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Luxury Highlights</p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {currentDay.highlights.map((highlight, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-white/70 font-semibold">
                          <CheckCircle className="w-4 h-4 text-kashmir-gold flex-shrink-0 mt-0.5" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Inclusions Row */}
                {currentDay.inclusions && currentDay.inclusions.length > 0 && (
                  <div className="border-t border-white/5 pt-6 mt-6">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-4">Day Inclusions</p>
                    <div className="flex flex-wrap gap-3">
                      {currentDay.inclusions.map((inclusion: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] font-bold text-white/60">
                          <span className="text-kashmir-gold">
                            {typeof inclusion.icon === 'string' ? getInclusionIcon(inclusion.icon) : inclusion.icon}
                          </span>
                          <span>{inclusion.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
