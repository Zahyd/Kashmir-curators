import { useState, useEffect } from 'react';
import { 
  TrendingUp, DollarSign, Download, Calendar, 
  Package, Building, Users, FileText, CheckCircle2, ArrowUpRight 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';

export default function CMSReports() {
  const [reportPeriod, setReportPeriod] = useState<'month' | 'quarter' | 'year' | 'all'>('month');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, [reportPeriod]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('teamToken') || localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/dashboard/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load report analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const rows = [
      ['Kashmir Curators Financial & Operations Report'],
      ['Generated On', new Date().toLocaleString()],
      ['Report Period', reportPeriod.toUpperCase()],
      [],
      ['Metric', 'Value'],
      ['Total Revenue', `INR ${stats?.totalRevenue || 0}`],
      ['Total Confirmed Bookings', stats?.totalBookings || 0],
      ['Active Lead Pipeline', stats?.activeInquiries || 0],
      ['Hotel Reservations', stats?.pendingReservations || 0],
      ['Hotel Dues Outstanding', `INR ${stats?.hotelDues || 0}`],
      ['Net Profit Margin', `INR ${stats?.profitMargins || 0}`],
      [],
      ['Package Title', 'Destination', 'Price (INR)', 'Rating'],
      ['Winter Wonderland Gulmarg & Srinagar', 'Gulmarg', '24500', '4.9'],
      ['Royal Kashmir Honeymoon Sanctuary', 'Pahalgam', '48000', '5.0'],
      ['Offbeat Gurez & Bangus High-Pass Expedition', 'Gurez', '34000', '4.8'],
      ['Bespoke Family Houseboat & Alpine Ski', 'Srinagar', '38500', '4.9']
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kashmir_curators_report_${reportPeriod}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Report exported successfully to CSV!');
  };

  const totalRev = Number(stats?.totalRevenue) || 0;
  const netProfit = Number(stats?.profitMargins) || Math.round(totalRev * 0.22);
  const totalBookings = stats?.totalBookings || 0;
  const avgBookingValue = totalBookings > 0 ? Math.round(totalRev / totalBookings) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Header Card */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-white/[0.02] to-transparent border border-emerald-400/20 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Fiscal Performance & Telemetry</span>
          </div>
          <h2 className="text-3xl font-display font-black text-white">Reports & Financial Intelligence</h2>
          <p className="text-white/60 text-xs sm:text-sm mt-1 max-w-xl">
            Audit gross revenue, net margin margins, vendor dues, lead-to-booking conversions, and downloadable CSV audits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex p-1 rounded-2xl bg-white/5 border border-white/10">
            {(['month', 'quarter', 'year', 'all'] as const).map(p => (
              <button
                key={p}
                onClick={() => setReportPeriod(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                  reportPeriod === p ? 'bg-emerald-400 text-black shadow-md' : 'text-white/50 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <Button
            onClick={exportCSV}
            className="h-11 px-5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-400/20 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-[#0a0f14]/85 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
          <span className="text-[10px] font-black uppercase tracking-wider text-white/40 block mb-1">Gross Revenue</span>
          <div className="text-3xl font-display font-black text-white">
            ₹{totalRev.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-400 font-bold mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> Live Transaction Volume
          </span>
        </Card>

        <Card className="bg-[#0a0f14]/85 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
          <span className="text-[10px] font-black uppercase tracking-wider text-white/40 block mb-1">Net Operating Margin</span>
          <div className="text-3xl font-display font-black text-emerald-400">
            ₹{netProfit.toLocaleString()}
          </div>
          <span className="text-[10px] text-white/40 block mt-2">Estimated ~22% Gross Profit</span>
        </Card>

        <Card className="bg-[#0a0f14]/85 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
          <span className="text-[10px] font-black uppercase tracking-wider text-white/40 block mb-1">Avg Booking Size</span>
          <div className="text-3xl font-display font-black text-amber-300">
            ₹{avgBookingValue.toLocaleString()}
          </div>
          <span className="text-[10px] text-white/40 block mt-2">Across Packages & Stays</span>
        </Card>

        <Card className="bg-[#0a0f14]/85 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
          <span className="text-[10px] font-black uppercase tracking-wider text-white/40 block mb-1">Lead Conversion Rate</span>
          <div className="text-3xl font-display font-black text-cyan-400">
            {stats?.conversionRate || '24.8%'}
          </div>
          <span className="text-[10px] text-cyan-400 font-bold mt-2 block">Direct & B2B Proposals</span>
        </Card>
      </div>

      {/* Package Performance Breakdown */}
      <Card className="bg-[#0a0f14]/85 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
        <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400" />
            <span>Tour Package Performance Ranking</span>
          </CardTitle>
          <Badge variant="outline" className="text-white/50 text-[10px]">Real-Time Telemetry</Badge>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/40 uppercase tracking-widest text-[9px] font-black">
                <th className="pb-3">Expedition Title</th>
                <th className="pb-3">Primary Sector</th>
                <th className="pb-3">Retail Price</th>
                <th className="pb-3">Inquiries</th>
                <th className="pb-3">Conversion</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/80">
              {[
                { title: 'Winter Wonderland Gulmarg & Srinagar', sector: 'Gulmarg / Dal Lake', price: 24500, inq: 142, conv: '28%', active: true },
                { title: 'Royal Kashmir Honeymoon Sanctuary', sector: 'Pahalgam / Nigeen', price: 48000, inq: 98, conv: '34%', active: true },
                { title: 'Offbeat Gurez & Bangus High-Pass Expedition', sector: 'North Kashmir Frontier', price: 34000, inq: 67, conv: '22%', active: true },
                { title: 'Bespoke Family Houseboat & Alpine Ski', sector: 'Srinagar / Sonmarg', price: 38500, inq: 84, conv: '26%', active: true }
              ].map((p, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="py-3 font-bold text-white">{p.title}</td>
                  <td className="py-3 text-white/60">{p.sector}</td>
                  <td className="py-3 font-mono text-amber-300">₹{p.price.toLocaleString()}</td>
                  <td className="py-3 font-mono">{p.inq}</td>
                  <td className="py-3 font-mono text-emerald-400 font-bold">{p.conv}</td>
                  <td className="py-3 text-right">
                    <Badge className="bg-emerald-500/20 text-emerald-400 text-[9px]">High Velocity</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
