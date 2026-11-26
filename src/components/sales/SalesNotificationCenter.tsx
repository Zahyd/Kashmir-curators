import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, CheckCheck, Search, Sparkles, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { salesApi } from '@/lib/salesApi';
import { useTeamAuth } from '@/contexts/TeamAuthContext';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

interface SalesNotificationCenterProps {
  onNavigateLink?: (link: string) => void;
}

export default function SalesNotificationCenter({ onNavigateLink }: SalesNotificationCenterProps) {
  const { subscribeSalesEvent, acknowledgeNotification, acknowledgeAllNotifications } = useTeamAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [ackingAll, setAckingAll] = useState(false);
  const [filterMode, setFilterMode] = useState<'ALL' | 'UNREAD'>('ALL');
  const [search, setSearch] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await salesApi.getNotifications({
        unreadOnly: filterMode === 'UNREAD',
        search: search.trim() || undefined,
        limit: 30
      });
      setNotifications(data.notifications || []);
      setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
    } catch {
      // Keep previous list on transient network glitch
    } finally {
      setLoading(false);
    }
  }, [filterMode, search]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const notificationsRef = useRef<NotificationItem[]>([]);
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  useEffect(() => {
    const unsub = subscribeSalesEvent((eventName, payload) => {
      if (eventName === 'new-system-event' && payload?.notification) {
        const notif = payload.notification as NotificationItem;
        setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)].slice(0, 35));
        if (!notif.read) setUnreadCount((c) => c + 1);
      } else if (eventName === 'notification:acked') {
        if (payload?.markAll || payload?.all) {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
          setUnreadCount(0);
        } else if (payload?.notificationId) {
          const target = notificationsRef.current.find((n) => n.id === payload.notificationId);
          setNotifications((prev) =>
            prev.map((n) => (n.id === payload.notificationId ? { ...n, read: true } : n))
          );
          if (target && !target.read) {
            setUnreadCount((c) => Math.max(0, c - 1));
          }
        }
      } else if (
        eventName === 'NEW_INQUIRY' ||
        eventName === 'LEAD_CLAIMED' ||
        eventName === 'PAYMENT_CONFIRMED'
      ) {
        loadNotifications();
      }
    });
    return unsub;
  }, [subscribeSalesEvent, loadNotifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAck = async (item: NotificationItem) => {
    if (!item.read) {
      setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
      acknowledgeNotification(item.id);
      await salesApi.markNotificationRead(item.id).catch(() => {});
    }
    if (item.link && onNavigateLink) {
      onNavigateLink(item.link);
      setIsOpen(false);
    }
  };

  const handleAckAll = async () => {
    setAckingAll(true);
    try {
      acknowledgeAllNotifications();
      await salesApi.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      loadNotifications();
    } finally {
      setAckingAll(false);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Open notification center"
        className="relative h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-amber-300 transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-black text-[10px] font-black flex items-center justify-center shadow-lg">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[340px] sm:w-[400px] max-w-[92vw] rounded-2xl bg-[#0B0F17] border border-white/15 shadow-2xl z-50 overflow-hidden">
          <div className="p-3.5 border-b border-white/10 bg-[#0F141C] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black uppercase tracking-wider text-white">Notification Center</span>
              {unreadCount > 0 && (
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={loadNotifications}
                className="h-7 w-7 p-0 text-white/50 hover:text-white"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={ackingAll}
                  onClick={handleAckAll}
                  className="h-7 px-2 text-[10px] font-bold text-amber-300 hover:bg-amber-500/10"
                >
                  <CheckCheck className="w-3.5 h-3.5 mr-1" />
                  Ack All
                </Button>
              )}
            </div>
          </div>

          <div className="p-2.5 border-b border-white/10 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter alerts..."
                className="h-8 pl-8 bg-white/5 border-white/10 text-white text-xs rounded-lg"
              />
            </div>
            <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10">
              {(['ALL', 'UNREAD'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setFilterMode(m)}
                  className={`px-2 py-1 rounded text-[10px] font-bold ${
                    filterMode === m ? 'bg-amber-500 text-black' : 'text-white/50 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[380px] overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-7 h-7 text-white/20 mx-auto mb-2" />
                <p className="text-xs text-white/50">All caught up. No notifications found.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleAck(item)}
                  className={`p-3.5 cursor-pointer transition-colors hover:bg-white/[0.04] flex items-start justify-between gap-2.5 ${
                    !item.read ? 'bg-amber-500/[0.04]' : ''
                  }`}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      {!item.read && <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />}
                      <span className="text-xs font-bold text-white truncate">{item.title}</span>
                      <Badge variant="outline" className="text-[9px] border-white/10 text-white/50 uppercase">
                        {item.type}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-white/60 leading-snug">{item.message}</p>
                    <p className="text-[10px] text-white/35 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                  {!item.read && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAck(item);
                      }}
                      title="Acknowledge"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-white/50 hover:text-emerald-300 shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
