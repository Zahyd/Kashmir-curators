import React, { useState } from 'react';
import { 
  DndContext, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, rectSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MapPin, Clock, DollarSign, Sparkles } from 'lucide-react';

// Define the CRM Lead Stages (aligned with Prisma schema)
export const CRM_LEAD_STAGES = [
  'NEW_LEAD',
  'FOLLOW_UP',
  'QUOTE_SENT',
  'NEGOTIATION',
  'PAYMENT_PENDING',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED'
];

export const STAGE_LABELS: Record<string, string> = {
  NEW_LEAD: 'New Lead',
  FOLLOW_UP: 'Follow-up',
  QUOTE_SENT: 'Quote Sent',
  NEGOTIATION: 'Negotiation',
  PAYMENT_PENDING: 'Payment Pending',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

export const STAGE_COLORS: Record<string, string> = {
  NEW_LEAD: 'border-l-blue-500 bg-blue-500/5',
  FOLLOW_UP: 'border-l-indigo-500 bg-indigo-500/5',
  QUOTE_SENT: 'border-l-purple-500 bg-purple-500/5',
  NEGOTIATION: 'border-l-pink-500 bg-pink-500/5',
  PAYMENT_PENDING: 'border-l-amber-500 bg-amber-500/5 animate-pulse',
  CONFIRMED: 'border-l-emerald-500 bg-emerald-500/5',
  COMPLETED: 'border-l-teal-500 bg-teal-500/5',
  CANCELLED: 'border-l-red-500 bg-red-500/5'
};

interface Inquiry {
  id: string;
  customerName: string;
  destination: string;
  status: string;
  leadStage?: string;
  createdAt: string;
  budget?: string;
  duration?: string;
  priority?: string;
}

interface LeadBoardProps {
  inquiries: Inquiry[];
  onStatusChange: (inquiryId: string, newStage: string) => Promise<void>;
  onEditLead?: (inquiry: Inquiry) => void;
}

export function getLeadStage(inquiry: Inquiry): string {
  if (inquiry.leadStage) return inquiry.leadStage;
  // Fallback to mapping legacy status values
  switch (inquiry.status) {
    case 'New': return 'NEW_LEAD';
    case 'Pending Curation': return 'FOLLOW_UP';
    case 'Ready for Review': return 'QUOTE_SENT';
    case 'Booked': return 'CONFIRMED';
    case 'Lost': return 'CANCELLED';
    default: return 'NEW_LEAD';
  }
}

// Draggable Lead Card Component
function SortableLeadCard({ inquiry, onClick }: { inquiry: Inquiry; onClick?: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: inquiry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  const stage = getLeadStage(inquiry);
  const colorClass = STAGE_COLORS[stage] || 'border-l-slate-500 bg-slate-500/5';
  const prio = inquiry.priority || 'Low';

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="mb-4 group select-none"
    >
      <Card 
        className={`shadow-lg border-y-0 border-r-0 border-l-4 ${colorClass} border-white/5 hover:border-white/10 transition-all duration-300 rounded-xl relative overflow-hidden backdrop-blur-xl`}
      >
        <CardContent className="p-4 flex flex-col gap-3">
          {/* Header */}
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-xs text-white truncate group-hover:text-kashmir-gold transition-colors">{inquiry.customerName}</h4>
              <span className="text-[9px] text-white/30 font-mono">
                {inquiry.id.substring(0, 8).toUpperCase()}
              </span>
            </div>
            <div 
              {...attributes} 
              {...listeners} 
              className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center cursor-grab active:cursor-grabbing shrink-0 transition-colors"
              title="Drag to reposition lead stage"
            >
              <svg className="w-3.5 h-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8h16M4 16h16" />
              </svg>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-2 text-[10px] py-1">
            <div className="flex items-center gap-1 text-white/70">
              <MapPin className="w-3 h-3 text-kashmir-gold shrink-0" />
              <span className="truncate">{inquiry.destination}</span>
            </div>
            {inquiry.duration && (
              <div className="flex items-center gap-1 text-white/70">
                <Clock className="w-3 h-3 text-blue-400 shrink-0" />
                <span className="truncate">{inquiry.duration}</span>
              </div>
            )}
            {inquiry.budget && (
              <div className="flex items-center gap-1 text-white/70">
                <DollarSign className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">{inquiry.budget}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-white/70">
              <span className={`w-1.5 h-1.5 rounded-full ${prio === 'High' ? 'bg-red-500' : prio === 'Medium' ? 'bg-amber-500' : 'bg-slate-500'}`} />
              <span className="text-[9px] font-bold text-white/40">{prio} Prio</span>
            </div>
          </div>

          {/* Footer controls */}
          <div className="flex justify-between items-center border-t border-white/5 pt-2 mt-1">
            <span className="text-[9px] text-white/20 font-bold uppercase">
              {new Date(inquiry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
            {onClick && (
              <button 
                onClick={onClick} 
                className="text-[9px] font-black uppercase tracking-wider text-kashmir-gold hover:text-white transition-colors flex items-center gap-1 bg-white/5 px-2 py-1 rounded"
              >
                <Sparkles className="w-2.5 h-2.5" /> Action
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Kanban Column Component
function KanbanColumn({ title, stageId, items, onEditLead }: { title: string; stageId: string; items: Inquiry[]; onEditLead?: (inquiry: Inquiry) => void }) {
  return (
    <div className="flex flex-col bg-[#0b0f12]/40 border border-white/5 rounded-2xl p-4 min-w-[300px] w-[300px] h-[calc(100vh-280px)] overflow-hidden">
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
        <h3 className="font-bold text-xs text-white uppercase tracking-wider">{title}</h3>
        <Badge className="bg-white/5 text-white/70 hover:bg-white/5 border border-white/10 rounded-md font-mono text-[10px]">
          {items.length}
        </Badge>
      </div>
      
      <SortableContext id={stageId} items={items.map(i => i.id)} strategy={rectSortingStrategy}>
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {items.map((item) => (
            <SortableLeadCard 
              key={item.id} 
              inquiry={item} 
              onClick={onEditLead ? () => onEditLead(item) : undefined}
            />
          ))}
          {items.length === 0 && (
            <div className="h-40 flex items-center justify-center border border-dashed border-white/5 rounded-xl p-6 text-center text-[10px] font-bold text-white/20 uppercase tracking-widest bg-white/[0.01]">
              No leads in this stage
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function LeadBoard({ inquiries, onStatusChange, onEditLead }: LeadBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const inquiryId = active.id as string;
    const overId = over.id as string;
    
    // Find stage dropped over
    let newStage = overId;
    
    // If dropped over a card, find that card's stage
    const overItem = inquiries.find(i => i.id === overId);
    if (overItem) {
      newStage = getLeadStage(overItem);
    }

    const activeItem = inquiries.find(i => i.id === inquiryId);
    
    if (activeItem && CRM_LEAD_STAGES.includes(newStage) && getLeadStage(activeItem) !== newStage) {
      try {
        await onStatusChange(inquiryId, newStage);
      } catch (error) {
        console.error('DragEnd error:', error);
      }
    }
  };

  // Group inquiries by CRM stage
  const columns = CRM_LEAD_STAGES.map(stage => {
    const items = inquiries.filter(i => getLeadStage(i) === stage);
    return {
      stage,
      title: STAGE_LABELS[stage] || stage,
      items
    };
  });

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-6 pt-2 custom-scrollbar items-start">
        {columns.map(col => (
          <KanbanColumn 
            key={col.stage} 
            title={col.title} 
            stageId={col.stage} 
            items={col.items} 
            onEditLead={onEditLead}
          />
        ))}
      </div>
    </DndContext>
  );
}

