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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Define the available statuses for the pipeline
export const PIPELINE_STATUSES = [
  'New', 
  'Pending Curation', 
  'Quote Sent', 
  'Confirmed', 
  'Booked', 
  'Lost'
];

interface Inquiry {
  id: string;
  customerName: string;
  destination: string;
  status: string;
  createdAt: string;
  budget?: string;
}

interface LeadBoardProps {
  inquiries: Inquiry[];
  onStatusChange: (inquiryId: string, newStatus: string) => Promise<void>;
}

// Draggable Lead Card Component
function SortableLeadCard({ inquiry }: { inquiry: Inquiry }) {
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
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3 cursor-grab active:cursor-grabbing">
      <Card className="shadow-sm border-l-4 hover:shadow-md transition-shadow" style={{ borderLeftColor: '#b5852a' }}>
        <CardContent className="p-4 flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <h4 className="font-semibold text-sm truncate">{inquiry.customerName}</h4>
            <Badge variant="outline" className="text-xs">{inquiry.destination}</Badge>
          </div>
          <div className="flex justify-between items-end mt-2 text-xs text-muted-foreground">
            <span>{new Date(inquiry.createdAt).toLocaleDateString()}</span>
            {inquiry.budget && <span className="font-medium text-primary">{inquiry.budget}</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Kanban Column Component
function KanbanColumn({ title, items }: { title: string, items: Inquiry[] }) {
  return (
    <div className="flex flex-col bg-slate-50 dark:bg-slate-900 rounded-lg p-3 min-w-[280px] border">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="font-medium text-sm text-slate-700 dark:text-slate-300">{title}</h3>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      
      <SortableContext id={title} items={items.map(i => i.id)} strategy={rectSortingStrategy}>
        <div className="flex-1 min-h-[150px]">
          {items.map((item) => (
            <SortableLeadCard key={item.id} inquiry={item} />
          ))}
          {items.length === 0 && (
            <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-6 text-xs text-slate-400">
              Drop leads here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function LeadBoard({ inquiries, onStatusChange }: LeadBoardProps) {
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
    
    // Find what status the item was dropped over.
    // If dropped over an item, use that item's status.
    // If dropped over a column (SortableContext id), use that id.
    
    let newStatus = overId;
    const overItem = inquiries.find(i => i.id === overId);
    if (overItem) {
       newStatus = overItem.status;
    }

    const activeItem = inquiries.find(i => i.id === inquiryId);
    
    // Validate it's a valid pipeline status and it actually changed
    if (activeItem && PIPELINE_STATUSES.includes(newStatus) && activeItem.status !== newStatus) {
      try {
        await onStatusChange(inquiryId, newStatus);
        toast.success(`Lead moved to ${newStatus}`);
      } catch (error) {
        toast.error('Failed to move lead');
      }
    }
  };

  // Group inquiries by status
  const columns = PIPELINE_STATUSES.map(status => ({
    status,
    items: inquiries.filter(i => i.status === status)
  }));

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 pt-2">
        {columns.map(col => (
          <KanbanColumn 
            key={col.status} 
            title={col.status} 
            items={col.items} 
          />
        ))}
      </div>
    </DndContext>
  );
}
