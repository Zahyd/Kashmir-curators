import { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Download, 
  FileText, 
  Calendar, 
  MapPin, 
  Hotel as HotelIcon, 
  Car, 
  Sparkles,
  Save,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Share2,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Zap,
  Utensils,
  Bed,
  Coffee,
  X,
  ChevronDown,
  XCircle,
  IndianRupee,
  ShieldX,
  Users,
  Search,
  Wallet,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Activity,
  Upload,
  Plane,
  CreditCard,
  Compass,
  Navigation,
  Sliders,
  Percent,
  Info,
  ExternalLink,
  Layers,
  RotateCcw,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Logo } from '@/components/ui/Logo';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as UICalendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useHotels } from '@/hooks/useCMSData';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api';
import { getRouteIntelligence, calculateTripLogistics } from '@/lib/kashmirRouteIntelligence';


interface ItineraryDay {
  day: number;
  title: string;
  activities: string;
  hotelId: string;
  hotelName: string;
  hotelImage: string;
  transport: string;
  roomType: string;
  mealPlan: string;
  bedCount: string;
  hotelPrice: number;
  transportPrice: number;
  extraBedPrice: number;
  hotelNetCost: number;
  transportNetCost: number;
  paxCount: string;
  vendorStatus: 'pending' | 'confirmed' | 'waitlist';
  showDateTime?: boolean;
  date?: string;
  time?: string;
}

interface ItineraryBuilderProps {
  inquiry: any;
  onBack: () => void;
}

const formatPDFDate = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

const formatPDFTime = (timeStr: string) => {
  if (!timeStr) return '';
  try {
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  } catch (e) {
    return timeStr;
  }
};

const activityTemplates = [
  "Shikara ride on Dal Lake at sunset",
  "Visit to the historic Mughal Gardens (Nishat & Shalimar)",
  "Gondola ride to Phase 1 & 2 in Gulmarg",
  "Full day excursion to Betaab Valley & Aru Valley",
  "Old Srinagar Heritage Walk and local market exploration",
  "Pony ride to Thajiwas Glacier in Sonamarg",
  "Traditional Kashmiri Wazwan dinner experience",
];

