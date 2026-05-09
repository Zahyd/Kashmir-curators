import React from 'react';
import { Search, Zap, ArrowRight, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SelectionRequiredProps {
  title: string;
  description: string;
  icon: any;
  inquiries: any[];
  onSelect: (inquiry: any) => void;
}

export default function SelectionRequired({ title, description, icon: Icon, inquiries, onSelect }: SelectionRequiredProps) {
  const activeLeads = inquiries.filter(inq => inq.status !== 'Lost' && inq.status !== 'Booked');

  return (
    <div className="max-w-4xl mx-auto py-10 md:py-20 animate-in fade-in slide-in-from-bottom-8 duration-700 px-4 md:px-0">
      <div className="text-center mb-16">
        <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8 shadow-2xl">
          <Icon className="w-10 h-10 text-kashmir-gold" />
        </div>
        <h2 className="text-4xl font-display font-bold text-white mb-4 tracking-tight">{title}</h2>
        <p className="text-white/40 text-lg max-w-xl mx-auto leading-relaxed">{description}</p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-4 h-4 text-kashmir-gold" />
            Quick Select Active Lead
          </h3>
          <Badge className="bg-white/5 text-white/30 border-none font-bold uppercase tracking-widest text-[9px]">
            {activeLeads.length} Available
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {activeLeads.length > 0 ? (
            activeLeads.slice(0, 5).map((inq) => (
              <Card 
                key={inq.id}
                onClick={() => onSelect(inq)}
                className="group bg-white/[0.03] border-white/5 p-4 md:p-6 rounded-[2rem] hover:bg-white/[0.06] hover:border-kashmir-gold/30 transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 md:gap-6 min-w-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform shrink-0">
                    {inq.customerName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-white group-hover:text-kashmir-gold transition-colors truncate">{inq.customerName}</h4>
                    <p className="text-[9px] md:text-[10px] text-white/20 uppercase tracking-widest mt-0.5 truncate">{inq.id} • {inq.destination}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden md:block">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Status</p>
                    <Badge variant="outline" className="bg-white/5 border-white/10 text-white/40 text-[9px] uppercase tracking-widest">{inq.status}</Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl text-white/20 group-hover:text-kashmir-gold group-hover:bg-kashmir-gold/10 transition-all">
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <div className="py-20 flex flex-col items-center justify-center bg-white/[0.02] border-2 border-dashed border-white/5 rounded-[3rem]">
              <MessageSquare className="w-10 h-10 text-white/10 mb-4" />
              <p className="text-white/20 font-bold uppercase tracking-widest text-xs">No Active Leads Found</p>
            </div>
          )}
        </div>

        <div className="pt-8 text-center">
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">
            Tip: Select a lead from the <span className="text-kashmir-gold">Live Queue</span> to start building
          </p>
        </div>
      </div>
    </div>
  );
}
