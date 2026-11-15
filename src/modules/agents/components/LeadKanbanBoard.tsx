import React, { useState } from 'react';
import { 
  DndContext, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay
} from '@dnd-kit/core';
import { 
  sortableKeyboardCoordinates, 
  rectSortingStrategy, 
  SortableContext, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Users, 
  Sparkles, 
  Send,
  MessageCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  FileText,
  DollarSign,
  Flame,
  LayoutGrid,
  List,
  GripVertical,
  Bell,
  MessageSquare
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
  accommodation?: string;
  leadStage: string;
  sentiment?: string;
  leadCategory?: string;
  leadScore?: number;
  priority?: string;
  sourceCta?: string;
  quoteData?: string;
  proposalUrl?: string;
  netPrice?: number;
  createdAt: string;
  _count?: {
    internalNotes?: number;
    reminders?: number;
    whatsappMessages?: number;
    activities?: number;
  };
}

interface LeadKanbanBoardProps {
  leads: LeadItem[];
  onUpdateStage: (leadId: string, newStage: string) => Promise<void>;
  onCreateQuote: (lead: LeadItem) => void;
  onSelectLead: (lead: LeadItem) => void;
  isLoading?: boolean;
}

export const CRM_STAGES = [
  { id: 'NEW_LEAD', label: 'Fresh Inquiries', color: 'border-l-blue-500 bg-blue-500/5', badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { id: 'FOLLOW_UP', label: 'Follow Up', color: 'border-l-indigo-500 bg-indigo-500/5', badge: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
  { id: 'QUOTE_SENT', label: 'Quote Dispatched', color: 'border-l-purple-500 bg-purple-500/5', badge: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  { id: 'NEGOTIATION', label: 'Negotiation', color: 'border-l-pink-500 bg-pink-500/5', badge: 'bg-pink-500/10 text-pink-500 border-pink-500/20' },
  { id: 'PAYMENT_PENDING', label: 'Payment Pending', color: 'border-l-amber-500 bg-amber-500/5', badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  { id: 'CONFIRMED', label: 'Booked & Paid', color: 'border-l-emerald-500 bg-emerald-500/5', badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  { id: 'COMPLETED', label: 'Trip Executed', color: 'border-l-teal-500 bg-teal-500/5', badge: 'bg-teal-500/10 text-teal-500 border-teal-500/20' },
  { id: 'CANCELLED', label: 'Lost / Closed', color: 'border-l-red-500 bg-red-500/5', badge: 'bg-red-500/10 text-red-500 border-red-500/20' }
];

// Helper to resolve lead stage with fallback
export function getLeadStage(lead: LeadItem): string {
  if (lead.leadStage && CRM_STAGES.some(s => s.id === lead.leadStage)) {
    return lead.leadStage;
  }
  return 'NEW_LEAD';
}

// Draggable Lead Card Component
function DraggableLeadCard({
  lead,
  onClick,
  onQuickWhatsApp,
  onCreateQuote
}: {
  lead: LeadItem;
  onClick: () => void;
  onQuickWhatsApp: (e: React.MouseEvent, lead: LeadItem) => void;
  onCreateQuote: (e: React.MouseEvent, lead: LeadItem) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.4 : 1
  };

  const stage = getLeadStage(lead);
  const stageCfg = CRM_STAGES.find(s => s.id === stage) || CRM_STAGES[0];
  const score = lead.leadScore || 50;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="mb-3 select-none"
    >
      <Card 
        onClick={onClick}
        className={`border-y border-r border-l-4 ${stageCfg.color} border-border/70 hover:shadow-lg transition-all rounded-xl overflow-hidden bg-card cursor-pointer group hover:border-border`}
      >
        <CardContent className="p-3.5 space-y-2.5">
          {/* Header Bar */}
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-bold text-xs text-foreground truncate group-hover:text-amber-500 transition-colors">
                  {lead.customerName}
                </h4>
                {score > 0 && (
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                    score >= 75 ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                    score >= 50 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                    'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                  }`}>
                    {score >= 75 ? '🔥' : score >= 50 ? '⚡' : '🌱'} {score}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] font-mono font-bold text-muted-foreground">
                  {lead.leadId || `KC-${lead.id.slice(0, 6).toUpperCase()}`}
                </span>
                {lead.leadCategory && (
                  <span className="text-[8px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded truncate max-w-[120px]">
                    {lead.leadCategory.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
            </div>

            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              onClick={e => e.stopPropagation()}
              className="w-6 h-6 rounded bg-muted/40 hover:bg-muted flex items-center justify-center cursor-grab active:cursor-grabbing shrink-0 text-muted-foreground"
              title="Drag to reposition lead stage"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Destination & Duration Details */}
          <div className="bg-muted/30 p-2 rounded-lg text-xs space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1 truncate text-foreground font-medium">
                <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                {lead.destination}
              </span>
              <span className="text-[11px] font-semibold text-foreground shrink-0">{lead.budget || 'Standard'}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-500" />
                {lead.duration || '5D/4N'} • {lead.travelers || '2 Guests'}
              </span>
              {lead.priority && (
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                  lead.priority === 'High' ? 'bg-red-500/10 text-red-500' :
                  lead.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                  'bg-slate-500/10 text-slate-400'
                }`}>
                  {lead.priority}
                </span>
              )}
            </div>
          </div>

          {/* Interaction Counters (Notes, Reminders, WhatsApp) */}
          {(lead._count?.internalNotes || lead._count?.reminders || lead._count?.whatsappMessages) ? (
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-0.5">
              {lead._count?.internalNotes ? (
                <span className="flex items-center gap-0.5" title="Internal Notes">
                  <FileText className="w-2.5 h-2.5 text-amber-500" /> {lead._count.internalNotes}
                </span>
              ) : null}
              {lead._count?.reminders ? (
                <span className="flex items-center gap-0.5" title="Pending Reminders">
                  <Bell className="w-2.5 h-2.5 text-blue-500" /> {lead._count.reminders}
                </span>
              ) : null}
              {lead._count?.whatsappMessages ? (
                <span className="flex items-center gap-0.5" title="WhatsApp Messages">
                  <MessageSquare className="w-2.5 h-2.5 text-emerald-500" /> {lead._count.whatsappMessages}
                </span>
              ) : null}
            </div>
          ) : null}

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 pt-1 border-t border-border/40">
            <button
              type="button"
              onClick={(e) => onQuickWhatsApp(e, lead)}
              className="flex-1 inline-flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <Button
              size="sm"
              variant="default"
              onClick={(e) => onCreateQuote(e, lead)}
              className="flex-1 py-1 px-2 rounded-lg text-xs font-semibold gap-1 h-7"
            >
              <FileText className="w-3 h-3" />
              <span>Quote</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Kanban Stage Column
function KanbanColumn({
  stage,
  leads,
  onSelectLead,
  onQuickWhatsApp,
  onCreateQuote
}: {
  stage: typeof CRM_STAGES[0];
  leads: LeadItem[];
  onSelectLead: (lead: LeadItem) => void;
  onQuickWhatsApp: (e: React.MouseEvent, lead: LeadItem) => void;
  onCreateQuote: (e: React.MouseEvent, lead: LeadItem) => void;
}) {
  return (
    <div className="flex flex-col bg-muted/20 rounded-2xl p-3 border border-border/60 min-w-[280px] w-[280px] shrink-0 h-[calc(100vh-280px)]">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${stage.badge}`}>
            {stage.label}
          </span>
        </div>
        <span className="text-xs font-bold text-muted-foreground bg-background px-2 py-0.5 rounded-md border border-border/50 font-mono">
          {leads.length}
        </span>
      </div>

      {/* Sortable Drop Area */}
      <SortableContext id={stage.id} items={leads.map(l => l.id)} strategy={rectSortingStrategy}>
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
          {leads.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center text-center p-3 border border-dashed border-border/50 rounded-xl bg-background/20">
              <Clock className="w-4 h-4 text-muted-foreground/40 mb-1" />
              <p className="text-[11px] text-muted-foreground font-medium">No leads in this stage</p>
            </div>
          ) : (
            leads.map(lead => (
              <DraggableLeadCard
                key={lead.id}
                lead={lead}
                onClick={() => onSelectLead(lead)}
                onQuickWhatsApp={onQuickWhatsApp}
                onCreateQuote={onCreateQuote}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export const LeadKanbanBoard: React.FC<LeadKanbanBoardProps> = ({
  leads,
  onUpdateStage,
  onCreateQuote,
  onSelectLead,
  isLoading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      (lead.leadId && lead.leadId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCat = categoryFilter === 'ALL' || lead.leadCategory === categoryFilter;
    const matchesPriority = priorityFilter === 'ALL' || lead.priority === priorityFilter;
    return matchesSearch && matchesCat && matchesPriority;
  });

  const getLeadsByStage = (stageId: string) => {
    return filteredLeads.filter(l => getLeadStage(l) === stageId);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;

    const leadId = active.id as string;
    const overId = over.id as string;

    let targetStage = overId;
    const overLead = leads.find(l => l.id === overId);
    if (overLead) {
      targetStage = getLeadStage(overLead);
    }

    const draggedLead = leads.find(l => l.id === leadId);
    if (draggedLead && CRM_STAGES.some(s => s.id === targetStage) && getLeadStage(draggedLead) !== targetStage) {
      try {
        await onUpdateStage(leadId, targetStage);
      } catch (err) {
        console.error('DragEnd stage change failed:', err);
      }
    }
  };

  const handleQuickWhatsApp = (e: React.MouseEvent, lead: LeadItem) => {
    e.stopPropagation();
    const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hello ${lead.customerName}! Greetings from Kashmir Curators. We are curating your luxury holiday for ${lead.destination} (${lead.travelers || '2'} travelers). Would you like us to share our customized Kashmir itinerary and special B2B rates?`
    );
    window.open(`https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${text}`, '_blank');
  };

  const handleCreateQuoteClick = (e: React.MouseEvent, lead: LeadItem) => {
    e.stopPropagation();
    onCreateQuote(lead);
  };

  const activeDraggedLead = activeDragId ? leads.find(l => l.id === activeDragId) : null;

  return (
    <div className="space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-card p-4 rounded-2xl border border-border/60 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search traveler name, phone, KC-ID, destination..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 bg-background/50 rounded-xl text-xs h-10"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px] rounded-xl bg-background/50 text-xs h-10">
              <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Themes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">All Travel Themes</SelectItem>
              <SelectItem value="HONEYMOON_LUXURY" className="text-xs">Honeymoon Luxury</SelectItem>
              <SelectItem value="FAMILY_EXPEDITION" className="text-xs">Family Leisure</SelectItem>
              <SelectItem value="NORTH_KASHMIR_OFFBEAT" className="text-xs">Gurez & Offbeat</SelectItem>
              <SelectItem value="WINTER_SPORTS" className="text-xs">Ski & Snow Sports</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[130px] rounded-xl bg-background/50 text-xs h-10">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">All Priority</SelectItem>
              <SelectItem value="High" className="text-xs">High</SelectItem>
              <SelectItem value="Medium" className="text-xs">Medium</SelectItem>
              <SelectItem value="Low" className="text-xs">Low</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl bg-muted/40 p-1 border border-border/50">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${viewMode === 'kanban' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${viewMode === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              title="Table List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KANBAN BOARD VIEW (Drag & Drop Active) */}
      {viewMode === 'kanban' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 overflow-x-auto pb-4 pt-1 custom-scrollbar items-start">
            {CRM_STAGES.map(stage => {
              const stageLeads = getLeadsByStage(stage.id);
              return (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  leads={stageLeads}
                  onSelectLead={onSelectLead}
                  onQuickWhatsApp={handleQuickWhatsApp}
                  onCreateQuote={handleCreateQuoteClick}
                />
              );
            })}
          </div>

          <DragOverlay>
            {activeDraggedLead ? (
              <div className="w-[280px]">
                <Card className="border-l-4 border-l-amber-500 shadow-2xl rounded-xl bg-card">
                  <CardContent className="p-3 text-xs space-y-1">
                    <p className="font-bold text-foreground">{activeDraggedLead.customerName}</p>
                    <p className="text-muted-foreground">{activeDraggedLead.destination}</p>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        /* TABLE LIST VIEW */
        <div className="rounded-2xl border border-border/60 overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground uppercase font-bold text-[10px] border-b border-border/50">
                <tr>
                  <th className="p-3">Lead ID / Traveler</th>
                  <th className="p-3">Destination & Dates</th>
                  <th className="p-3">Stage</th>
                  <th className="p-3">Lead Score</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredLeads.map(lead => {
                  const stageCfg = CRM_STAGES.find(s => s.id === getLeadStage(lead)) || CRM_STAGES[0];
                  return (
                    <tr 
                      key={lead.id}
                      onClick={() => onSelectLead(lead)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                      <td className="p-3">
                        <p className="font-bold text-foreground group-hover:text-amber-500 transition-colors">{lead.customerName}</p>
                        <span className="font-mono text-[10px] text-muted-foreground">{lead.leadId || lead.id.slice(0, 8)}</span>
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-foreground">{lead.destination}</p>
                        <span className="text-muted-foreground text-[11px]">{lead.duration || '5D/4N'} • {lead.travelers || '2 Guests'}</span>
                      </td>
                      <td className="p-3">
                        <Badge className={`${stageCfg.badge} text-[10px] font-semibold`}>
                          {stageCfg.label}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono font-bold">
                        {lead.leadScore ? `${lead.leadScore}/100` : '—'}
                      </td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          lead.priority === 'High' ? 'bg-red-500/10 text-red-500' :
                          lead.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-slate-500/10 text-slate-400'
                        }`}>
                          {lead.priority || 'Normal'}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-muted-foreground">
                        {lead.phone}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={e => handleQuickWhatsApp(e, lead)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                            title="WhatsApp Client"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={e => handleCreateQuoteClick(e, lead)}
                            className="text-[11px] h-7 px-2 font-bold"
                          >
                            Quote
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadKanbanBoard;
