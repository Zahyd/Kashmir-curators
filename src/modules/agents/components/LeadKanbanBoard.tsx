import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Users, 
  ArrowRight, 
  Sparkles, 
  Send,
  MessageCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  FileText
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export interface LeadItem {
  id: string;
  leadId?: string;
  customerName: string;
  email: string;
  phone: string;
  destination: string;
  duration: string;
  travelers: string;
  budget: string;
  accommodation: string;
  leadStage: string;
  sentiment?: string;
  leadCategory?: string;
  sourceCta?: string;
  quoteData?: string;
  proposalUrl?: string;
  createdAt: string;
}

interface LeadKanbanBoardProps {
  leads: LeadItem[];
  onUpdateStage: (leadId: string, newStage: string) => Promise<void>;
  onCreateQuote: (lead: LeadItem) => void;
  isLoading?: boolean;
}

const STAGES = [
  { id: 'NEW_LEAD', label: 'Fresh Inquiries', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  { id: 'FOLLOW_UP', label: 'Follow Up', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  { id: 'QUOTE_SENT', label: 'Quote Dispatched', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  { id: 'NEGOTIATION', label: 'Negotiation', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
  { id: 'CONFIRMED', label: 'Booked & Paid', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
];

export const LeadKanbanBoard: React.FC<LeadKanbanBoardProps> = ({
  leads,
  onUpdateStage,
  onCreateQuote,
  isLoading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [activeMobileStage, setActiveMobileStage] = useState('NEW_LEAD');

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = 
      lead.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm);
    const matchesCat = categoryFilter === 'ALL' || lead.leadCategory === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const getLeadsByStage = (stageId: string) => {
    return filteredLeads.filter(l => (l.leadStage || 'NEW_LEAD') === stageId);
  };

  const handleQuickWhatsApp = (lead: LeadItem) => {
    const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hello ${lead.customerName}! Greetings from Kashmir Connect. We received your inquiry for a ${lead.duration} trip to ${lead.destination} (${lead.travelers} travelers). Would you like us to share our customized Kashmir itinerary and special B2B rates?`
    );
    window.open(`https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Search & Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card p-4 rounded-2xl border border-border/60 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search traveler name, phone, destination..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background/50 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] rounded-xl bg-background/50">
              <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Travel Themes</SelectItem>
              <SelectItem value="HONEYMOON_LUXURY">Honeymoon Luxury</SelectItem>
              <SelectItem value="FAMILY_EXPEDITION">Family Leisure</SelectItem>
              <SelectItem value="NORTH_KASHMIR_OFFBEAT">Gurez & Offbeat</SelectItem>
              <SelectItem value="WINTER_SPORTS">Ski & Snow Sports</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile Stage Selector Tabs (shown on small screens) */}
      <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {STAGES.map((s) => {
          const count = getLeadsByStage(s.id).length;
          const isSelected = activeMobileStage === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveMobileStage(s.id)}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isSelected 
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <span>{s.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background text-foreground'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Desktop Multi-Column Kanban Board / Mobile Active Stage Column */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
        {STAGES.map((stage) => {
          const stageLeads = getLeadsByStage(stage.id);
          const isHiddenOnMobile = activeMobileStage !== stage.id;

          return (
            <div 
              key={stage.id} 
              className={`flex flex-col bg-muted/30 rounded-2xl p-3 border border-border/60 ${
                isHiddenOnMobile ? 'hidden lg:flex' : 'flex'
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${stage.color}`}>
                    {stage.label}
                  </span>
                </div>
                <span className="text-xs font-bold text-muted-foreground bg-background px-2 py-0.5 rounded-md border border-border/40">
                  {stageLeads.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="space-y-3 min-h-[300px]">
                {stageLeads.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-center p-4 border border-dashed border-border/60 rounded-xl bg-background/30">
                    <Clock className="w-5 h-5 text-muted-foreground/50 mb-1" />
                    <p className="text-xs text-muted-foreground font-medium">No inquiries in this stage</p>
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <Card key={lead.id} className="border border-border/70 hover:shadow-md transition-all rounded-xl overflow-hidden bg-card group">
                      <CardContent className="p-3.5 space-y-2.5">
                        {/* Header: Name & Priority / Sentiment */}
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <h4 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                              {lead.customerName}
                            </h4>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3" />
                              {lead.duration || '5D/4N'} • {lead.travelers || '2 Guests'}
                            </p>
                          </div>
                          {lead.leadCategory && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal shrink-0">
                              {lead.leadCategory.replace(/_/g, ' ')}
                            </Badge>
                          )}
                        </div>

                        {/* Destination & Budget */}
                        <div className="bg-muted/40 p-2 rounded-lg text-xs space-y-1">
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-primary shrink-0" />
                              {lead.destination}
                            </span>
                            <span className="font-semibold text-foreground shrink-0">{lead.budget || 'Standard'}</span>
                          </div>
                        </div>

                        {/* Contact Quick Links */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleQuickWhatsApp(lead)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>

                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => onCreateQuote(lead)}
                            className="flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Build Quote</span>
                          </Button>
                        </div>

                        {/* Move Stage Selector */}
                        <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">Move Stage:</span>
                          <Select 
                            value={lead.leadStage || 'NEW_LEAD'} 
                            onValueChange={(val) => onUpdateStage(lead.id, val)}
                          >
                            <SelectTrigger className="h-7 w-[125px] text-[11px] rounded-lg bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STAGES.map(s => (
                                <SelectItem key={s.id} value={s.id} className="text-xs">
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LeadKanbanBoard;
