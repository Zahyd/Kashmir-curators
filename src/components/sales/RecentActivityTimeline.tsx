import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  RefreshCw,
  Clock,
  CreditCard,
  GitBranch,
  FileText,
  UserPlus,
  MessageSquare,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { salesApi, LeadActivityItem } from '@/lib/salesApi';
import { useTeamAuth } from '@/contexts/TeamAuthContext';

type TimelineActivity = LeadActivityItem & {
  inquiry?: { id: string; leadId?: string; customerName: string; destination?: string; leadStage?: string } | null;
};

interface RecentActivityTimelineProps {
  onInspectLeadId?: (inquiryId: string) => void;
  limit?: number;
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'PAYMENT_CAPTURED':
      return <CreditCard className="w-3.5 h-3.5 text-emerald-400" />;
    case 'STAGE_CHANGE':
      return <GitBranch className="w-3.5 h-3.5 text-amber-400" />;
    case 'DOCUMENT_UPLOADED':
    case 'DOCUMENT_VERIFIED':
    case 'DOCUMENT_DELETED':
      return <FileText className="w-3.5 h-3.5 text-sky-400" />;
    case 'NOTE_ADDED':
      return <MessageSquare className="w-3.5 h-3.5 text-purple-400" />;
    default:
      return <UserPlus className="w-3.5 h-3.5 text-amber-300" />;
  }
}

export default function RecentActivityTimeline({ onInspectLeadId, limit = 10 }: RecentActivityTimelineProps) {
  const { subscribeSalesEvent } = useTeamAuth();
  const [activities, setActivities] = useState<TimelineActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await salesApi.getActivities({
        page,
        limit,
        type: typeFilter
      });
      setActivities(data.activities || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load recent activity log');
    } finally {
      setLoading(false);
    }
  }, [page, limit, typeFilter]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  useEffect(() => {
    const unsub = subscribeSalesEvent((eventName, payload) => {
      if (eventName === 'ACTIVITY_LOGGED' && payload?.id && page === 1) {
        const eventType = String(payload.type || 'LEAD_UPDATED');
        if (typeFilter === 'ALL' || eventType === typeFilter) {
          const rawInquiry =
            payload.inquiry && typeof payload.inquiry === 'object'
              ? (payload.inquiry as {
                  id?: unknown;
                  leadId?: unknown;
                  customerName?: unknown;
                  destination?: unknown;
                  leadStage?: unknown;
                })
              : null;
          const nextItem: TimelineActivity = {
            id: String(payload.id),
            inquiryId: String(payload.inquiryId || rawInquiry?.id || ''),
            type: eventType,
            title: String(payload.title || 'Live Activity'),
            description: String(payload.description || ''),
            performedBy: payload.performedBy ? String(payload.performedBy) : null,
            createdAt: String(payload.createdAt || new Date().toISOString()),
            inquiry:
              rawInquiry?.id && rawInquiry?.customerName
                ? {
                    id: String(rawInquiry.id),
                    leadId: rawInquiry.leadId ? String(rawInquiry.leadId) : undefined,
                    customerName: String(rawInquiry.customerName),
                    destination: rawInquiry.destination ? String(rawInquiry.destination) : undefined,
                    leadStage: rawInquiry.leadStage ? String(rawInquiry.leadStage) : undefined
                  }
                : null
          };
          setActivities((prev) => [nextItem, ...prev.filter((a) => a.id !== nextItem.id)].slice(0, limit));
        }
      } else if (
        eventName === 'LEAD_CREATED' ||
        eventName === 'LEAD_CLAIMED' ||
        eventName === 'STAGE_UPDATED' ||
        eventName === 'PAYMENT_CONFIRMED'
      ) {
        if (page === 1) loadActivities();
      }
    });
    return unsub;
  }, [subscribeSalesEvent, loadActivities, page, limit, typeFilter]);

  return (
    <Card className="bg-[#0B0F17] border-white/10 rounded-3xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-black uppercase tracking-wider text-white">Real-Time Activity Feed</h3>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 px-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-[11px]"
          >
            <option value="ALL" className="bg-[#0B0F17]">All Events</option>
            <option value="STAGE_CHANGE" className="bg-[#0B0F17]">Stage Moves</option>
            <option value="PAYMENT_CAPTURED" className="bg-[#0B0F17]">Payments</option>
            <option value="NOTE_ADDED" className="bg-[#0B0F17]">Team Notes</option>
            <option value="DOCUMENT_UPLOADED" className="bg-[#0B0F17]">Documents</option>
          </select>

          <Button
            size="sm"
            variant="ghost"
            onClick={loadActivities}
            className="h-8 w-8 p-0 text-white/60 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-between text-xs text-red-300">
          <span className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </span>
          <button onClick={loadActivities} className="underline font-bold">Retry</button>
        </div>
      )}

      {loading && activities.length === 0 ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 rounded-2xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-white/[0.02] border border-dashed border-white/10">
          <p className="text-xs text-white/50">No activity logs recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {activities.map((act) => (
            <div
              key={act.id}
              onClick={() => act.inquiryId && onInspectLeadId?.(act.inquiryId)}
              className={`p-3 rounded-2xl bg-[#0F141C] border border-white/5 flex items-start gap-3 transition-colors ${
                onInspectLeadId && act.inquiryId ? 'cursor-pointer hover:border-amber-500/30' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                {getActivityIcon(act.type)}
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white truncate">{act.title}</span>
                  {act.inquiry?.customerName && (
                    <Badge variant="outline" className="border-amber-500/30 text-amber-300 text-[9px] shrink-0">
                      {act.inquiry.customerName}
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-white/55 line-clamp-2">{act.description}</p>
                <div className="flex items-center gap-2 text-[10px] text-white/35 font-mono pt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(act.createdAt).toLocaleString('en-IN')}
                  </span>
                  {act.performedBy && <span>• {act.performedBy}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] text-white/50">
          <span>Page {page} / {totalPages}</span>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-7 w-7 p-0 bg-white/5 border-white/10 text-white"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 w-7 p-0 bg-white/5 border-white/10 text-white"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
