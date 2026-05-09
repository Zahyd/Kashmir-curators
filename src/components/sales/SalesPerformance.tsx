import { 
  TrendingUp, 
  Award, 
  DollarSign, 
  Users, 
  CheckCircle2, 
  Zap,
  Target,
  Gift,
  Star,
  ChevronRight,
  Medal,
  Crown,
  Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

export default function SalesPerformance({ stats: liveStats }: { stats?: any }) {
  const stats = [
    { 
      label: 'Monthly Sales', 
      value: liveStats?.totalRevenue || '₹0', 
      change: '+12%', // Trend would need historical data
      icon: DollarSign, 
      color: 'text-emerald-400' 
    },
    { 
      label: 'Conversion Rate', 
      value: liveStats?.conversionRate || '0%', 
      change: '+3%', 
      icon: TrendingUp, 
      color: 'text-blue-400' 
    },
    { 
      label: 'Active Pipeline', 
      value: liveStats?.activeQuotes || '0', 
      change: 'Real-time', 
      icon: Users, 
      color: 'text-amber-400' 
    },
    { 
      label: 'Leads Converted', 
      value: liveStats?.leadsConverted || '0', 
      change: 'Total', 
      icon: Zap, 
      color: 'text-purple-400' 
    },
  ];

  const perks = [
    { title: 'Luxury Stay Voucher', requirement: '10 High-value bookings', progress: Math.min(((liveStats?.leadsConverted || 0) / 10) * 100, 100), unlocked: (liveStats?.leadsConverted || 0) >= 10, icon: Gift },
    { title: 'Platinum Club Access', requirement: '₹10L Monthly Sales', progress: parseInt(liveStats?.targetProgress || '0'), unlocked: parseInt(liveStats?.targetProgress || '0') >= 100, icon: Star },
    { title: 'Performance Bonus', requirement: 'Top performer of month', progress: 100, unlocked: true, icon: Award },
  ];

  const leaderboard = [
    { name: 'Sameer Sheikh', revenue: '₹42.5L', conversion: '32%', rank: 1, avatar: 'S' },
    { name: 'Irfan Ahmad', revenue: '₹38.2L', conversion: '28%', rank: 2, avatar: 'I' },
    { name: 'Zahid Khan', revenue: liveStats?.totalRevenue || '₹0', conversion: liveStats?.conversionRate || '0%', rank: 3, avatar: 'Z' },
    { name: 'Asma Jan', revenue: '₹24.8L', conversion: '22%', rank: 4, avatar: 'A' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">Performance Analytics</h1>
          <p className="text-white/40 text-sm">Tracking your success and rewards for May 2026.</p>
        </div>
        <Badge className="bg-kashmir-gold/10 text-kashmir-gold border-kashmir-gold/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
          Elite Executive Status
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-white/[0.03] border-white/5 p-6 rounded-3xl backdrop-blur-xl hover:border-white/10 transition-all duration-500 group">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform duration-500`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <Badge className="bg-white/5 text-white/40 border-none text-[10px]">{stat.change}</Badge>
            </div>
            <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-3xl font-display font-bold text-white tracking-tight">{stat.value}</h3>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Target */}
        <Card className="lg:col-span-2 bg-white/[0.03] border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Target className="w-32 h-32 text-kashmir-gold" />
          </div>
          
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-kashmir-gold" />
              Quarterly Target Progress
            </h3>
            
            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <p className="text-sm font-bold text-white/60">Sales Volume Target</p>
                    <p className="text-2xl font-display font-bold text-white">₹18.4L <span className="text-white/20 text-sm font-sans">/ ₹25L</span></p>
                  </div>
                  <p className="text-kashmir-gold font-bold">74%</p>
                </div>
                <Progress value={74} className="h-2.5 bg-white/5" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Monthly Leads Converted</p>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold text-white">12/15</div>
                    <div className="flex -space-x-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Avg. Response Time</p>
                  <div className="text-2xl font-bold text-white">18 <span className="text-xs text-white/30 font-normal">mins</span></div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Perks & Rewards */}
        <Card className="bg-white/[0.03] border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-400" />
            My Perks
          </h3>
          
          <div className="space-y-6">
            {perks.map((perk, index) => (
              <div key={index} className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-colors cursor-pointer group">
                <div className="flex justify-between items-start">
                  <div className={`p-2 rounded-xl ${perk.unlocked ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                    <perk.icon className={`w-5 h-5 ${perk.unlocked ? 'text-emerald-400' : 'text-white/20'}`} />
                  </div>
                  {perk.unlocked ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[10px]">CLAIMED</Badge>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-kashmir-gold transition-colors">{perk.title}</h4>
                  <p className="text-[10px] text-white/40">{perk.requirement}</p>
                </div>
                {!perk.unlocked && (
                  <Progress value={perk.progress} className="h-1 bg-white/5" />
                )}
              </div>
            ))}
          </div>

          <button className="w-full mt-6 py-3 rounded-xl border border-dashed border-white/10 text-white/40 text-[10px] font-bold uppercase tracking-widest hover:border-kashmir-gold hover:text-kashmir-gold transition-all">
            View All Milestones
          </button>
        </Card>
      </div>

      {/* Sales Leaderboard Section */}
      <Card className="bg-white/[0.03] border-white/5 p-10 rounded-[3rem] backdrop-blur-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-[0.02]">
          <Trophy className="w-64 h-64 text-kashmir-gold" />
        </div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-10">
            <div>
              <div className="flex items-center gap-2 text-kashmir-gold text-[10px] font-black uppercase tracking-[0.4em] mb-2">
                <Crown className="w-4 h-4" />
                <span>Elite Rankings</span>
              </div>
              <h3 className="text-3xl font-display font-bold text-white tracking-tight">Kashmir Curators Leaderboard</h3>
            </div>
            <div className="px-5 py-2 bg-white/5 rounded-xl border border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-widest">
              Updated 2 mins ago
            </div>
          </div>

          <div className="space-y-4">
            {leaderboard.map((agent, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex items-center gap-6 p-5 rounded-[2rem] border transition-all duration-500 group",
                  agent.rank === 1 ? "bg-kashmir-gold/10 border-kashmir-gold/30" : "bg-white/[0.02] border-white/5 hover:border-white/10"
                )}
              >
                <div className="w-12 text-center">
                  {agent.rank === 1 ? (
                    <Trophy className="w-8 h-8 text-kashmir-gold mx-auto drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]" />
                  ) : (
                    <span className="text-xl font-black text-white/20 italic">#{agent.rank}</span>
                  )}
                </div>

                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center text-xl font-bold text-white shadow-xl">
                  {agent.avatar}
                </div>

                <div className="flex-1">
                  <h4 className="text-lg font-bold text-white group-hover:text-kashmir-gold transition-colors">{agent.name}</h4>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest font-black">Senior Consultant</p>
                </div>

                <div className="grid grid-cols-2 gap-10">
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Total Revenue</p>
                    <p className={cn("text-xl font-black", agent.rank === 1 ? "text-kashmir-gold" : "text-white")}>{agent.revenue}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Conversion</p>
                    <p className="text-xl font-black text-white">{agent.conversion}</p>
                  </div>
                </div>

                <div className="pl-4">
                  <Button variant="ghost" size="icon" className="text-white/20 hover:text-white hover:bg-white/5 rounded-full">
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
