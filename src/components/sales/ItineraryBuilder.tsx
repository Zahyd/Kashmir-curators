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
  Upload
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
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useHotels } from '@/hooks/useCMSData';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api';


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
}

interface ItineraryBuilderProps {
  inquiry: any;
  onBack: () => void;
}

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
  const pdfContentRef = useRef<HTMLDivElement>(null);

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
      vendorStatus: 'pending' as const
    }));
    setDays(initialDays);
  }, [inquiry]);

  const totalRevenue = days.reduce((sum, day) => sum + (day.hotelPrice || 0) + (day.transportPrice || 0) + (day.extraBedPrice || 0), 0);
  const totalNetCost = days.reduce((sum, day) => sum + (day.hotelNetCost || 0) + (day.transportNetCost || 0), 0);
  const profit = totalRevenue - totalNetCost;
  const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

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
      vendorStatus: 'pending' as const
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
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
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

        method: 'PUT',
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

  const handleUpdateProposal = async (url: string) => {
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/inquiries/${inquiry.id}`, {

        method: 'PUT',
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
    toast.info('Generating premium PDF itinerary...');

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

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: true,
        backgroundColor: '#faf9f6',
        windowWidth: 1200, 
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight - 1; // Small overlap to avoid lines
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Kashmir_Itinerary_${inquiry.id}.pdf`);
      toast.success('Itinerary generated successfully!');
    } catch (error) {
      console.error('PDF Generation Error:', error);
      toast.error('Failed to generate PDF. Please try again.');
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
        
        <div className="flex items-center gap-4 w-full xl:w-auto relative z-10">
          <Button 
            onClick={handleSaveQuote}
            disabled={isGenerating}
            variant="outline" 
            className="flex-1 xl:flex-none bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30 text-white font-bold h-14 px-8 rounded-2xl transition-all"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            <span>Save</span>
          </Button>
          <Button 
            onClick={generatePDF} 
            disabled={isGenerating}
            variant="outline" 
            className="flex-1 xl:flex-none bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30 text-white font-bold h-14 px-8 rounded-2xl transition-all"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
            <span>Export</span>
          </Button>
          <Button 
            onClick={handleSendProposal} 
            disabled={isGenerating}
            className="flex-1 xl:flex-none bg-kashmir-gold text-black hover:bg-amber-500 font-black uppercase tracking-widest text-xs h-14 px-10 rounded-2xl shadow-xl shadow-kashmir-gold/20 hover:shadow-kashmir-gold/40 transition-all border-none"
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
          <Card className="bg-slate-900/80 backdrop-blur-2xl border-white/10 p-8 rounded-[3rem] sticky top-8 z-30 shadow-2xl overflow-hidden group border-l-kashmir-gold border-l-4">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
              <IndianRupee className="w-32 h-32" />
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-kashmir-gold/10 border border-kashmir-gold/20 flex items-center justify-center text-kashmir-gold">
                  <Wallet className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-1">Financial Analysis</p>
                  <h3 className="text-2xl font-display font-bold text-white tracking-tight">Package Intelligence</h3>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[8px] uppercase font-black tracking-widest text-white/20 mb-1">Total Revenue</p>
                  <p className="text-lg font-bold text-white">₹{totalRevenue.toLocaleString()}</p>
                </div>
                <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[8px] uppercase font-black tracking-widest text-white/20 mb-1">Total Net Cost</p>
                  <p className="text-lg font-bold text-white/60">₹{totalNetCost.toLocaleString()}</p>
                </div>
                <div className={cn(
                  "px-8 py-3 rounded-2xl border shadow-lg transition-all",
                  margin >= 20 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                  margin >= 10 ? "bg-amber-500/10 border-amber-500/30 text-amber-500" :
                  "bg-red-500/10 border-red-500/30 text-red-400"
                )}>
                  <p className="text-[8px] uppercase font-black tracking-widest opacity-60 mb-1">Profit Margin</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-black">{margin.toFixed(1)}%</p>
                    {margin >= 15 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>
            </div>
          </Card>

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
                        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-white/30">
                          <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Full Day Plan</span>
                          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Real-time Preview Ready</span>
                        </div>
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
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1 flex items-center gap-2">
                            <ImageIcon className="w-3 h-3 text-kashmir-gold" /> Experiences & Activities
                          </label>
                          <Textarea 
                            value={day.activities}
                            onChange={(e) => handleUpdateDay(index, 'activities', e.target.value)}
                            placeholder="Craft the magic here..."
                            className="bg-white/5 border-white/5 rounded-3xl min-h-[200px] focus:border-kashmir-gold/30 text-white/80 leading-relaxed transition-all focus:bg-white/[0.08]"
                          />
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {activityTemplates.slice(0, 3).map((template, tIdx) => (
                            <button
                              key={tIdx}
                              onClick={() => addTemplate(index, template)}
                              className="text-[9px] font-bold px-4 py-2 rounded-full bg-white/5 border border-white/5 text-white/40 hover:text-kashmir-gold hover:border-kashmir-gold/30 hover:bg-kashmir-gold/5 transition-all"
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
                              className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden relative cursor-pointer hover:bg-white/10 transition-all group/himg shadow-inner"
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
                                className="bg-white/5 border-white/5 rounded-2xl h-20 pl-14 pr-12 focus:border-kashmir-gold/30 font-bold text-lg placeholder:text-white/10"
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
                          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                            {/* Row 1: Room, Plan, Pax */}
                            <div className="grid grid-cols-3 gap-6">
                              <div className="space-y-3">
                                <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-1 flex items-center gap-2"><Bed className="w-3.5 h-3.5" /> Room Type</label>
                                <Select value={day.roomType} onValueChange={(value) => handleUpdateDay(index, 'roomType', value)}>
                                  <SelectTrigger className="bg-white/5 border-white/10 rounded-2xl h-14 font-bold text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent className="bg-[#0a0f12] border-white/10 text-white">
                                    <SelectItem value="Deluxe Room">Deluxe Room</SelectItem>
                                    <SelectItem value="Premium Room">Premium Room</SelectItem>
                                    <SelectItem value="Luxury Suite">Luxury Suite</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-3">
                                <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-1 flex items-center gap-2"><Coffee className="w-3.5 h-3.5" /> Meal Plan</label>
                                <Select value={day.mealPlan} onValueChange={(value) => handleUpdateDay(index, 'mealPlan', value)}>
                                  <SelectTrigger className="bg-white/5 border-white/10 rounded-2xl h-14 font-bold text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent className="bg-[#0a0f12] border-white/10 text-white">
                                    <SelectItem value="EP (Room Only)">EP (Room Only)</SelectItem>
                                    <SelectItem value="CP (Breakfast)">CP (Breakfast)</SelectItem>
                                    <SelectItem value="MAP (Breakfast + Dinner)">MAP (Bf + Din)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-3">
                                <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-1 flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Pax Count</label>
                                <Input 
                                  value={day.paxCount} 
                                  onChange={(e) => handleUpdateDay(index, 'paxCount', e.target.value)} 
                                  className="bg-white/5 border-white/10 rounded-2xl h-14 font-bold text-center text-sm" 
                                />
                              </div>
                            </div>

                            {/* Row 2: Stay Pricing */}
                            <div className="grid grid-cols-2 gap-6 p-4 rounded-3xl bg-white/[0.02] border border-white/5">
                              <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-kashmir-gold/50 ml-1 flex items-center gap-2">Stay Selling Price</label>
                                <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-kashmir-gold font-bold">₹</span>
                                  <Input 
                                    type="number"
                                    value={day.hotelPrice === 0 ? '' : day.hotelPrice}
                                    onChange={(e) => handleUpdateDay(index, 'hotelPrice', parseInt(e.target.value) || 0)}
                                    className="bg-white/5 border-white/10 rounded-xl h-12 pl-10 font-bold text-white focus:border-kashmir-gold/30"
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
                                    className="bg-white/5 border-white/10 rounded-xl h-12 pl-10 font-bold text-white/40 focus:border-white/20"
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
                        
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-end bg-white/[0.02] p-10 rounded-[3rem] border border-white/5 shadow-inner">
                          {/* Transport Config */}
                          <div className="xl:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-4">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-1">Assigned Vehicle</p>
                              <Select value={day.transport} onValueChange={(value) => handleUpdateDay(index, 'transport', value)}>
                                <SelectTrigger className="bg-white/5 border-white/10 rounded-2xl h-16 focus:ring-kashmir-gold/30 font-bold text-sm">
                                  <SelectValue placeholder="Select Transport" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0a0f12] border-white/10 text-white">
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
                                  className="bg-white/5 border-white/10 rounded-2xl h-16 pl-12 focus:border-kashmir-gold/30 font-bold text-xl text-white transition-all focus:bg-white/[0.08]"
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
                                  className="bg-white/5 border-blue-500/10 rounded-2xl h-16 pl-12 focus:border-blue-400/30 font-bold text-xl text-blue-300/60 transition-all focus:bg-white/[0.08]"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Operational Status */}
                          <div className="xl:col-span-3 space-y-4">
                            <div className="flex justify-between items-center px-1">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Operational Status</p>
                              <Badge className={cn(
                                "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border-none",
                                day.vendorStatus === 'confirmed' ? "bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10" :
                                day.vendorStatus === 'waitlist' ? "bg-red-500/20 text-red-400 shadow-lg shadow-red-500/10" :
                                "bg-amber-500/20 text-amber-500 shadow-lg shadow-amber-500/10"
                              )}>
                                {day.vendorStatus}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 p-1 bg-black/40 rounded-[1.3rem] border border-white/5">
                              {(['pending', 'confirmed', 'waitlist'] as const).map((status) => (
                                <button
                                  key={status}
                                  onClick={() => handleUpdateDay(index, 'vendorStatus', status)}
                                  className={cn(
                                    "flex-1 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all duration-300 truncate px-2",
                                    day.vendorStatus === status 
                                      ? "bg-white/10 text-white shadow-2xl border border-white/10 scale-[1.02]" 
                                      : "text-white/10 hover:text-white/40 hover:bg-white/5"
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
                    <div className="flex justify-between items-center mb-10">
                      <div className="space-y-1">
                        <h4 className="text-2xl font-bold text-white">Kashmir Curators Collection</h4>
                        <p className="text-xs text-kashmir-gold/60 uppercase tracking-widest font-bold">Select a luxury stay for Day {day.day}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setShowHotelPicker(null)} className="rounded-2xl hover:bg-white/10 h-12 w-12">
                        <X className="w-6 h-6" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {hotels?.map((hotel) => (
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
                  <p className="text-lg font-bold text-white mb-4">{inquiry.duration}</p>
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
                        <Upload className="w-3.5 h-3.5 mr-2" /> Mock Upload
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
          className="w-[1200px] bg-[#faf9f6] text-slate-900 font-sans p-24"
        >
          {/* PDF Cover Header */}
          <div className="relative mb-20">
            <div className="absolute top-[-40px] right-[-40px] w-64 h-64 bg-amber-50 rounded-full opacity-50 blur-3xl" />
            <div className="flex justify-between items-end border-b-8 border-amber-500 pb-12 relative z-10">
              <div className="flex items-center gap-8">
                <Logo className="w-64 h-auto text-slate-900" />
                <div className="h-16 w-px bg-amber-500/20" />
                <div>
                  <p className="text-amber-700 font-black uppercase tracking-[0.4em] text-[10px] mb-1">Luxury Travel Curators</p>
                  <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest italic">Exclusively for {inquiry.customerName}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-2xl text-slate-900 tracking-widest">#{inquiry.id}</p>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Proposal Created: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Client Details Section */}
          <div className="grid grid-cols-3 gap-12 mb-20 bg-slate-50 p-12 rounded-[2rem] border border-slate-100">
            <div className="col-span-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Bespoke Itinerary for</h3>
              <p className="text-3xl font-serif font-bold text-slate-900 mb-2">{inquiry.customerName}</p>
              <div className="flex gap-6 mt-6">
                <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                  <MapPin className="w-4 h-4 text-amber-500" /> {inquiry.destination}
                </div>
                <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                  <Calendar className="w-4 h-4 text-amber-500" /> {inquiry.duration}
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

          {/* Itinerary Body */}
          <div className="space-y-16">
            {days.map((day) => (
              <div key={day.day} className="relative pl-24 border-l-4 border-amber-500/10 pb-16 last:pb-0" style={{ pageBreakInside: 'avoid' }}>
                <div className="absolute left-[-22px] top-0 w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white font-black text-xl shadow-xl shadow-amber-500/20">
                  {day.day}
                </div>
                
                <div className="mb-10">
                  <h3 className="text-3xl font-serif font-bold text-slate-900 mb-6">{day.title}</h3>
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
                    
                    <div className="flex items-center gap-8 mb-4">
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

          {/* Special Inclusions Section */}
          <div className="mt-20 p-12 bg-amber-50 rounded-[2.5rem] border border-amber-100">
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
          <div className="mt-12 p-12 bg-red-50 rounded-[2.5rem] border border-red-100">
            <h3 className="text-xl font-serif font-bold text-red-900 mb-6 flex items-center gap-3">
              <ShieldX className="w-6 h-6" /> Package Exclusions
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line font-medium italic">
              {exclusions}
            </p>
          </div>

          {/* Pricing & Total Section */}
          <div className="mt-12 bg-slate-900 rounded-[3rem] p-16 text-white relative overflow-hidden">
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

          {/* PDF Footer */}
          <div className="mt-24 pt-16 border-t-2 border-slate-100 text-center">
            <p className="text-slate-400 text-xs font-medium tracking-[0.2em] mb-10 uppercase">Official Proposal from Kashmir Curators Experience Team</p>
            <div className="inline-flex flex-col items-center">
              <h4 className="text-3xl font-serif font-bold text-slate-900 mb-2">The Kashmir Curators</h4>
              <div className="w-16 h-1.5 bg-amber-500 rounded-full mb-6" />
              <p className="text-[12px] font-black uppercase tracking-[0.6em] text-amber-700">Luxury Travel Reimagined</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
