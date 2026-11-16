import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Search, ShieldAlert, Sparkles, Volume2, VolumeX, Trash2, UserCheck, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTeamAuth } from '@/contexts/TeamAuthContext';
import { API_BASE_URL, SOCKET_URL } from '@/lib/api';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

interface DBNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  link?: string;
  createdAt: string;
}

export default function NotificationBell() {
  const { teamUser } = useTeamAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getAuthHeaders = (): Record<string, string> => {
    let portalKey = '';
    try {
      portalKey = JSON.parse(localStorage.getItem('hospitality_session') || '{}').accessKey || '';
    } catch {}

    const token = 
      localStorage.getItem('teamToken') || 
      localStorage.getItem('hospitality_token') || 
      localStorage.getItem('token') || 
      localStorage.getItem('auth_token') || 
      portalKey || 
      '';

    const headers: Record<string, string> = {};
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (portalKey && portalKey !== 'null' && portalKey !== 'undefined') {
      headers['x-portal-key'] = portalKey;
    }
    return headers;
  };

  // Initialize sound alert
  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav');
    audioRef.current.volume = 0.5;
  }, []);

  // Fetch initial notifications
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Subscribe to real-time WebSockets for push alerts
  useEffect(() => {
    const socket = io(SOCKET_URL);
    socket.emit('join-admin');

    socket.on('new-system-event', (data: any) => {
      if (data?.notification) {
        setNotifications(prev => [data.notification, ...prev.filter(n => n.id !== data.notification.id)]);
        
        // Play soft chime sound if enabled
        if (soundEnabled && audioRef.current) {
          audioRef.current.play().catch(err => console.log('Audio play blocked:', err));
        }
      }
    });

    socket.on('employee-attendance-updated', (data: any) => {
      // Create instant live in-memory notification if socket emits attendance
      const liveAlert: DBNotification = {
        id: `att-${Date.now()}`,
        title: data.status === 'ONLINE' ? 'Employee Clock-In' : data.status === 'ON_BREAK' ? 'Employee on Break' : 'Employee Shift Ended',
        message: `${data.employeeName || data.employeeCode} status updated to ${data.status}`,
        type: 'attendance',
        read: false,
        priority: 'medium',
        link: '/admin?section=attendance',
        createdAt: data.timestamp || new Date().toISOString()
      };
      setNotifications(prev => [liveAlert, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [soundEnabled]);

  // Click outside listener to auto-close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/notifications?limit=50`, {
        headers
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'POST',
        headers
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications
    .filter(n => {
      // Search match
      const matchesSearch = 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        n.message.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Priority filter match
      const matchesPriority = filter === 'all' || n.priority === filter;
      
      return matchesSearch && matchesPriority;
    });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Bell Button */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-foreground/80 hover:text-foreground bg-card hover:bg-muted/80 border border-border/80 rounded-2xl w-10 h-10 flex items-center justify-center shadow-sm transition-all focus:ring-2 focus:ring-amber-500/20"
        title="Operational Notifications & Alerts"
      >
        <Bell className={cn("w-4 h-4 text-foreground/70 transition-transform", unreadCount > 0 && "animate-wiggle text-amber-500")} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-md border-2 border-background animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Glassmorphic Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl bg-card border border-border/80 shadow-2xl backdrop-blur-2xl z-[100] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-border/60 bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Bell className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h4 className="text-xs font-black text-foreground uppercase tracking-wider">Ops Command Feed</h4>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{unreadCount} unread alerts</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              {/* Sound Toggle */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                title={soundEnabled ? "Mute audio chimes" : "Enable audio chimes"}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-500" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              
              {/* Mark All Read */}
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={markAllRead}
                  className="w-8 h-8 rounded-lg text-muted-foreground hover:text-emerald-500 hover:bg-muted"
                  title="Mark all alerts as read"
                >
                  <Check className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Search & Filters */}
          <div className="p-3.5 border-b border-border/60 space-y-2.5 bg-muted/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search alerts by reference or guest..." 
                className="w-full pl-9 bg-background border-border text-xs text-foreground rounded-xl placeholder:text-muted-foreground h-8"
              />
            </div>
            
            {/* Priority Tabs */}
            <div className="flex gap-1 bg-muted/50 p-0.5 rounded-xl border border-border/40">
              {(['all', 'high', 'medium', 'low'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={cn(
                    "flex-1 py-1 px-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                    filter === tab
                      ? "bg-background text-foreground shadow-sm font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto max-h-[340px] divide-y divide-border/40">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notif) => (
                <div 
                  key={notif.id} 
                  onClick={() => {
                    markAsRead(notif.id);
                    if (notif.link) {
                      setIsOpen(false);
                      navigate(notif.link);
                    }
                  }}
                  className={cn(
                    "p-3.5 flex gap-3 transition-colors hover:bg-muted/40 cursor-pointer relative group text-left",
                    !notif.read && "bg-amber-500/5"
                  )}
                >
                  {/* Status Indicator Bar */}
                  {!notif.read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                  )}

                  {/* Priority indicator */}
                  <div className="w-8 h-8 rounded-xl bg-muted/60 border border-border/80 flex items-center justify-center shrink-0 mt-0.5">
                    {notif.type === 'attendance' ? (
                      <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                    ) : notif.priority === 'high' ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex justify-between items-start gap-2">
                      <h5 className={cn(
                        "text-xs font-bold truncate",
                        notif.read ? "text-muted-foreground" : "text-foreground"
                      )}>
                        {notif.title}
                      </h5>
                      <span className="text-[9px] text-muted-foreground font-semibold shrink-0">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <p className={cn(
                      "text-[11px] leading-relaxed line-clamp-2",
                      notif.read ? "text-muted-foreground" : "text-foreground/80"
                    )}>
                      {notif.message}
                    </p>
                  </div>

                  {/* Action Drawer */}
                  <div className="flex flex-col justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {!notif.read && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notif.id);
                        }}
                        className="w-6 h-6 rounded-lg text-emerald-500 hover:bg-emerald-500/10"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                <Sparkles className="w-6 h-6 text-amber-500/50" />
                <p className="text-xs font-bold">No active intelligence briefs</p>
                <p className="text-[10px] text-muted-foreground">All operational alerts have been acknowledged.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
