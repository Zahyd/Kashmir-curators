import React, { useEffect, useState } from 'react';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileEdit,
  ShieldCheck,
  CreditCard,
  Trash2,
  Send,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Activity,
  StickyNote,
  Bell,
  GitMerge,
  Loader2,
  UserCheck,
  Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  salesApi,
  SalesInquiry,
  LeadActivityItem,
  LeadNoteItem,
  LeadReminderItem,
  TeamMemberItem,
  PIPELINE_STAGES,
  normalizeStageKey,
  getInquiryValueINR,
  SalesLeadDetail,
  getErrorMessage
} from '@/lib/salesApi';

interface LeadCommandDrawerProps {
  inquiry: SalesInquiry | null;
  open: boolean;
  onClose: () => void;
  canManage: boolean;
  teamMembers: TeamMemberItem[];
  onUpdated: () => void;
  onOpenEdit: (lead: SalesInquiry) => void;
  onNavigateTab: (tab: 'builder' | 'vault' | 'payments', lead: SalesInquiry) => void;
}

export default function LeadCommandDrawer({
  inquiry,
  open,
  onClose,
  canManage,
  teamMembers,
  onUpdated,
  onOpenEdit,
  onNavigateTab
}: LeadCommandDrawerProps) {
  const [drawerTab, setDrawerTab] = useState<'overview' | 'notes' | 'reminders' | 'activity'>('overview');
  const [detail, setDetail] = useState<(SalesLeadDetail & { internalNotes?: LeadNoteItem[] }) | null>(null);
  const [loading, setLoading] = useState(false);

  const [noteInput, setNoteInput] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const [remTitle, setRemTitle] = useState('');
  const [remDate, setRemDate] = useState('');
  const [remPriority, setRemPriority] = useState('HIGH');
  const [addingRem, setAddingRem] = useState(false);

  const [duplicates, setDuplicates] = useState<SalesInquiry[]>([]);
  const [checkingDupes, setCheckingDupes] = useState(false);
  const [mergingId, setMergingId] = useState<string | null>(null);

  const [assignTarget, setAssignTarget] = useState('');
  const [busyAction, setBusyAction] = useState(false);

  const loadDetail = async (id: string) => {
    setLoading(true);
    try {
      const data = await salesApi.getLeadDetail(id);
      setDetail(data);
      setAssignTarget(data?.assignedTo || '');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to load lead CRM details'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && inquiry?.id) {
      setDrawerTab('overview');
      setDuplicates([]);
      loadDetail(inquiry.id);
    }
  }, [open, inquiry?.id]);

  if (!open || !inquiry) return null;

  const current = detail || inquiry;
  const normalizedStage = normalizeStageKey(current.leadStage, current.status);
  const valINR = getInquiryValueINR(current);
  const notes: LeadNoteItem[] = detail?.internalNotes || [];
  const reminders: LeadReminderItem[] = detail?.reminders || [];
  const activities: LeadActivityItem[] = detail?.activities || [];

  const handleStageChange = async (nextStage: string) => {
    setBusyAction(true);
    try {
      await salesApi.transitionStage(current.id, { stage: nextStage });
      toast.success(`Stage updated to ${nextStage.replace(/_/g, ' ')}`);
      await loadDetail(current.id);
      onUpdated();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to change stage'));
    } finally {
      setBusyAction(false);
    }
  };

  const handleAssign = async () => {
    if (!assignTarget) {
      toast.error('Select a concierge to assign');
      return;
    }
    setBusyAction(true);
    try {
      const member = teamMembers.find((m) => (m.employeeCode || m.email) === assignTarget);
      await salesApi.assignLead(current.id, assignTarget, member?.name);
      toast.success(`Lead assigned to ${member?.name || assignTarget}`);
      await loadDetail(current.id);
      onUpdated();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to assign lead'));
    } finally {
      setBusyAction(false);
    }
  };

  const handleDeleteOrArchive = async () => {
    const label = canManage ? 'permanently delete' : 'archive as Lost';
    if (!window.confirm(`Are you sure you want to ${label} "${current.customerName}"?`)) return;
    setBusyAction(true);
    try {
      if (canManage) {
        await salesApi.deleteLead(current.id);
        toast.success('Lead deleted from Neon DB');
      } else {
        await salesApi.transitionStage(current.id, { stage: 'LOST', notes: 'Archived by sales executive' });
        toast.success('Lead archived to Lost');
      }
      onUpdated();
      onClose();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Action failed'));
    } finally {
      setBusyAction(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    setAddingNote(true);
    try {
      await salesApi.addNote(current.id, noteInput.trim());
      setNoteInput('');
      toast.success('Internal note logged');
      await loadDetail(current.id);
      onUpdated();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to add note'));
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await salesApi.deleteNote(noteId);
      toast.success('Note deleted');
      await loadDetail(current.id);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Could not delete note'));
    }
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remTitle.trim() || !remDate) {
      toast.error('Reminder title and due date/time are required');
      return;
    }
    setAddingRem(true);
    try {
      await salesApi.createReminder(current.id, {
        title: remTitle.trim(),
        dueDate: new Date(remDate).toISOString(),
        priority: remPriority
      });
      setRemTitle('');
      setRemDate('');
      toast.success('Follow-up reminder scheduled');
      await loadDetail(current.id);
      onUpdated();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to schedule reminder'));
    } finally {
      setAddingRem(false);
    }
  };

  const handleToggleReminder = async (rem: LeadReminderItem, nextStatus: 'COMPLETED' | 'CANCELLED') => {
    try {
      await salesApi.updateReminder(rem.id, { status: nextStatus });
      toast.success(`Reminder marked ${nextStatus.toLowerCase()}`);
      await loadDetail(current.id);
      onUpdated();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to update reminder'));
    }
  };

  const handleCheckDuplicates = async () => {
    setCheckingDupes(true);
    try {
      const res = await salesApi.checkDuplicates(current.id);
      setDuplicates(res.duplicates || []);
      if (!res.hasDuplicates) toast.info('No duplicate inquiries found for this phone/email');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Duplicate scan failed'));
    } finally {
      setCheckingDupes(false);
    }
  };

  const handleMergeDuplicate = async (dupId: string) => {
    setMergingId(dupId);
    try {
      await salesApi.mergeDuplicates(current.id, dupId);
      toast.success('Duplicate inquiry merged into master lead');
      setDuplicates((prev) => prev.filter((d) => d.id !== dupId));
      await loadDetail(current.id);
      onUpdated();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Merge failed'));
    } finally {
      setMergingId(null);
    }
  };

  const openWhatsApp = () => {
    const cleanPhone = (current.phone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      toast.error('No valid phone number on lead');
      return;
    }
    const text = encodeURIComponent(
      `Salaam ${current.customerName}, connecting from The Kashmir Curators regarding your ${current.destination || 'Kashmir'} trip (${current.duration || 'custom itinerary'}).`
    );
    window.open(`https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex-1" onClick={onClose} />
      <div className="w-full max-w-2xl bg-[#0B0F17] border-l border-white/10 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Top Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#0F141C] flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                {current.leadId || `#${current.id.slice(0, 8)}`}
              </span>
              {typeof current.leadScore === 'number' && (
                <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px]">
                  Score {current.leadScore}/100
                </Badge>
              )}
              {current.priority && (
                <Badge className="bg-white/5 text-slate-300 border border-white/10 text-[10px]">
                  {current.priority}
                </Badge>
              )}
            </div>
            <h2 className="text-xl font-bold text-white truncate">{current.customerName}</h2>
            <p className="text-xs text-slate-400 flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-amber-400" /> {current.phone}</span>
              {current.email && <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3 text-slate-500" /> {current.email}</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition shrink-0"
            aria-label="Close CRM Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stage + Quick Actions Bar */}
        <div className="px-4 sm:px-5 py-3 border-b border-white/10 bg-[#07090E]/90 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Stage</span>
            <select
              value={normalizedStage}
              disabled={busyAction}
              onChange={(e) => handleStageChange(e.target.value)}
              className="bg-[#0F141C] border border-white/15 text-xs font-bold text-amber-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400"
            >
              <option value="NEW_LEAD">New Lead</option>
              {PIPELINE_STAGES.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
            <span className="text-xs font-mono font-bold text-emerald-400 ml-1">
              {valINR > 0 ? `₹${valINR.toLocaleString('en-IN')}` : 'Unquoted'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Button size="sm" variant="outline" onClick={openWhatsApp} className="h-8 px-2.5 text-[11px] border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/15">
              <Send className="w-3 h-3 mr-1" /> WhatsApp
            </Button>
            <Button size="sm" variant="outline" onClick={() => { onNavigateTab('builder', current); onClose(); }} className="h-8 px-2.5 text-[11px] border-amber-500/30 text-amber-300 hover:bg-amber-500/15">
              <FileEdit className="w-3 h-3 mr-1" /> Studio
            </Button>
            <Button size="sm" variant="outline" onClick={() => { onNavigateTab('vault', current); onClose(); }} className="h-8 px-2.5 text-[11px] border-teal-500/30 text-teal-300 hover:bg-teal-500/15">
              <ShieldCheck className="w-3 h-3 mr-1" /> Vault
            </Button>
            <Button size="sm" variant="outline" onClick={() => { onNavigateTab('payments', current); onClose(); }} className="h-8 px-2.5 text-[11px] border-blue-500/30 text-blue-300 hover:bg-blue-500/15">
              <CreditCard className="w-3 h-3 mr-1" /> Pay
            </Button>
            <Button size="sm" variant="outline" onClick={() => onOpenEdit(current)} className="h-8 px-2.5 text-[11px] border-white/15 text-slate-200 hover:bg-white/10">
              <Pencil className="w-3 h-3 mr-1" /> Edit
            </Button>
            <Button size="sm" variant="outline" disabled={busyAction} onClick={handleDeleteOrArchive} className="h-8 px-2.5 text-[11px] border-rose-500/30 text-rose-400 hover:bg-rose-500/15">
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="px-4 sm:px-5 pt-2.5 border-b border-white/10 bg-[#0B0F17] flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'overview' as const, label: 'Overview & Owner', icon: UserCheck },
            { id: 'notes' as const, label: `Notes (${notes.length})`, icon: StickyNote },
            { id: 'reminders' as const, label: `Reminders (${reminders.filter((r) => r.status === 'PENDING').length})`, icon: Bell },
            { id: 'activity' as const, label: `Timeline (${activities.length})`, icon: Activity }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDrawerTab(tab.id)}
              className={cn(
                'px-3 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 shrink-0',
                drawerTab === tab.id
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-white'
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
          {loading && !detail ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400 mb-2" />
              <span className="text-xs">Loading live CRM telemetry...</span>
            </div>
          ) : null}

          {drawerTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-[#0F141C] border border-white/10 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold">Destination</span>
                  <p className="text-white font-semibold mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    {current.destination || 'Kashmir Circuit'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold">Duration</span>
                  <p className="text-white font-semibold mt-0.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    {current.duration || '5 Nights / 6 Days'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold">Stay & Transport</span>
                  <p className="text-slate-200 mt-0.5">
                    {current.preferredAccommodation || current.accommodation || 'Standard'} • {current.transportPreference || 'Private SUV'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold">Group / Arrival</span>
                  <p className="text-slate-200 mt-0.5">
                    {current.travelers || `${current.adultsCount || 2} Adults`} {current.arrivalCity ? `• ${current.arrivalCity}` : ''}
                  </p>
                </div>
                {current.notes && (
                  <div className="col-span-2 pt-2 border-t border-white/5">
                    <span className="text-[10px] uppercase text-slate-500 font-bold">Traveler Brief / Notes</span>
                    <p className="text-slate-300 mt-0.5 whitespace-pre-wrap">{current.notes}</p>
                  </div>
                )}
              </div>

              {/* Assignment Box */}
              <div className="p-4 rounded-xl bg-[#0F141C] border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Assigned Concierge</span>
                  <span className="text-xs font-mono text-amber-400">{current.assignedTo || 'Unassigned'}</span>
                </div>
                {canManage && (
                  <div className="flex items-center gap-2">
                    <select
                      value={assignTarget}
                      onChange={(e) => setAssignTarget(e.target.value)}
                      className="flex-1 bg-[#07090E] border border-white/10 text-xs text-white rounded-lg h-9 px-2.5"
                    >
                      <option value="">Select concierge...</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.employeeCode || m.email}>
                          {m.name} ({m.employeeCode || m.email})
                        </option>
                      ))}
                    </select>
                    <Button size="sm" disabled={busyAction} onClick={handleAssign} className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs h-9 px-3">
                      Reassign
                    </Button>
                  </div>
                )}
              </div>

              {/* Duplicate Check & Merge */}
              <div className="p-4 rounded-xl bg-[#0F141C] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <GitMerge className="w-3.5 h-3.5 text-purple-400" />
                      Duplicate Lead Resolution
                    </h4>
                    <p className="text-[11px] text-slate-400">Scan matching phone/email inquiries and merge histories.</p>
                  </div>
                  <Button size="sm" variant="outline" disabled={checkingDupes} onClick={handleCheckDuplicates} className="h-8 text-xs border-white/15 text-slate-200">
                    {checkingDupes ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Scan'}
                  </Button>
                </div>

                {duplicates.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    {duplicates.map((d) => (
                      <div key={d.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[#07090E] border border-purple-500/20 text-xs">
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate">{d.customerName} ({d.leadId || d.id.slice(0, 6)})</p>
                          <p className="text-[10px] text-slate-400">{d.phone} • {d.leadStage}</p>
                        </div>
                        <Button
                          size="sm"
                          disabled={mergingId === d.id}
                          onClick={() => handleMergeDuplicate(d.id)}
                          className="h-7 px-2.5 bg-purple-500 hover:bg-purple-400 text-white text-[11px] font-bold"
                        >
                          {mergingId === d.id ? 'Merging...' : 'Merge Here'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {drawerTab === 'notes' && (
            <div className="space-y-4">
              <form onSubmit={handleAddNote} className="space-y-2 p-3.5 rounded-xl bg-[#0F141C] border border-white/10">
                <Textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  rows={2}
                  placeholder="Write an internal concierge note (e.g. client prefers Dal Lake houseboat on Night 1)..."
                  className="bg-[#07090E] border-white/10 text-xs text-white resize-none"
                />
                <div className="flex justify-end">
                  <Button type="submit" size="sm" disabled={addingNote || !noteInput.trim()} className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs h-8">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Note
                  </Button>
                </div>
              </form>

              {notes.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-8">No internal notes recorded yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {notes.map((note) => (
                    <div key={note.id} className="p-3.5 rounded-xl bg-[#0F141C] border border-white/10 flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="font-bold text-amber-300">{note.authorName}</span>
                          <span className="text-slate-500">{new Date(note.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-slate-200 whitespace-pre-wrap">{note.content}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {drawerTab === 'reminders' && (
            <div className="space-y-4">
              <form onSubmit={handleAddReminder} className="space-y-2.5 p-3.5 rounded-xl bg-[#0F141C] border border-white/10">
                <Input
                  value={remTitle}
                  onChange={(e) => setRemTitle(e.target.value)}
                  placeholder="Follow-up action (e.g. Call after hotel rate check)"
                  className="bg-[#07090E] border-white/10 text-xs text-white h-9"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Input
                    type="datetime-local"
                    value={remDate}
                    onChange={(e) => setRemDate(e.target.value)}
                    className="sm:col-span-2 bg-[#07090E] border-white/10 text-xs text-white h-9"
                  />
                  <select
                    value={remPriority}
                    onChange={(e) => setRemPriority(e.target.value)}
                    className="bg-[#07090E] border border-white/10 text-xs text-white rounded-md px-2 h-9"
                  >
                    <option value="URGENT">URGENT</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" size="sm" disabled={addingRem} className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs h-8">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Schedule Follow-Up
                  </Button>
                </div>
              </form>

              {reminders.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-8">No follow-up reminders scheduled.</p>
              ) : (
                <div className="space-y-2.5">
                  {reminders.map((r) => {
                    const isDone = r.status === 'COMPLETED';
                    const isCancelled = r.status === 'CANCELLED';
                    return (
                      <div key={r.id} className="p-3.5 rounded-xl bg-[#0F141C] border border-white/10 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn('text-xs font-bold', isDone ? 'line-through text-slate-500' : 'text-white')}>
                              {r.title}
                            </span>
                            <Badge className="text-[9px] bg-white/5 text-slate-300 border-white/10">{r.priority}</Badge>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {new Date(r.dueDate).toLocaleString()} • {r.status}
                          </p>
                        </div>
                        {!isDone && !isCancelled && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button size="sm" onClick={() => handleToggleReminder(r, 'COMPLETED')} className="h-7 px-2 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black text-[11px] font-bold">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Done
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleToggleReminder(r, 'CANCELLED')} className="h-7 px-2 text-slate-400 hover:text-rose-400 text-[11px]">
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {drawerTab === 'activity' && (
            <div className="space-y-2.5">
              {activities.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-8">No activities logged yet.</p>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="p-3 rounded-xl bg-[#0F141C] border border-white/10 flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-white">{act.title}</p>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {new Date(act.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{act.description}</p>
                      {act.performedBy && (
                        <p className="text-[10px] font-mono text-amber-400/80 mt-1">By: {act.performedBy}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
