import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  PieChart,
  Activity,
  Download,
  IndianRupee,
  Briefcase,
  Building,
  Car
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URL } from '@/lib/api';

export default function CMSRevenue() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancials();
  }, []);

  const fetchFinancials = async () => {
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/dashboard/admin`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch financials:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { name: 'Luxury Packages', amount: stats?.packageRevenue || 0, color: 'bg-kashmir-gold', icon: Briefcase },
    { name: 'Hospitality (Hotels)', amount: stats?.hotelRevenue || 0, color: 'bg-blue-400', icon: Building },
    { name: 'Transport (Cabs)', amount: stats?.cabRevenue || 0, color: 'bg-emerald-400', icon: Car },
  ];

  const total = categories.reduce((acc, cat) => acc + cat.amount, 0);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-kashmir-gold text-[10px] font-black uppercase tracking-[0.3em] mb-2">
            <DollarSign className="w-4 h-4" />
            <span>Financial Intelligence</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Revenue Analytics</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl bg-white/5 border-white/5 text-[10px] font-black uppercase tracking-widest px-6 h-12">
            <Download className="w-4 h-4 mr-2" /> Financial Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-[#0a0f12]/40 bg-white/[0.02] border-white/5 p-10 rounded-[3rem] backdrop-blur-xl">
          <div className="flex justify-between items-center mb-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">Gross Revenue</p>
              <h2 className="text-5xl font-display font-black text-white">₹{((stats?.totalRevenue || 0) / 100000).toFixed(2)}L</h2>
            </div>
            <div className="text-right">
              <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-black text-[10px] px-3 py-1 mb-2">
                <TrendingUp className="w-3 h-3 mr-1" /> +18.4%
              </Badge>
              <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">vs Previous Quarter</p>
            </div>
          </div>

          <div className="h-64 flex items-end gap-2 mb-10">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="flex-1 group relative">
                <div 
                  className="w-full bg-gradient-to-t from-kashmir-gold/10 to-kashmir-gold/40 rounded-t-lg transition-all duration-500 group-hover:to-kashmir-gold/80"
                  style={{ height: `${20 + Math.random() * 80}%` }}
                />
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-white text-black text-[8px] font-black px-2 py-1 rounded">
                  ₹{(Math.random() * 50).toFixed(1)}k
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6 pt-10 border-t border-white/5">
            <div>
              <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Net Profit</p>
              <p className="text-xl font-bold text-white">₹{(stats?.totalRevenue * 0.22 / 100000).toFixed(1)}L</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Average Order</p>
              <p className="text-xl font-bold text-white">₹{((stats?.totalRevenue || 0) / (stats?.totalBookings || 1)).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Tax Liability</p>
              <p className="text-xl font-bold text-red-400">₹{(stats?.totalRevenue * 0.05 / 100000).toFixed(1)}L</p>
            </div>
          </div>
        </Card>

        <Card className="bg-[#0a0f12]/40 bg-white/[0.02] border-white/5 p-10 rounded-[3rem] backdrop-blur-xl flex flex-col">
          <h3 className="text-xl font-display font-bold text-white mb-8">Revenue Mix</h3>
          
          <div className="flex-1 space-y-8">
            {categories.map((cat) => (
              <div key={cat.name} className="space-y-3">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-2 text-white/60">
                    <cat.icon className="w-3.5 h-3.5" /> {cat.name}
                  </span>
                  <span className="text-white">{((cat.amount / (total || 1)) * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${cat.color} shadow-[0_0_10px_rgba(212,175,55,0.2)]`} 
                    style={{ width: `${(cat.amount / (total || 1)) * 100}%` }} 
                  />
                </div>
                <p className="text-[10px] font-black text-white/20">₹{(cat.amount / 1000).toFixed(1)}k Transacted</p>
              </div>
            ))}
          </div>

          <div className="mt-10 p-6 rounded-[2rem] bg-kashmir-gold/10 border border-kashmir-gold/10 text-center">
            <p className="text-[10px] font-black text-kashmir-gold uppercase tracking-[0.2em] mb-2">Growth Target</p>
            <p className="text-sm font-bold text-white">₹25L Milestone</p>
            <div className="mt-3 h-1 bg-white/10 rounded-full">
              <div className="h-full bg-kashmir-gold w-[62%]" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
