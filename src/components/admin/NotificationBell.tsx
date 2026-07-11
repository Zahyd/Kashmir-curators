import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Search, ShieldAlert, Sparkles, Volume2, VolumeX, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTeamAuth } from '@/contexts/TeamAuthContext';
import { API_BASE_URL, SOCKET_URL } from '@/lib/api';
import { io } from 'socket.io-client';

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
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    if (!teamUser) return;

    const socket = io(SOCKET_URL);
    socket.emit('join-admin');

    socket.on('new-system-event', (data) => {
      if (data.notification) {
        setNotifications(prev => [data.notification, ...prev]);
        
        // Play soft chime sound if enabled
        if (soundEnabled && audioRef.current) {
          audioRef.current.play().catch(err => console.log('Audio play blocked:', err));
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [teamUser, soundEnabled]);

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
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/notifications?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
        className="relative text-white/50 hover:text-white hover:bg-white/5 rounded-2xl w-12 h-12 flex items-center justify-center transition-all duration-300"
      >
        <Bell className={cn("w-6 h-6", unreadCount > 0 && "animate-wiggle text-kashmir-gold")} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500 text-black text-[9px] font-black flex items-center justify-center border-2 border-[#0a0f12] shadow-lg animate-pulse">
            {unreadCount}
          </span>
        )}
      </Button>

      {/* Glassmorphic Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-4 w-96 rounded-3xl bg-[#0a0f12]/95 border border-white/10 shadow-2xl backdrop-blur-2xl z-[100] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-kashmir-gold/10 flex items-center justify-center border border-kashmir-gold/20">
                <Bell className="w-4 h-4 text-kashmir-gold" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-widest">Ops Command Feed</h4>
                <p className="text-[9px] text-white/40 uppercase font-black tracking-widest mt-0.5">{unreadCount} unread reports</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Sound Toggle */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="w-8 h-8 rounded-lg text-white/40 hover:text-white hover:bg-white/5"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-kashmir-gold" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              
              {/* Mark All Read */}
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={markAllRead}
                  className="w-8 h-8 rounded-lg text-white/40 hover:text-emerald-400 hover:bg-white/5"
                  title="Mark all as read"
                >
                  <Check className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Search & Filters */}
          <div className="p-4 border-b border-white/5 space-y-3 bg-white/[0.01]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search alerts by metadata..." 
                className="w-full pl-9 bg-white/5 border-white/5 text-xs text-white rounded-xl placeholder:text-white/20 h-9"
              />
            </div>
            
            {/* Priority Tabs */}
            <div className="flex gap-1.5">
              {(['all', 'high', 'medium', 'low'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={cn(
                    "flex-1 py-1 px-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border",
                    filter === tab
                      ? "bg-white/10 text-white border-white/10 shadow-lg"
                      : "bg-transparent text-white/40 border-transparent hover:text-white/70"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto max-h-[350px] custom-scrollbar divide-y divide-white/5">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={cn(
                    "p-5 flex gap-4 transition-all hover:bg-white/[0.02] relative group",
                    !notif.read && "bg-kashmir-gold/[0.01]"
                  )}
                >
                  {/* Status Indicator Bar */}
                  {!notif.read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-kashmir-gold" />
                  )}

                  {/* Priority indicator */}
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    {notif.priority === 'high' ? (
                      <ShieldAlert className="w-4 h-4 text-red-400" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-kashmir-gold" />
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <h5 className={cn(
                        "text-xs font-bold truncate",
                        notif.read ? "text-white/60" : "text-white"
                      )}>
                        {notif.title}
                      </h5>
                      <span className="text-[8px] text-white/20 font-black uppercase tracking-widest shrink-0 pt-0.5">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <p className={cn(
                      "text-[11px] leading-relaxed break-words",
                      notif.read ? "text-white/30" : "text-white/60"
                    )}>
                      {notif.message}
                    </p>
                  </div>

                  {/* Action Drawer */}
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-center shrink-0">
                    {!notif.read && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => markAsRead(notif.id)}
                        className="w-7 h-7 rounded-lg text-emerald-400/60 hover:text-emerald-400 hover:bg-white/5"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center flex flex-col items-center justify-center space-y-3 opacity-30">
                <Sparkles className="w-8 h-8 text-kashmir-gold/50" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">No intelligence briefs</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
