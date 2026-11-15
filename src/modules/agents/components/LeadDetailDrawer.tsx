import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Users, 
  DollarSign, 
  Send, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  MessageCircle, 
  FileText, 
  Check, 
  Copy, 
  Bed, 
  Car, 
  TrendingUp, 
  Bot, 
  ShieldCheck, 
  AlertTriangle, 
  Compass, 
  ChevronRight,
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface LeadDetailDrawerProps {
  leadId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdateLead: () => void;
  onOpenQuoteBuilder: (lead: any) => void;
}

export const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
  NEW_LEAD: { label: 'Fresh Inquiry', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  FOLLOW_UP: { label: 'Follow Up', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
  QUOTE_SENT: { label: 'Quote Dispatched', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  NEGOTIATION: { label: 'Negotiation', color: 'bg-pink-500/10 text-pink-500 border-pink-500/20' },
  PAYMENT_PENDING: { label: 'Payment Pending', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  CONFIRMED: { label: 'Booked & Confirmed', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  COMPLETED: { label: 'Trip Executed', color: 'bg-teal-500/10 text-teal-500 border-teal-500/20' },
  CANCELLED: { label: 'Cancelled / Lost', color: 'bg-red-500/10 text-red-500 border-red-500/20' }
};

export const LeadDetailDrawer: React.FC<LeadDetailDrawerProps> = ({
  leadId,
  open,
  onClose,
  onUpdateLead,
  onOpenQuoteBuilder
}) => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [lead, setLead] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // AI Copilot state
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [suggestedReply, setSuggestedReply] = useState<any>(null);
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyGoal, setReplyGoal] = useState<'GREETING_INQUIRY' | 'QUOTE_DISPATCH' | 'FOLLOW_UP' | 'OBJECTION_HANDLING'>('GREETING_INQUIRY');
  const [inventorySuggestions, setInventorySuggestions] = useState<any>(null);

  // Notes state
  const [notes, setNotes] = useState<any[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Reminders state
  const [reminders, setReminders] = useState<any[]>([]);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderPriority, setReminderPriority] = useState('MEDIUM');
  const [isAddingReminder, setIsAddingReminder] = useState(false);

  // WhatsApp state
  const [whatsappMessages, setWhatsappMessages] = useState<any[]>([]);
  const [whatsappInput, setWhatsappInput] = useState('');
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  // Duplicates state
  const [duplicates, setDuplicates] = useState<any[]>([]);

  const authToken = token || localStorage.getItem('auth_token') || '';

  // Fetch complete lead detail
  const fetchLeadData = async () => {
    if (!leadId) return;

    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/crm/leads/${leadId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLead(data);
        setNotes(data.internalNotes || []);
        setReminders(data.reminders || []);
        setWhatsappMessages(data.whatsappMessages || []);
      }

      // Check duplicates
      const dupRes = await fetch(`${API_BASE_URL}/crm/leads/${leadId}/duplicates`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (dupRes.ok) {
        const dupData = await dupRes.json();
        setDuplicates(dupData.duplicates || []);
      }
    } catch (err) {
      console.error('Failed to load lead details:', err);
      toast.error('Failed to load lead details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && leadId) {
      fetchLeadData();
    }
  }, [open, leadId]);

  // Trigger AI Copilot Analysis
  const handleRunAiAnalysis = async () => {
    if (!leadId) return;
    try {
      setAiAnalysisLoading(true);
      const res = await fetch(`${API_BASE_URL}/ai/copilot/analyze-lead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ inquiryId: leadId })
      });
      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(data);
      }
    } catch (err) {
      console.error('AI analysis error:', err);
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  // Trigger Contextual Reply Generation
  const handleGenerateReply = async (goal = replyGoal) => {
    if (!leadId) return;
    try {
      setReplyLoading(true);
      const res = await fetch(`${API_BASE_URL}/ai/copilot/suggest-reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          inquiryId: leadId,
          channel: 'WHATSAPP',
          goal
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestedReply(data);
      }
    } catch (err) {
      console.error('AI reply error:', err);
    } finally {
      setReplyLoading(false);
    }
  };

  // Trigger Inventory Suggestion
  const handleRecommendInventory = async () => {
    if (!leadId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/ai/copilot/recommend-inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ inquiryId: leadId })
      });
      if (res.ok) {
        const data = await res.json();
        setInventorySuggestions(data);
      }
    } catch (err) {
      console.error('AI inventory error:', err);
    }
  };

  // Stage Change Handler
  const handleStageChange = async (newStage: string) => {
    if (!leadId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/crm/leads/${leadId}/stage`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ leadStage: newStage })
      });
      if (res.ok) {
        const updated = await res.json();
        setLead(updated);
        toast.success(`Stage moved to ${STAGE_CONFIG[newStage]?.label || newStage}`);
        onUpdateLead();
        fetchLeadData();
      }
    } catch {
      toast.error('Failed to update stage');
    }
  };

  // Add Note Handler
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !leadId) return;

    try {
      setIsAddingNote(true);
      const res = await fetch(`${API_BASE_URL}/crm/leads/${leadId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ content: newNoteContent.trim() })
      });
      if (res.ok) {
        const created = await res.json();
        setNotes(prev => [created, ...prev]);
        setNewNoteContent('');
        toast.success('Internal team note saved');
        onUpdateLead();
      }
    } catch {
      toast.error('Failed to add note');
    } finally {
      setIsAddingNote(false);
    }
  };

  // Add Follow-Up Reminder Handler
  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTitle.trim() || !reminderDate || !leadId) return;

    try {
      setIsAddingReminder(true);
      const res = await fetch(`${API_BASE_URL}/crm/leads/${leadId}/reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: reminderTitle.trim(),
          dueDate: reminderDate,
          priority: reminderPriority
        })
      });
      if (res.ok) {
        const created = await res.json();
        setReminders(prev => [created, ...prev]);
        setReminderTitle('');
        setReminderDate('');
        toast.success('Follow-up reminder scheduled');
        onUpdateLead();
      }
    } catch {
      toast.error('Failed to schedule reminder');
    } finally {
      setIsAddingReminder(false);
    }
  };

  // Complete Reminder Handler
  const handleToggleReminderStatus = async (reminderId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      const res = await fetch(`${API_BASE_URL}/crm/reminders/${reminderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        setReminders(prev => prev.map(r => r.id === reminderId ? { ...r, status: nextStatus } : r));
        toast.success(`Reminder marked ${nextStatus.toLowerCase()}`);
        onUpdateLead();
      }
    } catch {
      toast.error('Failed to update reminder');
    }
  };

  // Send Custom WhatsApp Handler
  const handleSendWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsappInput.trim() || !lead?.phone) return;

    try {
      setIsSendingWhatsApp(true);
      const res = await fetch(`${API_BASE_URL}/whatsapp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          phone: lead.phone,
          content: whatsappInput.trim(),
          inquiryId: lead.id
        })
      });
      if (res.ok) {
        const data = await res.json();
        setWhatsappMessages(prev => [...prev, data.message]);
        setWhatsappInput('');
        toast.success('WhatsApp message dispatched');
        onUpdateLead();
      }
    } catch {
      toast.error('Failed to dispatch message');
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  // Dispatch Pre-Approved WhatsApp Template
  const handleDispatchTemplate = async (templateType: 'PROPOSAL_DISPATCH' | 'PAYMENT_REQUEST' | 'BOOKING_CONFIRMATION') => {
    if (!lead?.phone || !leadId) return;

    try {
      const res = await fetch(`${API_BASE_URL}/whatsapp/send-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          phone: lead.phone,
          templateType,
          inquiryId: leadId
        })
      });
      if (res.ok) {
        const data = await res.json();
        setWhatsappMessages(prev => [...prev, data.message]);
        toast.success(`Template (${templateType}) sent to ${lead.customerName}`);
        fetchLeadData();
        onUpdateLead();
      }
    } catch {
      toast.error('Failed to send template');
    }
  };

  // Merge Duplicate Lead
  const handleMergeDuplicate = async (dupId: string) => {
    if (!leadId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/crm/leads/${leadId}/merge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ duplicateLeadId: dupId })
      });
      if (res.ok) {
        toast.success('Duplicate lead merged into master profile');
        fetchLeadData();
        onUpdateLead();
      }
    } catch {
      toast.error('Failed to merge duplicate');
    }
  };

  if (!lead && isLoading) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-2xl bg-card border-border/70 p-6 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Sparkles className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm font-medium">Loading Traveler Profile & CRM Data...</p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!lead) return null;

  const currentStage = STAGE_CONFIG[lead.leadStage] || STAGE_CONFIG.NEW_LEAD;
  const leadScore = lead.leadScore || 50;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto bg-card border-border/60 p-0 shadow-2xl flex flex-col">
        {/* Top Header Bar */}
        <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-xl border-b border-border/60 px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                {lead.leadId || `KC-${lead.id.slice(0, 8).toUpperCase()}`}
              </span>
              <Badge className={`text-xs font-semibold ${currentStage.color}`}>
                {currentStage.label}
              </Badge>
              {lead.priority && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  lead.priority === 'High' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                  lead.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                  'bg-slate-500/10 text-slate-400'
                }`}>
                  {lead.priority} Priority
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-foreground mt-1 truncate">{lead.customerName}</h2>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenQuoteBuilder(lead)}
              className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 font-bold text-xs gap-1.5 h-9"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Build Quote</span>
            </Button>
            <Button size="icon" variant="ghost" onClick={onClose} className="rounded-full h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Potential Duplicate Alert Banner */}
        {duplicates.length > 0 && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <p className="font-bold text-amber-600 dark:text-amber-400">
                Potential Duplicate Inquiry Detected ({duplicates.length})
              </p>
              <p className="text-muted-foreground mt-0.5">
                Matches existing traveler record: {duplicates[0].customerName} ({duplicates[0].phone})
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => handleMergeDuplicate(duplicates[0].id)}
                  className="px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 font-bold text-[11px] hover:bg-amber-400 transition-colors"
                >
                  Merge Interactions into Master
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stage Progression Bar */}
        <div className="px-6 py-3 bg-muted/20 border-b border-border/40 flex items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground font-semibold shrink-0">Stage Pipeline:</span>
          <Select value={lead.leadStage || 'NEW_LEAD'} onValueChange={handleStageChange}>
            <SelectTrigger className="h-8 max-w-[220px] rounded-lg text-xs bg-card border-border/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STAGE_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key} className="text-xs">
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabbed Drawer Body */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col p-6">
          <TabsList className="grid grid-cols-5 w-full bg-muted/40 p-1 rounded-xl mb-5">
            <TabsTrigger value="profile" className="text-xs font-semibold py-1.5 rounded-lg">Profile</TabsTrigger>
            <TabsTrigger value="copilot" className="text-xs font-semibold py-1.5 rounded-lg flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>AI Copilot</span>
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="text-xs font-semibold py-1.5 rounded-lg flex items-center gap-1">
              <MessageCircle className="w-3 h-3 text-emerald-500" />
              <span>WhatsApp</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs font-semibold py-1.5 rounded-lg">Timeline</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs font-semibold py-1.5 rounded-lg">Notes ({notes.length})</TabsTrigger>
          </TabsList>

          {/* TAB 1: TRAVELER PROFILE */}
          <TabsContent value="profile" className="space-y-5 m-0 focus-visible:outline-none">
            {/* Lead Score Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Explainable Lead Scoring
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-foreground">{leadScore}/100</span>
                  <span className="text-xs font-bold text-emerald-500">
                    {leadScore >= 75 ? '🔥 High Urgency (Hot)' : leadScore >= 50 ? '⚡ Good Fit (Warm)' : '🌱 Early Research (Cold)'}
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setActiveTab('copilot'); handleRunAiAnalysis(); }}
                className="text-xs border-amber-500/30 text-amber-500 hover:bg-amber-500/10 gap-1 rounded-xl"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Explain Score</span>
              </Button>
            </div>

            {/* Traveler Parameters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-500" /> Destination
                </span>
                <p className="text-xs font-bold text-foreground mt-1 truncate">{lead.destination || 'Kashmir'}</p>
              </div>

              <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-blue-500" /> Duration
                </span>
                <p className="text-xs font-bold text-foreground mt-1 truncate">{lead.duration || '5D / 4N'}</p>
              </div>

              <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3 text-purple-500" /> Travelers
                </span>
                <p className="text-xs font-bold text-foreground mt-1 truncate">{lead.travelers || '2 Guests'}</p>
              </div>

              <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-emerald-500" /> Budget Tier
                </span>
                <p className="text-xs font-bold text-foreground mt-1 truncate">{lead.budget || 'Premium'}</p>
              </div>

              <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <Car className="w-3 h-3 text-indigo-500" /> Transport
                </span>
                <p className="text-xs font-bold text-foreground mt-1 truncate">{lead.transportPreference || '4x4 Heated SUV'}</p>
              </div>

              <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <Compass className="w-3 h-3 text-amber-500" /> Travel Style
                </span>
                <p className="text-xs font-bold text-foreground mt-1 truncate">{lead.travelStyle || 'Bespoke Leisure'}</p>
              </div>
            </div>

            {/* Direct Contact Cards */}
            <div className="p-4 rounded-2xl bg-card border border-border/70 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Direct Contact Channels</h4>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <a 
                  href={`tel:${lead.phone}`}
                  className="flex-1 p-2.5 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors border border-border/50 flex items-center gap-2.5 text-xs font-semibold"
                >
                  <Phone className="w-4 h-4 text-primary" />
                  <span>{lead.phone || 'No phone'}</span>
                </a>

                <a 
                  href={`mailto:${lead.email}`}
                  className="flex-1 p-2.5 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors border border-border/50 flex items-center gap-2.5 text-xs font-semibold truncate"
                >
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">{lead.email || 'No email'}</span>
                </a>
              </div>
            </div>

            {/* Scheduled Reminders Overview */}
            <div className="p-4 rounded-2xl bg-card border border-border/70 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Follow-Up Reminders</h4>
                <Button size="sm" variant="ghost" onClick={() => setActiveTab('notes')} className="text-xs h-7 gap-1">
                  <Plus className="w-3 h-3" /> Add Reminder
                </Button>
              </div>

              {reminders.length === 0 ? (
                <p className="text-xs text-muted-foreground">No upcoming follow-ups scheduled for this client.</p>
              ) : (
                <div className="space-y-2">
                  {reminders.map((rem: any) => (
                    <div key={rem.id} className="p-2.5 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleReminderStatus(rem.id, rem.status)}
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                            rem.status === 'COMPLETED' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-muted-foreground/40'
                          }`}
                        >
                          {rem.status === 'COMPLETED' && <Check className="w-2.5 h-2.5" />}
                        </button>
                        <span className={rem.status === 'COMPLETED' ? 'line-through text-muted-foreground' : 'font-semibold text-foreground'}>
                          {rem.title}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(rem.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 2: AI SALES COPILOT */}
          <TabsContent value="copilot" className="space-y-5 m-0 focus-visible:outline-none">
            {/* Action Bar */}
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                onClick={handleRunAiAnalysis}
                disabled={aiAnalysisLoading}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 rounded-xl"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{aiAnalysisLoading ? 'Analyzing...' : 'Run Copilot Analysis'}</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleGenerateReply('GREETING_INQUIRY')}
                disabled={replyLoading}
                className="text-xs border-border/70 rounded-xl"
              >
                Generate WhatsApp Draft
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleRecommendInventory}
                className="text-xs border-border/70 rounded-xl gap-1"
              >
                <Bed className="w-3 h-3" />
                <span>Match Inventory</span>
              </Button>
            </div>

            {/* Explainable AI Analysis Card */}
            {aiAnalysis && (
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Traveler Intent & Conversion Insights</span>
                  </h4>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {aiAnalysis.conversionProbability}% Conversion Probability
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Target Category</span>
                    <p className="font-semibold text-foreground mt-0.5">{aiAnalysis.intentCategory}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Recommended Action</span>
                    <p className="font-semibold text-foreground mt-0.5">{aiAnalysis.recommendedNextAction}</p>
                  </div>
                </div>

                {/* Positive Signals */}
                {aiAnalysis.explainableSignals?.positive?.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Conversion Drivers</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {aiAnalysis.explainableSignals.positive.map((sig: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{sig}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Contextual Reply Draft */}
            {suggestedReply && (
              <div className="p-4 rounded-2xl bg-card border border-amber-500/30 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs font-bold">
                      WhatsApp Draft
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-semibold">Human Approval Required</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(suggestedReply.content);
                      toast.success('Copied to clipboard');
                    }}
                    className="h-7 text-xs gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </Button>
                </div>

                <div className="p-3 rounded-xl bg-background border border-border/50 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                  {suggestedReply.content}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setWhatsappInput(suggestedReply.content);
                      setActiveTab('whatsapp');
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 rounded-xl"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Insert into WhatsApp Chat</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Live Inventory Matching */}
            {inventorySuggestions && (
              <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Bed className="w-3.5 h-3.5 text-amber-500" />
                  <span>Authorized Kashmir Inventory Recommendations</span>
                </h4>

                <div className="space-y-2">
                  {inventorySuggestions.suggestedHotels?.slice(0, 3).map((hotel: any) => (
                    <div key={hotel.id} className="p-2.5 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-foreground">{hotel.name}</p>
                        <p className="text-[11px] text-muted-foreground">{hotel.location} • {hotel.starRating} Stars</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-amber-500">₹{hotel.contractRateEstimated}/night</p>
                        <span className="text-[9px] text-muted-foreground">B2B Contract Rate</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">Total Estimated B2B Wholesale</p>
                    <p className="text-[11px] text-muted-foreground">5-Night Stay + 4x4 Heated Cab</p>
                  </div>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    ₹{inventorySuggestions.estimatedPackageCost?.totalWholesaleB2B?.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </TabsContent>

          {/* TAB 3: WHATSAPP CENTRALIZED INBOX */}
          <TabsContent value="whatsapp" className="space-y-4 m-0 flex-1 flex flex-col focus-visible:outline-none">
            {/* Approved Templates Quick Dispatch */}
            <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-center gap-2 overflow-x-auto">
              <span className="text-[11px] font-bold text-muted-foreground shrink-0">1-Click Templates:</span>
              <button
                onClick={() => handleDispatchTemplate('PROPOSAL_DISPATCH')}
                className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-xs font-semibold hover:bg-purple-500/20 transition-colors shrink-0"
              >
                Send Proposal Link
              </button>
              <button
                onClick={() => handleDispatchTemplate('PAYMENT_REQUEST')}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold hover:bg-amber-500/20 transition-colors shrink-0"
              >
                Send Payment Link
              </button>
              <button
                onClick={() => handleDispatchTemplate('BOOKING_CONFIRMATION')}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold hover:bg-emerald-500/20 transition-colors shrink-0"
              >
                Send Confirmation
              </button>
            </div>

            {/* Conversation Thread */}
            <div className="flex-1 min-h-[260px] max-h-[360px] overflow-y-auto space-y-2.5 p-3 rounded-2xl bg-muted/20 border border-border/50">
              {whatsappMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                  <MessageCircle className="w-8 h-8 opacity-40 mb-2" />
                  <p className="text-xs">No WhatsApp chat history recorded yet for {lead.phone}.</p>
                </div>
              ) : (
                whatsappMessages.map((msg: any) => {
                  const isOutbound = msg.direction === 'OUTBOUND';
                  return (
                    <div 
                      key={msg.id}
                      className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-[85%] p-3 rounded-2xl text-xs ${
                        isOutbound 
                          ? 'bg-amber-500 text-slate-950 font-medium rounded-br-sm' 
                          : 'bg-card border border-border/60 text-foreground rounded-bl-sm'
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-0.5 px-1 font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {msg.senderName || (isOutbound ? 'Agent' : 'Customer')}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Outbound Messaging Form (Human-Approved) */}
            <form onSubmit={handleSendWhatsApp} className="flex gap-2">
              <Input
                placeholder="Type WhatsApp message (Human approval active)..."
                value={whatsappInput}
                onChange={e => setWhatsappInput(e.target.value)}
                className="flex-1 rounded-xl bg-background"
              />
              <Button
                type="submit"
                disabled={isSendingWhatsApp || !whatsappInput.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1 rounded-xl px-4"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </Button>
            </form>
          </TabsContent>

          {/* TAB 4: ACTIVITY TIMELINE */}
          <TabsContent value="timeline" className="space-y-3 m-0 focus-visible:outline-none">
            {lead.activities?.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No historical activity recorded.</p>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
                {lead.activities?.map((act: any) => (
                  <div key={act.id} className="relative group">
                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-card" />
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{act.title}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(act.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{act.description}</p>
                      {act.performedBy && (
                        <p className="text-[10px] text-amber-500 font-semibold">By: {act.performedBy}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB 5: INTERNAL TEAM NOTES & REMINDERS */}
          <TabsContent value="notes" className="space-y-5 m-0 focus-visible:outline-none">
            {/* Add Team Note */}
            <form onSubmit={handleAddNote} className="space-y-2">
              <Textarea
                placeholder="Write an internal team note (client cannot see this)..."
                value={newNoteContent}
                onChange={e => setNewNoteContent(e.target.value)}
                rows={3}
                className="text-xs rounded-xl bg-background"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isAddingNote || !newNoteContent.trim()}
                  className="bg-primary text-primary-foreground font-bold text-xs rounded-xl h-8 px-4"
                >
                  Save Note
                </Button>
              </div>
            </form>

            {/* Notes List */}
            <div className="space-y-2.5">
              {notes.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No internal team notes added yet.</p>
              ) : (
                notes.map((note: any) => (
                  <div key={note.id} className="p-3 rounded-xl bg-muted/30 border border-border/50 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{note.authorName}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-foreground/90 whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Follow-Up Reminder Form */}
            <div className="pt-4 border-t border-border/50 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Schedule Next Follow-Up</h4>
              <form onSubmit={handleAddReminder} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                  placeholder="e.g. Call regarding hotel tier..."
                  value={reminderTitle}
                  onChange={e => setReminderTitle(e.target.value)}
                  className="text-xs rounded-xl bg-background sm:col-span-1"
                />
                <Input
                  type="datetime-local"
                  value={reminderDate}
                  onChange={e => setReminderDate(e.target.value)}
                  className="text-xs rounded-xl bg-background"
                />
                <Button
                  type="submit"
                  disabled={isAddingReminder || !reminderTitle.trim() || !reminderDate}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl h-10"
                >
                  Schedule Reminder
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default LeadDetailDrawer;