export default function ItineraryBuilder({ inquiry, onBack }: ItineraryBuilderProps) {
  if (!inquiry) return null;
  const { data: hotels } = useHotels();
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [exclusions, setExclusions] = useState<string>('- Airfare or Train fare\n- Lunch (Unless specified)\n- Personal expenses (Laundry, Tips, etc.)\n- Any entry fees for monuments or activities not mentioned');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHotelPicker, setShowHotelPicker] = useState<number | null>(null);
  const [showImageActions, setShowImageActions] = useState<number | null>(null);
  const [tempImageUrl, setTempImageUrl] = useState('');
  const [pax, setPax] = useState({ adults: 2, children: 0 });
  const [proposalUrl, setProposalUrl] = useState(inquiry.proposalUrl || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('5000');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const pdfContentRef = useRef<HTMLDivElement>(null);

  // AI Luxury Studio State
  const [enhancingDayIndex, setEnhancingDayIndex] = useState<number | null>(null);
  const [dayProTips, setDayProTips] = useState<Record<number, string>>({});
  const [targetMargin, setTargetMargin] = useState<number>(25);
  const [showAiRegenModal, setShowAiRegenModal] = useState(false);
  const [aiRegenTheme, setAiRegenTheme] = useState('LUXURY');
  const [aiRegenDuration, setAiRegenDuration] = useState('6');
  const [isAiRegenerating, setIsAiRegenerating] = useState(false);
  const [hotelFilterLocation, setHotelFilterLocation] = useState<string>('ALL');

  const totalCost = days.reduce((sum, day) => sum + (day.hotelPrice || 0) + (day.transportPrice || 0) + (day.extraBedPrice || 0), 0);

  // Load existing quote data if available
  useEffect(() => {
    if (inquiry.quoteData) {
      try {
        const parsed = JSON.parse(inquiry.quoteData);
        if (Array.isArray(parsed)) {
          setDays(parsed);
        }
      } catch (error) {
        console.error("Failed to parse existing quote data:", error);
      }
    }
  }, [inquiry.quoteData]);

  // Initialize days based on inquiry duration
  useEffect(() => {
    if (inquiry.quoteData) return; // Do not overwrite existing quote data
    
    const duration = parseInt(inquiry.duration) || 3;
    const initialDays = Array.from({ length: duration }, (_, i) => ({
      day: i + 1,
      title: i === 0 ? 'Arrival in Srinagar' : i === duration - 1 ? 'Departure' : `Exploring ${inquiry.destination.split(',')[0]}`,
      activities: '',
      hotelId: '',
      hotelName: '',
      hotelImage: '',
      transport: 'Private Luxury Sedan',
      roomType: 'Deluxe Room',
      mealPlan: 'MAP (Breakfast + Dinner)',
      bedCount: 'Double Bed',
      hotelPrice: 0,
      transportPrice: 0,
      extraBedPrice: 0,
      hotelNetCost: 0,
      transportNetCost: 0,
      paxCount: '2',
      vendorStatus: 'pending' as const,
      showDateTime: false,
      date: '',
      time: ''
    }));
    setDays(initialDays);
  }, [inquiry]);

  // Auto-save draft to localStorage whenever days changes
  useEffect(() => {
    if (days && days.length > 0) {
      localStorage.setItem(`KC_DRAFT_ITINERARY_${inquiry.id}`, JSON.stringify(days));
    }
  }, [days, inquiry.id]);

  
  const loadTemplate = (templateType: 'flagship-6d' | 'romance-5d' | 'snow-4d') => {
    let newDays: ItineraryDay[] = [];
    if (templateType === 'flagship-6d') {
      newDays = [
        {
          day: 1,
          title: 'Srinagar Arrival & Sunset Shikara Cruise on Dal Lake',
          activities: 'VIP Airport greeting and transfer. Check-in to Royal Cedar Houseboat on Dal Lake. Sunset private Shikara ride with authentic Kashmiri saffron Kahwa.',
          hotelId: 'h-houseboat-1',
          hotelName: 'Nigeen Royal Cedar Houseboat',
          hotelImage: 'https://images.unsplash.com/photo-1566837493203-d2d46e01a5d6?auto=format&fit=crop&q=80&w=800',
          transport: 'Toyota Innova Crysta VIP',
          roomType: 'Heritage Suite',
          mealPlan: 'MAP (Breakfast + Dinner)',
          bedCount: 'King Bed',
          hotelPrice: 8500,
          transportPrice: 3800,
          extraBedPrice: 0,
          hotelNetCost: 6200,
          transportNetCost: 3000,
          paxCount: '2',
          vendorStatus: 'confirmed',
          showDateTime: false
        },
        {
          day: 2,
          title: 'Srinagar to Pahalgam Valley of Shepherds',
          activities: 'Drive through the saffron fields of Pampore and 10th-century Avantipura ruins. Check in to riverside mountain lodge along the gushing Lidder River.',
          hotelId: 'h-pahalgam-1',
          hotelName: 'Pahalgam Riverside Retreat',
          hotelImage: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&q=80&w=800',
          transport: 'Toyota Innova Crysta VIP',
          roomType: 'Riverside Deluxe Cottage',
          mealPlan: 'MAP (Breakfast + Dinner)',
          bedCount: 'King Bed',
          hotelPrice: 9500,
          transportPrice: 3800,
          extraBedPrice: 0,
          hotelNetCost: 7000,
          transportNetCost: 3000,
          paxCount: '2',
          vendorStatus: 'confirmed',
          showDateTime: false
        },
        {
          day: 3,
          title: 'Aru & Betaab Valleys High Pine Meadows',
          activities: 'Private excursion to Betaab Valley, Aru high pastures, and crystal-clear streams. Walk with local nature guide and enjoy riverside Kashmiri lunch.',
          hotelId: 'h-pahalgam-1',
          hotelName: 'Pahalgam Riverside Retreat',
          hotelImage: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=800',
          transport: 'Toyota Innova Crysta VIP',
          roomType: 'Riverside Deluxe Cottage',
          mealPlan: 'MAP (Breakfast + Dinner)',
          bedCount: 'King Bed',
          hotelPrice: 9500,
          transportPrice: 3800,
          extraBedPrice: 0,
          hotelNetCost: 7000,
          transportNetCost: 3000,
          paxCount: '2',
          vendorStatus: 'confirmed',
          showDateTime: false
        },
        {
          day: 4,
          title: 'Pahalgam to Alpine Gulmarg Gondola Highlands',
          activities: 'Ascend into the Pir Panjal range to Gulmarg. Check in to luxury pine ski chalet with central heating. Sunset pine forest walk.',
          hotelId: 'h-gulmarg-1',
          hotelName: 'The Highland Chalet & Alpine Spa',
          hotelImage: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&q=80&w=800',
          transport: 'Toyota Innova Crysta VIP',
          roomType: 'Alpine Pine Suite',
          mealPlan: 'MAP (Breakfast + Dinner)',
          bedCount: 'King Bed',
          hotelPrice: 18500,
          transportPrice: 4200,
          extraBedPrice: 0,
          hotelNetCost: 14000,
          transportNetCost: 3400,
          paxCount: '2',
          vendorStatus: 'confirmed',
          showDateTime: false
        },
        {
          day: 5,
          title: 'Apharwat Peak 14,000ft Gondola Cable Car',
          activities: 'VIP pre-booked Gondola tickets for Phase 1 & 2. High-altitude snow activities, Apharwat ridge photography, and tea at 14,000 feet alpine cafe.',
          hotelId: 'h-gulmarg-1',
          hotelName: 'The Highland Chalet & Alpine Spa',
          hotelImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=800',
          transport: 'Toyota Innova Crysta VIP',
          roomType: 'Alpine Pine Suite',
          mealPlan: 'MAP (Breakfast + Dinner)',
          bedCount: 'King Bed',
          hotelPrice: 18500,
          transportPrice: 3800,
          extraBedPrice: 0,
          hotelNetCost: 14000,
          transportNetCost: 3000,
          paxCount: '2',
          vendorStatus: 'confirmed',
          showDateTime: false
        },
        {
          day: 6,
          title: 'Gulmarg to Srinagar Airport Departure',
          activities: 'Descend to Srinagar. Curated artisan Pashmina weavers and authentic saffron boutique visit before comfortable VIP airport drop-off.',
          hotelId: '',
          hotelName: '',
          hotelImage: '',
          transport: 'Toyota Innova Crysta VIP',
          roomType: 'Transfer Only',
          mealPlan: 'CP (Breakfast Only)',
          bedCount: '',
          hotelPrice: 0,
          transportPrice: 3500,
          extraBedPrice: 0,
          hotelNetCost: 0,
          transportNetCost: 2800,
          paxCount: '2',
          vendorStatus: 'confirmed',
          showDateTime: false
        }
      ];
    } else if (templateType === 'romance-5d') {
      newDays = [
        {
          day: 1,
          title: 'Romantic Dal Lake Houseboat Arrival',
          activities: 'Warm welcome with Kashmiri Kehwa, private candlelit Shikara ride at twilight, hand-crafted cedarwood heated suite.',
          hotelId: 'h-houseboat-1',
          hotelName: 'Nigeen Royal Cedar Houseboat',
          hotelImage: 'https://images.unsplash.com/photo-1566837493203-d2d46e01a5d6?auto=format&fit=crop&q=80&w=800',
          transport: 'Private Executive Sedan',
          roomType: 'Royal Honeymoon Suite',
          mealPlan: 'MAP (Breakfast + Dinner)',
          bedCount: 'King Bed',
          hotelPrice: 9000,
          transportPrice: 3200,
          extraBedPrice: 0,
          hotelNetCost: 6800,
          transportNetCost: 2500,
          paxCount: '2',
          vendorStatus: 'confirmed'
        },
        {
          day: 2,
          title: 'Old City Artisans & Mughal Floral Gardens',
          activities: 'Nishat & Shalimar bagh royal floral tour, heritage handicraft exploration, evening riverside high tea.',
          hotelId: 'h-houseboat-1',
          hotelName: 'Nigeen Royal Cedar Houseboat',
          hotelImage: 'https://images.unsplash.com/photo-1566837493203-d2d46e01a5d6?auto=format&fit=crop&q=80&w=800',
          transport: 'Private Executive Sedan',
          roomType: 'Royal Honeymoon Suite',
          mealPlan: 'MAP (Breakfast + Dinner)',
          bedCount: 'King Bed',
          hotelPrice: 9000,
          transportPrice: 3200,
          extraBedPrice: 0,
          hotelNetCost: 6800,
          transportNetCost: 2500,
          paxCount: '2',
          vendorStatus: 'confirmed'
        },
        {
          day: 3,
          title: 'Scenic Transfer to Gulmarg Winter Chalet',
          activities: 'Ascent to snow-draped Gulmarg pine forest, luxury cottage fireside lounge, couples spa session.',
          hotelId: 'h-gulmarg-1',
          hotelName: 'The Highland Chalet & Alpine Spa',
          hotelImage: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&q=80&w=800',
          transport: 'Private Executive Sedan',
          roomType: 'Highland Alpine Suite',
          mealPlan: 'MAP (Breakfast + Dinner)',
          bedCount: 'King Bed',
          hotelPrice: 17500,
          transportPrice: 3800,
          extraBedPrice: 0,
          hotelNetCost: 13500,
          transportNetCost: 3000,
          paxCount: '2',
          vendorStatus: 'confirmed'
        },
        {
          day: 4,
          title: 'Gulmarg Gondola Ride & Snow Excursion',
          activities: 'Phase 1 & Phase 2 cable car up Apharwat peak, snow photography, cozy hot cocoa at highland cafe.',
          hotelId: 'h-gulmarg-1',
          hotelName: 'The Highland Chalet & Alpine Spa',
          hotelImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=800',
          transport: 'Private Executive Sedan',
          roomType: 'Highland Alpine Suite',
          mealPlan: 'MAP (Breakfast + Dinner)',
          bedCount: 'King Bed',
          hotelPrice: 17500,
          transportPrice: 3200,
          extraBedPrice: 0,
          hotelNetCost: 13500,
          transportNetCost: 2500,
          paxCount: '2',
          vendorStatus: 'confirmed'
        },
        {
          day: 5,
          title: 'Sweet Memories & Airport Farewell',
          activities: 'Breakfast at chalet, scenic return drive to Srinagar Airport with complimentary dry fruit souvenir box.',
          hotelId: '',
          hotelName: '',
          hotelImage: '',
          transport: 'Private Executive Sedan',
          roomType: 'Transfer Only',
          mealPlan: 'CP (Breakfast Only)',
          bedCount: '',
          hotelPrice: 0,
          transportPrice: 3000,
          extraBedPrice: 0,
          hotelNetCost: 0,
          transportNetCost: 2400,
          paxCount: '2',
          vendorStatus: 'confirmed'
        }
      ];
    } else {
      newDays = [
        {
          day: 1,
          title: 'Srinagar to Gulmarg Direct Ski Express',
          activities: 'Direct 4x4 SUV transfer from airport to Gulmarg ski slopes. Check-in to heated chalet, equipment fitting & ski pass check.',
          hotelId: 'h-gulmarg-1',
          hotelName: 'The Highland Chalet & Alpine Spa',
          hotelImage: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&q=80&w=800',
          transport: '4x4 Snow Chains Mountain SUV',
          roomType: 'Heated Chalet Room',
          mealPlan: 'MAP (Breakfast + Dinner)',
          bedCount: 'Twin/Double',
          hotelPrice: 16000,
          transportPrice: 4500,
          extraBedPrice: 0,
          hotelNetCost: 12000,
          transportNetCost: 3500,
          paxCount: '2',
          vendorStatus: 'confirmed'
        },
        {
          day: 2,
          title: 'Full Day Skiing Apharwat Peak Phase 1 & 2',
          activities: 'Dedicated ski instructor liaison. Morning powder skiing on Phase 2 Apharwat bowl, afternoon slalom courses.',
          hotelId: 'h-gulmarg-1',
          hotelName: 'The Highland Chalet & Alpine Spa',
          hotelImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=800',
          transport: '4x4 Snow Chains Mountain SUV',
          roomType: 'Heated Chalet Room',
          mealPlan: 'MAP (Breakfast + Dinner)',
          bedCount: 'Twin/Double',
          hotelPrice: 16000,
          transportPrice: 3000,
          extraBedPrice: 0,
          hotelNetCost: 12000,
          transportNetCost: 2200,
          paxCount: '2',
          vendorStatus: 'confirmed'
        },
        {
          day: 3,
          title: 'Snowmobile Trails & Srinagar Houseboat Evening',
          activities: 'Morning snowmobiling and Mary Shoulder trail. Afternoon descent to Dal Lake for authentic heritage houseboat night.',
          hotelId: 'h-houseboat-1',
          hotelName: 'Nigeen Royal Cedar Houseboat',
          hotelImage: 'https://images.unsplash.com/photo-1566837493203-d2d46e01a5d6?auto=format&fit=crop&q=80&w=800',
          transport: '4x4 Snow Chains Mountain SUV',
          roomType: 'Royal Suite',
          mealPlan: 'MAP (Breakfast + Dinner)',
          bedCount: 'Twin/Double',
          hotelPrice: 7500,
          transportPrice: 4200,
          extraBedPrice: 0,
          hotelNetCost: 5500,
          transportNetCost: 3200,
          paxCount: '2',
          vendorStatus: 'confirmed'
        },
        {
          day: 4,
          title: 'Farewell Kashmir Flight Transfer',
          activities: 'Early morning shikara view across snow-dusted mountains, hot Kahwa, transfer to Srinagar airport.',
          hotelId: '',
          hotelName: '',
          hotelImage: '',
          transport: 'Private Executive Sedan',
          roomType: 'Transfer Only',
          mealPlan: 'CP (Breakfast Only)',
          bedCount: '',
          hotelPrice: 0,
          transportPrice: 3000,
          extraBedPrice: 0,
          hotelNetCost: 0,
          transportNetCost: 2400,
          paxCount: '2',
          vendorStatus: 'confirmed'
        }
      ];
    }
    setDays(newDays);
    toast.success(`Loaded ${newDays.length}-Day Master Blueprint successfully!`);
  };

  const totalRevenue = days.reduce((sum, day) => sum + (day.hotelPrice || 0) + (day.transportPrice || 0) + (day.extraBedPrice || 0), 0);
  const totalNetCost = days.reduce((sum, day) => sum + (day.hotelNetCost || 0) + (day.transportNetCost || 0), 0);
  const profit = totalRevenue - totalNetCost;
  const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
  const logistics = calculateTripLogistics(days);

  // AI Luxury Storytelling Copilot per day
  const handleAiEnhanceDay = async (index: number) => {
    setEnhancingDayIndex(index);
    const toastId = toast.loading(`Polishing Day ${index + 1} with AI luxury storytelling...`);
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/ai/enhance-day`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          dayNumber: index + 1,
          currentTitle: days[index]?.title || '',
          currentActivities: days[index]?.activities || '',
          destination: inquiry.destination || 'Kashmir',
          theme: inquiry.budget || 'LUXURY'
        })
      });

      if (!response.ok) throw new Error('Failed to enhance day');
      const data = await response.json();

      if (data.success) {
        const newDays = [...days];
        newDays[index] = {
          ...newDays[index],
          title: data.title || newDays[index].title,
          activities: data.activities || newDays[index].activities
        };
        setDays(newDays);

        if (data.proTip) {
          setDayProTips(prev => ({ ...prev, [index]: data.proTip }));
        }

        toast.success(`Day ${index + 1} elevated to Aman/Belmond standard!`, { id: toastId });
      }
    } catch (error: any) {
      console.warn('Enhance day notice:', error.message);
      // Offline high-fidelity fallback
      const intel = getRouteIntelligence(days[index]?.title, days[index]?.activities, index + 1);
      const fallbackNarrative = `${days[index]?.activities ? `${days[index].activities}\n\n` : ''}Experience an exclusive morning guided excursion through whispering deodar pine forests accompanied by authentic Kashmiri saffron Kahwa. In the afternoon, savor panoramic Himalayan vistas followed by a private evening dining experience featuring traditional Wazwan delicacies beside the crackling fireplace.`;
      const newDays = [...days];
      newDays[index] = {
        ...newDays[index],
        activities: fallbackNarrative
      };
      setDays(newDays);
      setDayProTips(prev => ({
        ...prev,
        [index]: `Optimal departure: ${intel.recommendedDeparture || '09:00 AM'}. ${intel.mountainAdvisory || 'Chauffeur on standby.'}`
      }));
      toast.success(`Day ${index + 1} polished with concierge narrative!`, { id: toastId });
    } finally {
      setEnhancingDayIndex(null);
    }
  };

  // Dynamic Margin & Markup Engine
  const handleApplyTargetMargin = (pct: number) => {
    if (pct <= 0 || pct >= 80) return;
    setTargetMargin(pct);
    const multiplier = 1 / (1 - pct / 100);

    const updated = days.map(day => {
      let hotelPrice = day.hotelPrice;
      let transportPrice = day.transportPrice;

      if (day.hotelNetCost > 0) {
        hotelPrice = Math.round((day.hotelNetCost * multiplier) / 50) * 50;
      } else if (day.hotelPrice > 0) {
        hotelPrice = Math.round((day.hotelPrice * (1 + (pct - 15) / 100)) / 50) * 50;
      }

      if (day.transportNetCost > 0) {
        transportPrice = Math.round((day.transportNetCost * multiplier) / 50) * 50;
      } else if (day.transportPrice > 0) {
        transportPrice = Math.round((day.transportPrice * (1 + (pct - 15) / 100)) / 50) * 50;
      }

      return {
        ...day,
        hotelPrice,
        transportPrice
      };
    });

    setDays(updated);
    toast.success(`Target ${pct}% profit margin locked!`, {
      description: 'Room and transport selling prices have been automatically scaled.'
    });
  };

  // 1-Click WhatsApp Proposal Dispatch
  const handleQuickWhatsAppShare = () => {
    const cleanPhone = (inquiry.phone || '').replace(/[^0-9]/g, '');
    const clientName = inquiry.customerName || 'Valued Guest';
    const totalDays = days.length;
    const nights = Math.max(1, totalDays - 1);
    const highlights = days.slice(0, 4).map(d => `• Day ${d.day}: ${d.title}`).join('\n');
    const remaining = totalDays > 4 ? `• +${totalDays - 4} more bespoke chapters...\n` : '';
    const shareUrl = `${window.location.origin}/itinerary/${inquiry.id}`;

    const text = `🏔️ *KASHMIR BESPOKE ITINERARY PROPOSAL*
Exclusively curated for *${clientName}*

✨ *Duration:* ${totalDays} Days / ${nights} Nights
📍 *Expedition Highlights:*
${highlights}
${remaining}
💎 *Total Curated Package:* ₹${totalRevenue.toLocaleString()}
🏨 *Lodging Category:* ${days[0]?.hotelName ? days[0].hotelName : 'Handpicked Luxury Estates'}
🚗 *Logistics:* ${days[0]?.transport || 'Private Dedicated Luxury Chauffeur'}
☕ *Inclusions:* Daily Breakfast & Dinner, Shikara Ride, VIP Airport Chauffeur

🔗 *View Interactive Proposal Online:*
${shareUrl}

We look forward to hosting you in Paradise!
— *Kashmir Curators Concierge Team*`;

    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`, '_blank');
    toast.success('Opening WhatsApp with proposal dispatch!');
  };

  // Full AI Itinerary Regenerator
  const handleAiRegenerateAll = async (theme: string, durationStr: string) => {
    setIsAiRegenerating(true);
    const numDays = parseInt(durationStr) || 6;
    const toastId = toast.loading(`Curating bespoke ${numDays}-Day ${theme} itinerary with AI Copilot...`);
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/ai/curate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          duration: `${numDays} Days`,
          theme,
          budget: inquiry.budget || 'Luxury',
          travelers: pax.adults || 2,
          destination: inquiry.destination || 'Kashmir'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.itinerary && Array.isArray(data.itinerary) && data.itinerary.length > 0) {
          const mappedDays: ItineraryDay[] = data.itinerary.map((d: any, idx: number) => {
            const isFirst = idx === 0;
            const defaultHotel = hotels && hotels.length > 0 ? hotels[idx % hotels.length] : null;
            return {
              day: idx + 1,
              title: d.title || `Day ${idx + 1}: Kashmir Exploration`,
              activities: d.activities || d.description || '',
              hotelId: defaultHotel?.id || (isFirst ? 'h-houseboat-1' : 'h-gulmarg-1'),
              hotelName: defaultHotel?.name || (isFirst ? 'Nigeen Royal Cedar Houseboat' : 'The Highland Chalet & Alpine Spa'),
              hotelImage: defaultHotel?.image || (isFirst ? 'https://images.unsplash.com/photo-1566837493203-d2d46e01a5d6?auto=format&fit=crop&q=80&w=800' : 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&q=80&w=800'),
              transport: 'Toyota Innova Crysta VIP',
              roomType: 'Luxury Suite',
              mealPlan: 'MAP (Breakfast + Dinner)',
              bedCount: 'King Bed',
              hotelPrice: defaultHotel?.pricePerNight || 9500,
              transportPrice: 3800,
              extraBedPrice: 0,
              hotelNetCost: Math.round((defaultHotel?.pricePerNight || 9500) * 0.75),
              transportNetCost: 3000,
              paxCount: String(pax.adults || 2),
              vendorStatus: 'confirmed' as const,
              showDateTime: false
            };
          });
          setDays(mappedDays);
          setShowAiRegenModal(false);
          toast.success(`✨ Fresh ${numDays}-Day AI Itinerary created!`, { id: toastId });
          return;
        }
      }
      throw new Error('Using fallback generator');
    } catch (err) {
      if (theme.includes('SKI') || theme.includes('WINTER')) {
        loadTemplate('snow-4d');
      } else if (theme.includes('HONEYMOON') || theme.includes('ROMANCE')) {
        loadTemplate('romance-5d');
      } else {
        loadTemplate('flagship-6d');
      }
      setShowAiRegenModal(false);
      toast.success(`Bespoke ${theme} circuit generated!`, { id: toastId });
    } finally {
      setIsAiRegenerating(false);
    }
  };

  const handleAddDay = () => {
    const nextDay = days.length + 1;
    setDays([...days, {
      day: nextDay,
      title: `Day ${nextDay}: New Adventure`,
      activities: '',
      hotelId: days[days.length - 1]?.hotelId || '',
      hotelName: days[days.length - 1]?.hotelName || 'Select a luxury hotel',
      hotelImage: days[days.length - 1]?.hotelImage || '',
      transport: days[days.length - 1]?.transport || 'Private Luxury Sedan',
      roomType: days[days.length - 1]?.roomType || 'Deluxe Room',
      mealPlan: days[days.length - 1]?.mealPlan || 'MAP (Breakfast + Dinner)',
      bedCount: days[days.length - 1]?.bedCount || 'Double Bed',
      hotelPrice: days[days.length - 1]?.hotelPrice || 0,
      transportPrice: days[days.length - 1]?.transportPrice || 0,
      extraBedPrice: days[days.length - 1]?.extraBedPrice || 0,
      hotelNetCost: 0,
      transportNetCost: 0,
      paxCount: days[days.length - 1]?.paxCount || '2',
      vendorStatus: 'pending' as const,
      showDateTime: false,
      date: '',
      time: ''
    }]);
  };

  const handleRemoveDay = (dayIndex: number) => {
    if (days.length <= 1) return;
    const newDays = days.filter((_, i) => i !== dayIndex).map((d, i) => ({ ...d, day: i + 1 }));
    setDays(newDays);
  };

  const handleUpdateDay = (index: number, field: keyof ItineraryDay, value: any) => {
    const newDays = [...days];
    newDays[index] = { ...newDays[index], [field]: value };
    setDays(newDays);
  };

  const selectHotel = (dayIndex: number, hotel: any) => {
    const newDays = [...days];
    newDays[dayIndex] = {
      ...newDays[dayIndex],
      hotelId: hotel.id,
      hotelName: hotel.name,
      hotelImage: hotel.image,
      hotelPrice: hotel.pricePerNight || 0
    };
    setDays(newDays);
    setShowHotelPicker(null);
    toast.success(`Hotel updated for Day ${dayIndex + 1}`);
  };

  const addTemplate = (dayIndex: number, template: string) => {
    const currentActivities = days[dayIndex].activities;
    const updated = currentActivities ? `${currentActivities}\n- ${template}` : `- ${template}`;
    handleUpdateDay(dayIndex, 'activities', updated);
  };

  const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newDays = [...days];
        newDays[index] = { ...newDays[index], hotelImage: reader.result as string };
        setDays(newDays);
        toast.success("Hotel image uploaded");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrlApply = async (index: number, url: string) => {
    if (!url) return;
    
    // If it's already a base64/data URI, apply it directly
    if (url.startsWith('data:')) {
      const newDays = [...days];
      newDays[index] = { ...newDays[index], hotelImage: url };
      setDays(newDays);
      setTempImageUrl('');
      setShowImageActions(null);
      toast.success("Image applied successfully");
      return;
    }
    
    setIsGenerating(true);
    toast.info("Processing web image...");
    
    try {
      const proxyUrl = `${API_BASE_URL}/proxy-image?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Could not fetch image");
      
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const newDays = [...days];
        newDays[index] = { ...newDays[index], hotelImage: base64 };
        setDays(newDays);
        setTempImageUrl('');
        setShowImageActions(null);
        setIsGenerating(false);
        toast.success("Web image processed successfully");
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Proxy fetch error:", error);
      const newDays = [...days];
      newDays[index] = { ...newDays[index], hotelImage: url };
      setDays(newDays);
      setTempImageUrl('');
      setShowImageActions(null);
      setIsGenerating(false);
      toast.warning("Link applied directly (PDF visibility may vary)");
    }
  };

  const handleSaveQuote = async () => {
    setIsGenerating(true);
    const toastId = toast.loading('Saving quote to pipeline...');
    
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/inquiries/${inquiry.id}`, {

        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          quoteData: JSON.stringify(days),
          status: 'Ready for Review'
        })
      });

      if (!response.ok) throw new Error('Failed to save quote');
      
      toast.success('Quote saved and synced to pipeline!', { id: toastId });
    } catch (error) {
      console.error('Save Quote Error:', error);
      toast.error('Failed to save quote. Please try again.', { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteCuration = async () => {
    setIsGenerating(true);
    const toastId = toast.loading('Deleting inquiry curation...');
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/inquiries/${inquiry.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        toast.success('Inquiry permanently deleted.', { id: toastId });
        onBack();
      } else {
        throw new Error('Server rejected deletion request');
      }
    } catch (error: any) {
      console.error('Delete inquiry curation error:', error);
      toast.error(error.message || 'Failed to delete inquiry.', { id: toastId });
    } finally {
      setIsGenerating(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleGenerateAdvanceLink = async () => {
    setIsGeneratingLink(true);
    const toastId = toast.loading('Generating secure Razorpay payment link...');
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/payments/razorpay/create-payment-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          inquiryId: inquiry.id,
          amount: advanceAmount,
          customerEmail: inquiry.email
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate payment session');
      }
      setGeneratedLink(data.sessionUrl);
      toast.success('Razorpay payment link generated successfully!', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to create payment link: ' + err.message, { id: toastId });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleUpdateProposal = async (url: string) => {
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/inquiries/${inquiry.id}`, {

        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ proposalUrl: url })
      });

      if (!response.ok) throw new Error('Failed to update proposal link');
      toast.success('Proposal document linked successfully!');
    } catch (error) {
      toast.error('Failed to link proposal document');
    }
  };

  const generatePDF = async () => {
    if (!pdfContentRef.current) return;
    
    setIsGenerating(true);
    const toastId = toast.loading('Generating premium PDF itinerary...');

    try {
      const element = pdfContentRef.current;
      
      // Pre-load all images in the element
      const images = Array.from(element.querySelectorAll('img'));
      await Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      // Small delay to ensure styles are fully applied
      await new Promise(resolve => setTimeout(resolve, 1000));

      const pageElements = Array.from(element.querySelectorAll('.pdf-page'));
      if (pageElements.length === 0) {
        throw new Error("No PDF pages found in DOM");
      }

      const pdf = new jsPDF('p', 'mm', 'a4');

      for (let i = 0; i < pageElements.length; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        const canvas = await html2canvas(pageElements[i] as HTMLElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#faf9f6',
          windowWidth: 1200,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }

      const shortId = inquiry.id.includes('-') ? `KC-${inquiry.id.split('-')[0].toUpperCase()}` : `KC-${inquiry.id.substring(0, 8).toUpperCase()}`;
      pdf.save(`Kashmir_Itinerary_${shortId}.pdf`);
      toast.success('Itinerary generated successfully!', { id: toastId });
    } catch (error) {
      console.error('PDF Generation Error:', error);
      toast.error('Failed to generate PDF. Please try again.', { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendProposal = async () => {
    setIsGenerating(true);
    const toastId = toast.loading('Sending proposal to customer...');
    
    try {
      // First save it
      await handleSaveQuote();

      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/inquiries/${inquiry.id}/send-proposal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to send proposal');
      
      toast.success('Proposal successfully delivered!', { id: toastId });
    } catch (error) {
      console.error('Send Proposal Error:', error);
      toast.error('Failed to send proposal. Please try again.', { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const firstTwoDays = days.slice(0, 2);
  const remainingDays = days.slice(2);
  const dayPairs: ItineraryDay[][] = [];
  for (let i = 0; i < remainingDays.length; i += 2) {
    dayPairs.push(remainingDays.slice(i, i + 2));
  }
  const totalPagesCount = 2 + dayPairs.length; // Page 1, Day Pairs, Final Page

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
      {/* Premium Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white/[0.03] p-8 rounded-[3rem] border border-white/5 backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-kashmir-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        
        <div className="flex items-center gap-6 relative z-10">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack} 
            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </Button>
          <div>
            <div className="flex items-center gap-3 text-kashmir-gold text-[10px] font-black uppercase tracking-[0.4em] mb-2">
              <div className="w-6 h-[1px] bg-kashmir-gold/40" />
              <Sparkles className="w-3 h-3" />
              <span>Bespoke Proposal Builder</span>
            </div>
            <h2 className="text-4xl font-display font-bold text-white tracking-tight">
              Curating for <span className="text-kashmir-gold">{inquiry.customerName}</span>
            </h2>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto relative z-10 flex-wrap">
          <Button 
            onClick={handleQuickWhatsAppShare}
            variant="outline" 
            className="flex-1 sm:flex-none bg-[#25D366]/10 border-[#25D366]/30 hover:bg-[#25D366] hover:text-black text-[#25D366] font-bold h-14 px-6 rounded-2xl transition-all shadow-lg shadow-[#25D366]/10"
          >
            <Share2 className="w-4 h-4 mr-2" />
            <span>WhatsApp Proposal</span>
          </Button>
          <Button 
            onClick={() => setShowAiRegenModal(true)}
            variant="outline" 
            className="flex-1 sm:flex-none bg-amber-400/10 border-amber-400/30 hover:bg-amber-400 hover:text-black text-amber-300 font-bold h-14 px-6 rounded-2xl transition-all shadow-lg shadow-amber-400/10"
          >
            <Sparkles className="w-4 h-4 mr-2 text-amber-400" />
            <span>AI Regenerate</span>
          </Button>
          <Button 
            onClick={handleSaveQuote}
            disabled={isGenerating}
            variant="outline" 
            className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30 text-white font-bold h-14 px-6 rounded-2xl transition-all"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            <span>Save</span>
          </Button>
          <Button 
            onClick={generatePDF} 
            disabled={isGenerating}
            variant="outline" 
            className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30 text-white font-bold h-14 px-6 rounded-2xl transition-all"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
            <span>Export</span>
          </Button>
          <Button 
            onClick={() => {
              const url = `${window.location.origin}/itinerary/${inquiry.id}`;
              navigator.clipboard.writeText(url);
              toast.success('Shareable link copied to clipboard!', {
                description: 'Send this link to the customer to let them view the interactive itinerary.'
              });
            }}
            variant="outline" 
            className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30 text-emerald-400 font-bold h-14 px-6 rounded-2xl transition-all"
          >
            <Share2 className="w-4 h-4 mr-2" />
            <span>Link</span>
          </Button>
          <Button 
            onClick={() => {
              setGeneratedLink('');
              setShowAdvanceModal(true);
            }}
            variant="outline" 
            className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30 text-kashmir-gold font-bold h-14 px-6 rounded-2xl transition-all"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            <span>Deposit</span>
          </Button>
          <Button 
            onClick={() => setShowDeleteConfirm(true)}
            variant="outline" 
            className="flex-1 bg-red-500/10 border-red-500/20 hover:bg-red-500 hover:text-black text-red-400 font-bold h-14 px-5 rounded-2xl transition-all"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            <span>Delete</span>
          </Button>
          <Button 
            onClick={handleSendProposal} 
            disabled={isGenerating}
            className="flex-1 sm:flex-none bg-kashmir-gold text-black hover:bg-amber-500 font-black uppercase tracking-widest text-xs h-14 px-8 rounded-2xl shadow-xl shadow-kashmir-gold/20 hover:shadow-kashmir-gold/40 transition-all border-none"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
            <span>Send Proposal</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Editor Side */}
        <div className="lg:col-span-8 space-y-10">
          {/* Financial Control Panel */}
          <Card className="bg-[#0b1317]/90 backdrop-blur-3xl border border-white/10 p-8 rounded-[3rem] sticky top-8 z-30 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden group border-l-kashmir-gold border-l-4">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-700">
              <IndianRupee className="w-32 h-32 text-kashmir-gold" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-kashmir-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            
            <div className="space-y-6 relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-kashmir-gold/10 border border-kashmir-gold/20 flex items-center justify-center text-kashmir-gold">
                    <Wallet className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-1">Commercial Deck</p>
                    <h3 className="text-2xl font-display font-bold text-white tracking-tight">Yield & Margin Controls</h3>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full md:w-auto">
                  <div className="flex-1 px-5 py-2.5 bg-[#0f171b]/60 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                    <p className="text-[8px] uppercase font-black tracking-widest text-white/20 mb-0.5">Selling Price</p>
                    <p className="text-base font-bold text-white">₹{totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="flex-1 px-5 py-2.5 bg-[#0f171b]/60 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                    <p className="text-[8px] uppercase font-black tracking-widest text-white/20 mb-0.5">Wholesale Net</p>
                    <p className="text-base font-bold text-white/60">₹{totalNetCost.toLocaleString()}</p>
                  </div>
                  <div className={cn(
                    "flex-1 px-6 py-2.5 rounded-2xl border shadow-lg transition-all duration-300",
                    margin >= 20 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                    margin >= 10 ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                    "bg-red-500/10 border-red-500/20 text-red-400"
                  )}>
                    <p className="text-[8px] uppercase font-black tracking-widest opacity-60 mb-0.5">Profit Margin</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-black">{margin.toFixed(1)}%</p>
                      {margin >= 15 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Target Margin & Logistics Strip */}
              <div className="pt-4 border-t border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Target Margin:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[15, 20, 25, 30, 35].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handleApplyTargetMargin(pct)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide border transition-all",
                          Math.round(margin) === pct
                            ? "bg-amber-400 text-black border-amber-400 shadow-md shadow-amber-400/20"
                            : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                        )}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold ml-2">
                    (+₹{profit.toLocaleString()} Profit)
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-bold text-amber-300/80 bg-amber-400/5 px-3 py-1.5 rounded-xl border border-amber-400/15">
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span>Expedition Scope: ~{logistics.totalDistanceKm} km across {logistics.uniqueRoutesCount} circuits</span>
                </div>
              </div>
            </div>
          </Card>

          {/* 1-Click Master Itinerary Blueprints */}
          <div className="p-6 rounded-[2rem] bg-gradient-to-r from-amber-500/10 via-white/[0.02] to-transparent border border-amber-400/20 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">1-Click Master Itinerary Blueprints</span>
              </div>
              <p className="text-[11px] text-white/50">Instantly populate high-conversion itineraries with curated hotels, route drive times, and pricing.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => loadTemplate('flagship-6d')}
                className="bg-white/5 border-white/10 hover:bg-amber-400 hover:text-black hover:border-amber-400 text-xs font-bold rounded-xl h-9 px-3.5 transition-all"
              >
                6D Flagship
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => loadTemplate('romance-5d')}
                className="bg-white/5 border-white/10 hover:bg-amber-400 hover:text-black hover:border-amber-400 text-xs font-bold rounded-xl h-9 px-3.5 transition-all"
              >
                5D Romance
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => loadTemplate('snow-4d')}
                className="bg-white/5 border-white/10 hover:bg-amber-400 hover:text-black hover:border-amber-400 text-xs font-bold rounded-xl h-9 px-3.5 transition-all"
              >
                4D Gulmarg Ski
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAiRegenModal(true)}
                className="bg-amber-400/15 border-amber-400/30 text-amber-300 hover:bg-amber-400 hover:text-black text-xs font-black uppercase rounded-xl h-9 px-3.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                AI Studio
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between px-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <Calendar className="w-5 h-5 text-kashmir-gold" />
      Timeline Editor
            </h3>
            <Badge className="bg-white/5 text-white/40 border-none font-bold uppercase tracking-widest text-[9px]">
              {days.length} Days Total
            </Badge>
          </div>

          <div className="space-y-8">
            {days.map((day, index) => (
              <div key={index} className="relative group">
                <Card className="bg-[#0a0f12]/40 bg-white/[0.03] border-white/5 p-10 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden transition-all duration-500 hover:border-white/20 group-hover:shadow-2xl group-hover:shadow-black/50">
                  <div className="absolute top-0 left-0 w-2 h-full bg-kashmir-gold/20 group-hover:bg-kashmir-gold transition-all duration-700" />
                  
                  {/* Card Header: Day & Title */}
                  <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
                    <div className="flex items-center gap-6 flex-1 w-full">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-kashmir-gold text-2xl font-black shadow-inner">
                        {day.day}
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input 
                          value={day.title}
                          onChange={(e) => handleUpdateDay(index, 'title', e.target.value)}
                          className="bg-transparent border-none text-2xl font-display font-bold text-white p-0 h-auto focus-visible:ring-0 placeholder:text-white/10"
                          placeholder="Untitled Day"
                        />
                        <div className="flex flex-wrap items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-white/30">
                          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-white/20" /> Full Day Plan</span>
                          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Live Preview</span>
                          <div className="h-4 w-px bg-white/10" />
                          <label className="flex items-center gap-2.5 cursor-pointer select-none text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-kashmir-gold transition-colors">
                            <input 
                              type="checkbox" 
                              checked={day.showDateTime || false} 
                              onChange={(e) => handleUpdateDay(index, 'showDateTime', e.target.checked)}
                              className="w-4 h-4 rounded border-white/20 bg-white/5 text-kashmir-gold focus:ring-0 focus:ring-offset-0 cursor-pointer accent-kashmir-gold"
                            />
                            <span>Set Date & Time</span>
                          </label>

                          {day.showDateTime && (
                            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                              <div className="relative flex items-center">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button
                                      type="button"
                                      className="bg-[#0f171b]/80 border border-white/10 rounded-xl h-10 pl-9 pr-8 text-xs font-bold text-white hover:bg-white/[0.08] transition-all w-38 text-left relative flex items-center"
                                    >
                                      <Calendar className="absolute left-3 w-3.5 h-3.5 text-kashmir-gold" />
                                      <span className="truncate">
                                        {day.date ? format(new Date(day.date), 'dd-MM-yyyy') : 'dd-mm-yyyy'}
                                      </span>
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0 bg-[#0b1317]/95 border border-white/10 backdrop-blur-md rounded-2xl shadow-2xl" align="start">
                                    <UICalendar
                                      mode="single"
                                      selected={day.date ? new Date(day.date) : undefined}
                                      onSelect={(date) => {
                                        if (date) {
                                          const yyyy = date.getFullYear();
                                          const mm = String(date.getMonth() + 1).padStart(2, '0');
                                          const dd = String(date.getDate()).padStart(2, '0');
                                          handleUpdateDay(index, 'date', `${yyyy}-${mm}-${dd}`);
                                        }
                                      }}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <div className="relative flex items-center">
                                <Clock className="w-3.5 h-3.5 absolute left-3 text-kashmir-gold" />
                                <input 
                                  type="time" 
                                  value={day.time || ''} 
                                  onChange={(e) => handleUpdateDay(index, 'time', e.target.value)}
                                  className="bg-[#0f171b]/80 border border-white/10 rounded-xl h-10 pl-9 pr-3 text-xs font-bold text-white focus:outline-none focus:border-kashmir-gold/40 focus:bg-white/[0.08] transition-all w-28 color-scheme-dark"
                                  style={{ colorScheme: 'dark' }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Dynamic Route & Drive Intelligence Bar */}
                        {(() => {
                          const routeIntel = getRouteIntelligence(day.title, day.activities, day.day);
                          return (
                            <div className="mt-3 p-3.5 rounded-2xl bg-amber-500/[0.04] border border-amber-500/15 flex flex-wrap items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
                                  <Compass className="w-4 h-4 animate-spin-slow" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 font-black text-white/90">
                                    <span>{routeIntel.route}</span>
                                    <Badge className="bg-white/10 text-amber-300 border-none font-bold text-[9px] px-2 py-0.5">
                                      {routeIntel.distanceKm} km
                                    </Badge>
                                    <Badge className="bg-emerald-500/15 text-emerald-400 border-none font-bold text-[9px] px-2 py-0.5">
                                      {routeIntel.driveTime}
                                    </Badge>
                                  </div>
                                  <p className="text-[10px] text-white/45 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                    <span className="text-amber-400/70 font-semibold">{routeIntel.elevation}</span>
                                    <span>•</span>
                                    <span className="truncate max-w-md">{routeIntel.scenicHighlight}</span>
                                  </p>
                                </div>
                              </div>
                              {routeIntel.mountainAdvisory && (
                                <div className="flex items-center gap-1.5 text-[10px] font-medium text-amber-400/80 bg-amber-400/10 px-3 py-1.5 rounded-xl border border-amber-400/20 max-w-xs xl:max-w-none">
                                  <Info className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">{routeIntel.mountainAdvisory}</span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemoveDay(index)}
                      className="text-white/10 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="space-y-12">
                    {/* Top Section: Activities & Hotel Selection */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      {/* Left Column: Activities */}
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1 flex items-center gap-2">
                              <ImageIcon className="w-3 h-3 text-kashmir-gold" /> Experiences & Activities
                            </label>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={enhancingDayIndex === index}
                              onClick={() => handleAiEnhanceDay(index)}
                              className="h-7 px-3 rounded-xl bg-amber-400/10 border-amber-400/30 hover:bg-amber-400 hover:text-black text-amber-300 text-[10px] font-black uppercase tracking-wider transition-all shadow-sm shadow-amber-500/10"
                            >
                              {enhancingDayIndex === index ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                                  <span>Curating...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3 h-3 mr-1.5 text-amber-400" />
                                  <span>✨ AI Polish Day</span>
                                </>
                              )}
                            </Button>
                          </div>
                          <Textarea 
                            value={day.activities}
                            onChange={(e) => handleUpdateDay(index, 'activities', e.target.value)}
                            placeholder="Craft the magic here..."
                            className="bg-[#0f171b]/60 border border-white/5 rounded-[2rem] min-h-[200px] focus:border-kashmir-gold/30 focus:bg-[#0f171b]/90 text-white/90 leading-relaxed transition-all duration-300 focus:ring-0 focus-visible:ring-0 placeholder:text-white/10"
                          />
                        </div>

                        {dayProTips[index] && (
                          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-emerald-300 animate-in fade-in duration-300">
                            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-black text-[9px] uppercase tracking-widest text-emerald-400 mr-2">Concierge Secret:</span>
                              <span className="text-white/90 leading-relaxed">{dayProTips[index]}</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-2">
                          {activityTemplates.slice(0, 3).map((template, tIdx) => (
                            <button
                              key={tIdx}
                              onClick={() => addTemplate(index, template)}
                              className="text-[9px] font-bold px-4 py-2 rounded-full bg-white/5 border border-white/5 text-white/40 hover:text-kashmir-gold hover:border-kashmir-gold/30 hover:bg-kashmir-gold/5 transition-all duration-300"
                            >
                              + {template.split(' ').slice(0, 3).join(' ')}...
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Right Column: Hotel Selection */}
                      <div className="space-y-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1 flex items-center gap-2">
                            <HotelIcon className="w-3 h-3 text-amber-400" /> Accommodation Selection
                          </label>
                          <div className="flex gap-4">
                            <div 
                              onClick={() => setShowImageActions(index)}
                              className="w-20 h-20 rounded-2xl bg-[#0f171b]/60 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden relative cursor-pointer hover:bg-white/10 transition-all duration-300 group/himg shadow-inner"
                            >
                              {day.hotelImage ? (
                                <img src={day.hotelImage} className="w-full h-full object-cover group-hover/himg:scale-110 transition-transform duration-500" />
                              ) : (
                                <ImageIcon className="w-7 h-7 text-white/10" />
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/himg:opacity-100 flex items-center justify-center transition-opacity">
                                <Plus className="w-5 h-5 text-white" />
                              </div>
                            </div>
                            <div className="flex-1 relative">
                              <Input 
                                value={day.hotelName}
                                onChange={(e) => handleUpdateDay(index, 'hotelName', e.target.value)}
                                className="bg-[#0f171b]/60 border border-white/5 rounded-2xl h-20 pl-14 pr-12 focus:border-kashmir-gold/30 font-bold text-lg placeholder:text-white/10 transition-colors focus:bg-[#0f171b]/90"
                                placeholder="Select Luxury Stay..."
                              />
                              <HotelIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                            </div>
                            <Button 
                              onClick={() => setShowHotelPicker(index)}
                              className="h-20 w-20 rounded-2xl bg-kashmir-gold text-black hover:bg-amber-500 shadow-xl shadow-kashmir-gold/20 shrink-0 group/pb"
                            >
                              <Plus className="w-8 h-8 group-hover/pb:rotate-90 transition-transform duration-300" />
                            </Button>
                          </div>
                        </div>

                        {/* Accommodation Details Grid */}
                        {day.hotelName && (
                          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500 bg-[#0f171b]/40 border border-white/5 p-6 rounded-[2rem]">
                            {/* Row 1: Room, Plan, Pax */}
                            <div className="grid grid-cols-3 gap-6">
                              <div className="space-y-3">
                                <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-1 flex items-center gap-2"><Bed className="w-3.5 h-3.5 text-kashmir-gold/50" /> Room Type</label>
                                <Select value={day.roomType} onValueChange={(value) => handleUpdateDay(index, 'roomType', value)}>
                                  <SelectTrigger className="bg-[#0f171b]/80 border-white/10 rounded-2xl h-14 font-bold text-xs focus:border-kashmir-gold/30 hover:border-white/20 transition-all"><SelectValue /></SelectTrigger>
                                  <SelectContent className="bg-[#0b1317] border-white/10 text-white">
                                    <SelectItem value="Deluxe Room">Deluxe Room</SelectItem>
                                    <SelectItem value="Premium Room">Premium Room</SelectItem>
                                    <SelectItem value="Luxury Suite">Luxury Suite</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-3">
                                <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-1 flex items-center gap-2"><Coffee className="w-3.5 h-3.5 text-kashmir-gold/50" /> Meal Plan</label>
                                <Select value={day.mealPlan} onValueChange={(value) => handleUpdateDay(index, 'mealPlan', value)}>
                                  <SelectTrigger className="bg-[#0f171b]/80 border-white/10 rounded-2xl h-14 font-bold text-xs focus:border-kashmir-gold/30 hover:border-white/20 transition-all"><SelectValue /></SelectTrigger>
                                  <SelectContent className="bg-[#0b1317] border-white/10 text-white">
                                    <SelectItem value="EP (Room Only)">EP (Room Only)</SelectItem>
                                    <SelectItem value="CP (Breakfast)">CP (Breakfast)</SelectItem>
                                    <SelectItem value="MAP (Breakfast + Dinner)">MAP (Bf + Din)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-3">
                                <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-1 flex items-center gap-2"><Users className="w-3.5 h-3.5 text-kashmir-gold/50" /> Pax Count</label>
                                <Input 
                                  value={day.paxCount} 
                                  onChange={(e) => handleUpdateDay(index, 'paxCount', e.target.value)} 
                                  className="bg-[#0f171b]/80 border-white/10 rounded-2xl h-14 font-bold text-center text-sm focus:border-kashmir-gold/30 hover:border-white/20 transition-all" 
                                />
                              </div>
                            </div>

                            {/* Row 2: Stay Pricing */}
                            <div className="grid grid-cols-2 gap-6 p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                              <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-kashmir-gold/50 ml-1 flex items-center gap-2">Stay Selling Price</label>
                                <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-kashmir-gold font-bold">₹</span>
                                  <Input 
                                    type="number"
                                    value={day.hotelPrice === 0 ? '' : day.hotelPrice}
                                    onChange={(e) => handleUpdateDay(index, 'hotelPrice', parseInt(e.target.value) || 0)}
                                    className="bg-[#0f171b]/80 border-white/10 rounded-xl h-12 pl-10 font-bold text-white focus:border-kashmir-gold/30 hover:border-white/20 transition-all"
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-white/20 ml-1 flex items-center gap-2">Stay Net Cost</label>
                                <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 font-bold">₹</span>
                                  <Input 
                                    type="number"
                                    value={day.hotelNetCost === 0 ? '' : day.hotelNetCost}
                                    onChange={(e) => handleUpdateDay(index, 'hotelNetCost', parseInt(e.target.value) || 0)}
                                    className="bg-[#0f171b]/80 border-white/10 rounded-xl h-12 pl-10 font-bold text-white/40 focus:border-white/20 hover:border-white/20 transition-all"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Transport & Financial Strip (FULL WIDTH) */}
                    <div className="pt-12 border-t border-white/5">
                      <div className="space-y-8">
                        <div className="flex justify-between items-center px-2">
                          <label className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40 flex items-center gap-3">
                            <Car className="w-4 h-4 text-emerald-400" /> Operational Logistics & Financials
                          </label>
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-none px-3 py-1 text-[9px] font-bold uppercase">
                            Operational Preview Active
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-end bg-[#0f171b]/40 p-10 rounded-[2.5rem] border border-white/5 shadow-inner hover:border-white/10 transition-all duration-300">
                          {/* Transport Config */}
                          <div className="xl:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-4">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-1">Assigned Vehicle</p>
                              <Select value={day.transport} onValueChange={(value) => handleUpdateDay(index, 'transport', value)}>
                                <SelectTrigger className="bg-[#0f171b]/80 border-white/10 rounded-2xl h-16 focus:ring-kashmir-gold/30 focus:border-kashmir-gold/30 hover:border-white/20 transition-all font-bold text-sm">
                                  <SelectValue placeholder="Select Transport" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0b1317] border-white/10 text-white">
                                  <SelectItem value="Private Luxury Sedan">Private Luxury Sedan</SelectItem>
                                  <SelectItem value="Luxury SUV (Innova)">Luxury SUV (Innova)</SelectItem>
                                  <SelectItem value="Tempo Traveller">Tempo Traveller</SelectItem>
                                  <SelectItem value="Urbania Luxury">Urbania Luxury</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-4">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-1">Cab Selling Price</label>
                              <div className="relative group/input">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-kashmir-gold text-lg font-bold z-10">₹</div>
                                <Input 
                                  type="number"
                                  value={day.transportPrice === 0 ? '' : day.transportPrice}
                                  onChange={(e) => handleUpdateDay(index, 'transportPrice', parseInt(e.target.value) || 0)}
                                  className="bg-[#0f171b]/80 border border-white/10 rounded-2xl h-16 pl-12 focus:border-kashmir-gold/30 font-bold text-xl text-white transition-all hover:border-white/20 focus:bg-[#0f171b]/95"
                                />
                              </div>
                            </div>
                            <div className="space-y-4">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/30 ml-1">Cab Net Cost</label>
                              <div className="relative group/input">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400 text-lg font-bold z-10">₹</div>
                                <Input 
                                  type="number"
                                  value={day.transportNetCost === 0 ? '' : day.transportNetCost}
                                  onChange={(e) => handleUpdateDay(index, 'transportNetCost', parseInt(e.target.value) || 0)}
                                  className="bg-[#0f171b]/80 border border-blue-500/10 rounded-2xl h-16 pl-12 focus:border-blue-400/30 font-bold text-xl text-blue-300/60 transition-all hover:border-white/20 focus:bg-[#0f171b]/95"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Operational Status */}
                          <div className="xl:col-span-3 space-y-4">
                            <div className="flex justify-between items-center px-1">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Operational Status</p>
                              <Badge className={cn(
                                "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border-none shadow-lg",
                                day.vendorStatus === 'confirmed' ? "bg-emerald-500/20 text-emerald-400 shadow-emerald-500/10" :
                                day.vendorStatus === 'waitlist' ? "bg-red-500/20 text-red-400 shadow-red-500/10" :
                                "bg-amber-500/20 text-amber-500 shadow-amber-500/10"
                              )}>
                                {day.vendorStatus}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1.5 p-1.5 bg-[#0a0f12]/60 rounded-2xl border border-white/5">
                              {(['pending', 'confirmed', 'waitlist'] as const).map((status) => (
                                <button
                                  key={status}
                                  onClick={() => handleUpdateDay(index, 'vendorStatus', status)}
                                  className={cn(
                                    "flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all duration-500 truncate px-2 border border-transparent",
                                    day.vendorStatus === status 
                                      ? status === 'confirmed' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]" :
                                        status === 'waitlist' ? "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]" :
                                        "bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                                      : "text-white/20 hover:text-white/50 hover:bg-white/[0.02]"
                                  )}
                                >
                                  {status}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Hotel Picker Overlay */}
                {showHotelPicker === index && (
                  <div className="absolute inset-0 z-50 bg-[#0a0f12]/95 backdrop-blur-2xl rounded-[2.5rem] p-12 overflow-y-auto animate-in zoom-in-95 duration-500 border border-kashmir-gold/20">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                      <div className="space-y-1">
                        <h4 className="text-2xl font-bold text-white">Kashmir Curators Collection</h4>
                        <p className="text-xs text-kashmir-gold/60 uppercase tracking-widest font-bold">Select a luxury stay for Day {day.day}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-2xl border border-white/5">
                          {['ALL', 'Srinagar', 'Gulmarg', 'Pahalgam', 'Sonamarg'].map((loc) => (
                            <button
                              key={loc}
                              type="button"
                              onClick={() => setHotelFilterLocation(loc)}
                              className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                                hotelFilterLocation === loc 
                                  ? "bg-amber-400 text-black font-black"
                                  : "text-white/60 hover:text-white hover:bg-white/5"
                              )}
                            >
                              {loc}
                            </button>
                          ))}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setShowHotelPicker(null)} className="rounded-2xl hover:bg-white/10 h-10 w-10">
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {hotels?.filter(hotel => hotelFilterLocation === 'ALL' || (hotel.location && hotel.location.toLowerCase().includes(hotelFilterLocation.toLowerCase()))).map((hotel) => (
                        <Card 
                          key={hotel.id} 
                          onClick={() => selectHotel(index, hotel)}
                          className="bg-white/5 border-white/5 p-5 rounded-3xl hover:border-kashmir-gold/50 cursor-pointer transition-all flex flex-col gap-5 group/hitem hover:bg-white/[0.08]"
                        >
                          <div className="h-40 rounded-2xl overflow-hidden relative">
                            <img src={hotel.image} className="w-full h-full object-cover group-hover/hitem:scale-110 transition-transform duration-700" />
                            <Badge className="absolute top-3 right-3 bg-black/60 backdrop-blur-md border-none font-bold text-[10px]">₹{hotel.pricePerNight.toLocaleString()}</Badge>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-white mb-1">{hotel.name}</p>
                            <p className="text-xs text-white/40 flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {hotel.location}</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Image Configurator Overlay */}
                {showImageActions === index && (
                  <div className="absolute inset-0 z-[60] bg-[#0a0f12]/98 backdrop-blur-3xl rounded-[2.5rem] flex flex-col items-center justify-center gap-10 p-16 animate-in zoom-in-95 duration-300">
                    <div className="text-center space-y-3">
                      <h4 className="text-3xl font-display font-bold text-white">Visual Storytelling</h4>
                      <p className="text-xs text-kashmir-gold uppercase tracking-[0.4em] font-black opacity-60">Configure the display image for {day.hotelName || 'this stay'}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-8 w-full max-w-lg">
                      <div className="relative group/up">
                        <div className="h-44 rounded-[2.5rem] bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-4 group-hover/up:border-kashmir-gold/50 group-hover/up:bg-kashmir-gold/5 transition-all duration-500">
                          <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center group-hover/up:scale-110 transition-transform shadow-inner">
                            <Plus className="w-8 h-8 text-white/20 group-hover/up:text-kashmir-gold" />
                          </div>
                          <span className="text-sm font-bold text-white/40">Local Archive</span>
                        </div>
                        <input 
                          type="file" 
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            handleImageUpload(index, e);
                            setShowImageActions(null);
                          }}
                        />
                      </div>

                      <button 
                        onClick={() => {
                          if (day.hotelName) {
                            window.open(`https://www.google.com/search?q=${encodeURIComponent(day.hotelName)}+hotel+kashmir&tbm=isch`, '_blank');
                          } else {
                            toast.error("Enter hotel name first");
                          }
                          setShowImageActions(null);
                        }}
                        className="h-44 rounded-[2.5rem] bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-4 hover:border-kashmir-gold/50 hover:bg-kashmir-gold/5 transition-all duration-500 group/sh"
                      >
                        <div className="w-16 h-16 rounded-[1.5rem] bg-kashmir-gold/10 flex items-center justify-center group/sh:scale-110 transition-transform">
                          <Search className="w-8 h-8 text-kashmir-gold" />
                        </div>
                        <span className="text-sm font-bold text-white/40">Web Intelligence</span>
                      </button>
                    </div>
                    
                    <div className="w-full max-w-md pt-8 border-t border-white/5 space-y-4">
                      <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-black text-center">Or Paste Direct Image Link</p>
                      <div className="flex gap-2">
                        <Input 
                          value={tempImageUrl}
                          onChange={(e) => setTempImageUrl(e.target.value)}
                          placeholder="https://images.unsplash.com/photo..."
                          className="bg-white/5 border-white/5 rounded-2xl h-12 text-sm focus:border-kashmir-gold/30"
                        />
                        <Button 
                          onClick={() => handleImageUrlApply(showImageActions!, tempImageUrl)}
                          className="bg-kashmir-gold text-black hover:bg-amber-500 rounded-2xl h-12 px-6 font-bold"
                        >
                          Apply
                        </Button>
                      </div>
                    </div>

                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        setShowImageActions(null);
                        setTempImageUrl('');
                      }}
                      className="text-white/20 hover:text-white rounded-xl text-[10px] uppercase font-black tracking-widest transition-all"
                    >
                      Dismiss
                    </Button>
                  </div>
                )}
              </div>
            ))}

            <Button 
              onClick={handleAddDay}
              className="w-full h-24 bg-white/[0.02] border-2 border-dashed border-white/5 hover:border-kashmir-gold/40 hover:bg-white/[0.05] text-white/20 hover:text-kashmir-gold rounded-[2rem] transition-all duration-700 gap-3 group"
            >
              <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-black uppercase tracking-[0.3em] text-[10px]">Add Next Chapter</span>
            </Button>
          </div>
        </div>

        {/* Customer Sidebar */}
        <div className="lg:col-span-4">
          <div className="sticky top-32 space-y-8">
            <Card className="bg-[#0a0f12]/80 bg-gradient-to-br from-white/[0.05] to-transparent border-white/10 p-10 rounded-[3rem] backdrop-blur-2xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-kashmir-gold to-transparent" />
              
              <h3 className="text-2xl font-display font-bold text-white mb-8 flex items-center gap-3">
                <FileText className="w-6 h-6 text-kashmir-gold" />
                Inquiry Brief
              </h3>
              
              <div className="space-y-6">
                <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Destination</p>
                  <p className="text-lg font-bold text-white">{inquiry.destination}</p>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Group & Stay</p>
                  <p className="text-lg font-bold text-white mb-4">{days.length} Days ({days.length - 1} Nights)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8px] text-white/20 uppercase font-black tracking-widest ml-1">Adults</label>
                      <Input 
                        type="number" 
                        value={pax.adults === 0 ? '' : pax.adults} 
                        onChange={(e) => setPax({...pax, adults: parseInt(e.target.value) || 0})}
                        className="bg-white/5 border-white/5 h-10 rounded-xl text-white font-bold focus:border-kashmir-gold/30"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-white/20 uppercase font-black tracking-widest ml-1">Children</label>
                      <Input 
                        type="number" 
                        value={pax.children === 0 ? '' : pax.children} 
                        onChange={(e) => setPax({...pax, children: parseInt(e.target.value) || 0})}
                        className="bg-white/5 border-white/5 h-10 rounded-xl text-white font-bold focus:border-kashmir-gold/30"
                      />
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Budget Target</p>
                  <Badge className="bg-kashmir-gold text-black font-black uppercase text-[10px] px-3 py-1 rounded-lg">
                    {inquiry.budget} Experience
                  </Badge>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Primary Contact</p>
                  <p className="text-base font-bold text-white/80 mb-1">{inquiry.phone}</p>
                  <p className="text-xs text-white/20 font-medium">{inquiry.email}</p>
                </div>

                {inquiry.flightDetails && (() => {
                  try {
                    const flight = JSON.parse(inquiry.flightDetails);
                    if (!flight || !flight.includeFlights) return null;
                    return (
                      <div className="p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10 text-left animate-in fade-in duration-500">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-3 flex items-center gap-2">
                          <Plane className="w-4 h-4 text-blue-400 animate-pulse" /> Flight Request
                        </p>
                        <div className="space-y-2.5 text-xs">
                          <p className="font-bold text-white/90 uppercase">{flight.origin} &rarr; {flight.destination}</p>
                          <p className="text-white/40">{flight.tripType === 'roundtrip' ? 'Round Trip' : 'One Way'} • <span className="capitalize">{flight.cabinClass ? flight.cabinClass.replace('_', ' ') : 'Economy'}</span></p>
                          <p className="text-white/40">Timing: <span className="capitalize">{flight.departureTimePref}</span></p>
                          {flight.directOnly && <p className="text-kashmir-gold font-bold text-[9px] uppercase tracking-wider">Direct Flights Only</p>}
                        </div>
                      </div>
                    );
                  } catch (e) {
                    return null;
                  }
                })()}
              </div>

              <div className="mt-10 p-6 rounded-3xl bg-kashmir-gold/5 border border-kashmir-gold/10">
                <div className="flex items-center gap-2 text-kashmir-gold text-[10px] font-black uppercase tracking-widest mb-2">
                  <Zap className="w-3 h-3" /> Expert Insight
                </div>
                <p className="text-xs text-white/40 leading-relaxed italic">
                  "This client prefers {inquiry.budget.toLowerCase()} stays. Recommend the houseboats for Day 1 to create that immediate 'Paradise' impact."
                </p>
              </div>

              {/* Total Calculation & Exclusions Input */}
              <div className="mt-8 pt-8 border-t border-white/5 space-y-8">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-white/60">Estimated Total Package</h4>
                  <div className="text-3xl font-display font-bold text-kashmir-gold">
                    ₹{totalCost.toLocaleString()}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1 flex items-center gap-2">
                    <ShieldX className="w-3 h-3 text-red-400" /> Package Exclusions
                  </label>
                  <Textarea 
                    value={exclusions}
                    onChange={(e) => setExclusions(e.target.value)}
                    placeholder="What's not included?"
                    className="bg-white/5 border-white/5 rounded-3xl min-h-[120px] focus:border-red-400/30 text-white/60 text-xs leading-relaxed"
                  />
                </div>
              </div>

              {/* Proposal Document Link */}
              <div className="mt-8 pt-8 border-t border-white/5 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-3">
                    <FileText className="w-5 h-5 text-emerald-400" /> Professional Proposal
                  </h4>
                  {proposalUrl && (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-none px-2 py-0.5 text-[8px] font-black uppercase tracking-widest">
                      Linked
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="relative group/prop">
                    <Input 
                      value={proposalUrl}
                      onChange={(e) => setProposalUrl(e.target.value)}
                      placeholder="Paste PDF Link (Google Drive/S3)..."
                      className="bg-white/5 border-white/5 h-12 rounded-xl text-[11px] pl-10 focus:border-emerald-500/30 font-medium"
                    />
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      onClick={() => handleUpdateProposal(proposalUrl)}
                      className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold h-12 rounded-xl text-[10px] uppercase tracking-widest"
                    >
                      Update Link
                    </Button>
                    <div className="relative">
                      <Button 
                        variant="ghost"
                        className="w-full bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 text-emerald-400 font-bold h-12 rounded-xl text-[10px] uppercase tracking-widest"
                      >
                        <Upload className="w-3.5 h-3.5 mr-2" /> Attach PDF Document
                      </Button>
                      <input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const mockUrl = `https://storage.kashmircurators.com/proposals/${file.name.replace(/\s+/g, '_')}`;
                            setProposalUrl(mockUrl);
                            handleUpdateProposal(mockUrl);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* OFF-SCREEN PDF CONTENT (Used for generation) */}
      <div className="fixed -left-[10000px] top-0 pointer-events-none opacity-0">
        <div 
          ref={pdfContentRef}
          className="w-[1200px] bg-transparent p-0"
        >
          {/* Page 1 */}
          <div className="pdf-page bg-[#faf9f6] text-slate-900 font-sans p-24 w-[1200px] h-[1697px] relative flex flex-col justify-between" style={{ boxSizing: 'border-box' }}>
            <div>
              {/* PDF Cover Header */}
              <div className="relative mb-14">
                <div className="absolute top-[-40px] right-[-40px] w-64 h-64 bg-amber-50 rounded-full opacity-50 blur-3xl" />
                <div className="flex justify-between items-end border-b-8 border-amber-500 pb-10 relative z-10">
                  <div className="flex items-center gap-8">
                    <Logo className="w-64 h-auto text-slate-900" />
                    <div className="h-16 w-px bg-amber-500/20" />
                    <div>
                      <p className="text-amber-700 font-black uppercase tracking-[0.4em] text-[10px] mb-1">Luxury Travel Curators</p>
                      <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest italic">Exclusively for {inquiry.customerName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-2xl text-slate-900 tracking-widest">{inquiry.id.includes('-') ? `KC-${inquiry.id.split('-')[0].toUpperCase()}` : `KC-${inquiry.id.substring(0, 8).toUpperCase()}`}</p>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Proposal Created: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Client Details Section */}
              <div className="grid grid-cols-3 gap-12 mb-14 bg-slate-50 p-10 rounded-[2rem] border border-slate-100">
                <div className="col-span-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Bespoke Itinerary for</h3>
                  <p className="text-3xl font-serif font-bold text-slate-900 mb-2">{inquiry.customerName}</p>
                  <div className="flex gap-6 mt-6">
                    <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                      <MapPin className="w-4 h-4 text-amber-500" /> {inquiry.destination}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                      <Calendar className="w-4 h-4 text-amber-500" /> {days.length} Days ({days.length - 1} Nights)
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                      <Users className="w-4 h-4 text-amber-500" /> {pax.adults} Adults {pax.children > 0 && `• ${pax.children} Children`}
                    </div>
                  </div>
                </div>
                <div className="text-right border-l border-slate-200 pl-12 flex flex-col justify-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Travel Class</p>
                  <p className="text-xl font-bold text-amber-600 uppercase tracking-widest">{inquiry.budget}</p>
                </div>
              </div>

              {/* Day 1 & Day 2 in Page 1 */}
              <div className="space-y-12">
                {firstTwoDays.map((day) => (
                  <div key={day.day} className="relative pl-24 border-l-4 border-amber-500/10">
                    <div className="absolute left-[-22px] top-0 w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white font-black text-xl shadow-xl shadow-amber-500/20">
                      {day.day}
                    </div>
                    
                    <div className="mb-2">
                      <h3 className="text-3xl font-serif font-bold text-slate-900 mb-2">{day.title}</h3>
                      {day.showDateTime && (day.date || day.time) && (
                        <div className="flex items-center gap-4 text-xs font-bold text-amber-700 uppercase tracking-wider mb-4 bg-amber-500/5 py-2 px-4 rounded-xl border border-amber-500/10 w-fit">
                          {day.date && (
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-amber-600" />
                              {formatPDFDate(day.date)}
                            </span>
                          )}
                          {day.date && day.time && <span className="text-amber-500/30">•</span>}
                          {day.time && (
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              {formatPDFTime(day.time)}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="bg-slate-50/50 rounded-[2rem] p-10 border border-slate-100/50">
                        <div className="flex flex-col md:flex-row gap-8 mb-10">
                          <div className="flex-1">
                            <p className="text-slate-700 text-lg leading-relaxed whitespace-pre-line">{day.activities}</p>
                          </div>
                          {day.hotelImage && (
                            <div className="w-full md:w-64 h-48 rounded-2xl overflow-hidden shadow-lg shrink-0 border-4 border-white">
                              <img 
                                src={day.hotelImage} 
                                alt={day.hotelName} 
                                className="w-full h-full object-cover"
                                crossOrigin="anonymous"
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-8">
                          <div className="flex items-center gap-5 flex-1">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                              <HotelIcon className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Accommodation</p>
                              <p className="text-base font-bold text-slate-900">{day.hotelName}</p>
                              <p className="text-[10px] text-amber-600 font-bold mt-0.5">
                                {day.roomType} • {day.mealPlan} • Stay: ₹{day.hotelPrice.toLocaleString()}
                                {day.extraBedPrice > 0 && ` • Extra Bed: ₹${day.extraBedPrice.toLocaleString()}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-5 flex-1 pl-12 border-l border-slate-100">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                              <Car className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Transportation</p>
                              <p className="text-base font-bold text-slate-900">{day.transport}</p>
                              <p className="text-[10px] text-amber-600 font-bold mt-0.5">Premium Service • ₹{day.transportPrice.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between items-center border-t border-slate-200/50 pt-6 mt-6">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Kashmir Curators Proposal</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Page 1 of {totalPagesCount}</p>
            </div>
          </div>

          {/* Day Pairs (Page 2..N) */}
          {dayPairs.map((pair, pIdx) => {
            const pageNum = pIdx + 2;
            return (
              <div key={pIdx} className="pdf-page bg-[#faf9f6] text-slate-900 font-sans p-24 w-[1200px] h-[1697px] relative flex flex-col justify-between" style={{ boxSizing: 'border-box' }}>
                <div>
                  <div className="flex justify-between items-center border-b-2 border-amber-500/20 pb-6 mb-12">
                    <p className="text-amber-700 font-black uppercase tracking-[0.4em] text-[10px]">Itinerary Continued</p>
                    <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">{inquiry.customerName}</p>
                  </div>
                  
                  <div className="space-y-12">
                    {pair.map((day) => (
                      <div key={day.day} className="relative pl-24 border-l-4 border-amber-500/10">
                        <div className="absolute left-[-22px] top-0 w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white font-black text-xl shadow-xl shadow-amber-500/20">
                          {day.day}
                        </div>
                        
                        <div className="mb-2">
                          <h3 className="text-3xl font-serif font-bold text-slate-900 mb-2">{day.title}</h3>
                          {day.showDateTime && (day.date || day.time) && (
                            <div className="flex items-center gap-4 text-xs font-bold text-amber-700 uppercase tracking-wider mb-6 bg-amber-500/5 py-2 px-4 rounded-xl border border-amber-500/10 w-fit">
                              {day.date && (
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                                  {formatPDFDate(day.date)}
                                </span>
                              )}
                              {day.date && day.time && <span className="text-amber-500/30">•</span>}
                              {day.time && (
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  {formatPDFTime(day.time)}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="bg-slate-50/50 rounded-[2rem] p-10 border border-slate-100/50">
                            <div className="flex flex-col md:flex-row gap-8 mb-10">
                              <div className="flex-1">
                                <p className="text-slate-700 text-lg leading-relaxed whitespace-pre-line">{day.activities}</p>
                              </div>
                              {day.hotelImage && (
                                <div className="w-full md:w-64 h-48 rounded-2xl overflow-hidden shadow-lg shrink-0 border-4 border-white">
                                  <img 
                                    src={day.hotelImage} 
                                    alt={day.hotelName} 
                                    className="w-full h-full object-cover"
                                    crossOrigin="anonymous"
                                  />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-8">
                              <div className="flex items-center gap-5 flex-1">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                  <HotelIcon className="w-6 h-6 text-amber-600" />
                                </div>
                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Accommodation</p>
                                  <p className="text-base font-bold text-slate-900">{day.hotelName}</p>
                                  <p className="text-[10px] text-amber-600 font-bold mt-0.5">
                                    {day.roomType} • {day.mealPlan} • Stay: ₹{day.hotelPrice.toLocaleString()}
                                    {day.extraBedPrice > 0 && ` • Extra Bed: ₹${day.extraBedPrice.toLocaleString()}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-5 flex-1 pl-12 border-l border-slate-100">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                  <Car className="w-6 h-6 text-amber-600" />
                                </div>
                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Transportation</p>
                                  <p className="text-base font-bold text-slate-900">{day.transport}</p>
                                  <p className="text-[10px] text-amber-600 font-bold mt-0.5">Premium Service • ₹{day.transportPrice.toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between items-center border-t border-slate-200/50 pt-6 mt-6">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Kashmir Curators Proposal</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Page {pageNum} of {totalPagesCount}</p>
                </div>
              </div>
            );
          })}

          {/* Final Page */}
          <div className="pdf-page bg-[#faf9f6] text-slate-900 font-sans p-24 w-[1200px] h-[1697px] relative flex flex-col justify-between" style={{ boxSizing: 'border-box' }}>
            <div>
              <div className="flex justify-between items-center border-b-2 border-amber-500/20 pb-6 mb-12">
                <p className="text-amber-700 font-black uppercase tracking-[0.4em] text-[10px]">Package Terms & Value</p>
                <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">{inquiry.customerName}</p>
              </div>

              <div className="space-y-12">
                {/* Special Inclusions Section */}
                <div className="p-10 bg-amber-50/50 rounded-[2.5rem] border border-amber-100">
                  <h3 className="text-xl font-serif font-bold text-slate-900 mb-6">Exclusive Inclusions</h3>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0" />
                      <p className="text-sm text-slate-600 font-medium">All transfers and sightseeing by private luxury vehicle.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0" />
                      <p className="text-sm text-slate-600 font-medium">Accommodation in hand-picked luxury hotels/houseboats.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0" />
                      <p className="text-sm text-slate-600 font-medium">Meal plans as specified (Daily Breakfast & Dinner included).</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0" />
                      <p className="text-sm text-slate-600 font-medium">24/7 Local support and expert curation.</p>
                    </div>
                  </div>
                </div>

                {/* Exclusions Section */}
                <div className="p-10 bg-red-50/50 rounded-[2.5rem] border border-red-100">
                  <h3 className="text-xl font-serif font-bold text-red-900 mb-6 flex items-center gap-3">
                    <ShieldX className="w-6 h-6 text-red-600" /> Package Exclusions
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line font-medium italic">
                    {exclusions}
                  </p>
                </div>

                {/* Pricing & Total Section */}
                <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px]" />
                  <div className="flex justify-between items-center relative z-10">
                    <div>
                      <h3 className="text-amber-500 font-black uppercase tracking-[0.4em] text-[10px] mb-4">Total Package Investment</h3>
                      <p className="text-4xl font-serif font-bold">Comprehensive Tour Price</p>
                    </div>
                    <div className="text-right">
                      <p className="text-6xl font-bold text-amber-500 tracking-tighter">₹{totalCost.toLocaleString()}</p>
                      <p className="text-white/40 text-[10px] font-bold uppercase mt-2">*Inclusive of GST & All Taxes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <p className="text-slate-400 text-xs font-medium tracking-[0.2em] mb-4 uppercase">Official Proposal from Kashmir Curators Experience Team</p>
              <div className="inline-flex flex-col items-center mb-6">
                <h4 className="text-2xl font-serif font-bold text-slate-900 mb-1">The Kashmir Curators</h4>
                <div className="w-12 h-1 bg-amber-500 rounded-full mb-3" />
                <p className="text-[10px] font-black uppercase tracking-[0.6em] text-amber-700">Luxury Travel Reimagined</p>
              </div>
              
              <div className="flex justify-between items-center border-t border-slate-200/50 pt-6 w-full">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Kashmir Curators Proposal</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Page {totalPagesCount} of {totalPagesCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#0f1115] border border-red-500/20 w-full max-w-md rounded-3xl p-8 relative shadow-2xl shadow-red-900/20 animate-in zoom-in-95 duration-300 text-left">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 mx-auto">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            
            <h2 className="text-2xl font-display font-black text-white text-center mb-2">Delete Inquiry?</h2>
            <p className="text-sm text-white/50 text-center mb-8">
              Are you absolutely sure you want to permanently delete <span className="text-white font-bold">{inquiry.customerName}</span>'s curation inquiry and all of its proposal quotes from the database? This action is irreversible.
            </p>

            <div className="flex gap-4">
              <Button 
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                className="flex-1 bg-transparent border-white/10 hover:bg-white/5 text-white"
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDeleteCuration}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold"
                disabled={isGenerating}
              >
                {isGenerating ? 'Deleting...' : 'Yes, Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Advance Deposit Request Modal */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#0f1115] border border-white/10 w-full max-w-md rounded-3xl p-8 relative shadow-2xl animate-in zoom-in-95 duration-300 text-left">
            <button 
              onClick={() => setShowAdvanceModal(false)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="w-16 h-16 rounded-full bg-kashmir-gold/10 border border-kashmir-gold/20 flex items-center justify-center mb-6 mx-auto text-kashmir-gold">
              <CreditCard className="w-8 h-8" />
            </div>
            
            <h2 className="text-2xl font-display font-black text-white text-center mb-2">Request Advance Deposit</h2>
            <p className="text-sm text-white/50 text-center mb-8">
              Generate a secure Razorpay payment link for <span className="text-white font-bold">{inquiry.customerName}</span> to secure lodging and cab reservations.
            </p>

            {!generatedLink ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Advance Amount (INR)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/45 text-sm font-black">₹</span>
                    <Input 
                      type="number"
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(e.target.value)}
                      className="pl-10 bg-white/5 border-white/5 h-12 rounded-xl text-white font-bold placeholder:text-white/20"
                      placeholder="Enter amount"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleGenerateAdvanceLink}
                  disabled={isGeneratingLink || !advanceAmount}
                  className="w-full bg-kashmir-gold text-black hover:bg-amber-500 font-black uppercase tracking-widest text-xs h-12 rounded-xl shadow-lg shadow-kashmir-gold/20 border-none"
                >
                  {isGeneratingLink ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Generate Razorpay Link
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-3">
                  <p className="text-xs text-emerald-400 font-bold text-center">Razorpay Payment Link Ready!</p>
                  
                  <div className="flex gap-2">
                    <Input 
                      readOnly
                      value={generatedLink}
                      className="bg-black/40 border-white/5 h-11 rounded-xl text-xs text-white/60 font-mono"
                    />
                    <Button 
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLink);
                        toast.success('Payment link copied to clipboard!');
                      }}
                      className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl px-4 h-11 text-xs font-bold"
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={() => {
                      const text = `Hi ${inquiry.customerName},\n\nTo lock in and secure the hotel reservations for your upcoming Kashmir tour, please complete the advance deposit payment of ₹${Number(advanceAmount).toLocaleString()} using this secure link:\n\n${generatedLink}\n\nThank you!\n- Kashmir Curators`;
                      window.open(`https://api.whatsapp.com/send?phone=${inquiry.phone}&text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="flex-1 bg-[#25D366] text-white hover:opacity-90 font-bold text-xs h-12 rounded-xl"
                  >
                    WhatsApp Client
                  </Button>
                  <Button 
                    onClick={() => {
                      const subject = encodeURIComponent(`Secure Payment Link - Kashmir Curators Tour reservation`);
                      const body = encodeURIComponent(`Dear ${inquiry.customerName},\n\nTo confirm and hold your lodging/cab reservations for your Kashmir travel itinerary, please make the advance deposit of ₹${Number(advanceAmount).toLocaleString()} through this secure Razorpay payment link:\n\n${generatedLink}\n\nWarm regards,\nKashmir Curators`);
                      window.open(`mailto:${inquiry.email}?subject=${subject}&body=${body}`, '_blank');
                    }}
                    className="flex-1 bg-white/5 border border-white/5 text-white hover:bg-white/10 font-bold text-xs h-12 rounded-xl"
                  >
                    Email Client
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Regenerate Itinerary Studio Modal */}
      {showAiRegenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#0b1014] border border-amber-400/20 w-full max-w-lg rounded-[2.5rem] p-8 relative shadow-2xl animate-in zoom-in-95 duration-300 text-left">
            <button 
              onClick={() => setShowAiRegenModal(false)}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-white">AI Studio Generator</h3>
                <p className="text-xs text-white/40">Re-curate this itinerary automatically with bespoke storytelling</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Select Duration</label>
                <div className="grid grid-cols-4 gap-2">
                  {['4', '5', '6', '7'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setAiRegenDuration(d)}
                      className={cn(
                        "py-2.5 rounded-xl text-xs font-bold border transition-all",
                        aiRegenDuration === d
                          ? "bg-amber-400 text-black border-amber-400 font-black shadow-md shadow-amber-400/20"
                          : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                      )}
                    >
                      {d} Days
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Select Travel Vibe & Theme</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'LUXURY', label: 'Crown Luxury', desc: 'Dal Lake & Pine Chalets' },
                    { id: 'HONEYMOON', label: 'Romance & Sunset', desc: 'Candlelit Shikara & Spa' },
                    { id: 'WINTER_SKI', label: 'Ski & High Peaks', desc: 'Gulmarg Phase 1 & 2' },
                    { id: 'FAMILY', label: 'Valley Heritage', desc: 'Pahalgam Lidder & Shepherds' },
                  ].map((thm) => (
                    <button
                      key={thm.id}
                      type="button"
                      onClick={() => setAiRegenTheme(thm.id)}
                      className={cn(
                        "p-3 rounded-2xl text-left border transition-all",
                        aiRegenTheme === thm.id
                          ? "bg-amber-400/10 border-amber-400/40 text-amber-300 shadow-sm shadow-amber-400/10"
                          : "bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <p className="text-xs font-bold text-white">{thm.label}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">{thm.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-white/50 space-y-1">
                <p className="text-[10px] uppercase font-black tracking-wider text-amber-400/80">Automated Intelligence</p>
                <p>This will regenerate daily narratives, calculate route distances, assign matching luxury suites, and calibrate net vs selling prices.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAiRegenModal(false)}
                  className="flex-1 text-white/50 hover:text-white text-xs h-12"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={isAiRegenerating}
                  onClick={() => handleAiRegenerateAll(aiRegenTheme, aiRegenDuration)}
                  className="flex-[2] bg-amber-400 hover:bg-amber-300 text-black font-black uppercase text-xs tracking-wider h-12 rounded-xl shadow-lg shadow-amber-400/20"
                >
                  {isAiRegenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Regenerate Itinerary
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
