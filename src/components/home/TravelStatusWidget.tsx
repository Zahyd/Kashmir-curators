import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Compass, Snowflake, Mountain, ArrowRight, ShieldAlert, CheckCircle2, Car, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/lib/api';

export default function TravelStatusWidget() {
  const [corridors, setCorridors] = useState<any[]>([
    { location: 'NH-44 Jammu-Srinagar', status: 'Open', severity: 'NORMAL', icon: Car },
    { location: 'Gulmarg Gondola Ph 1 & 2', status: 'Open', severity: 'NORMAL', icon: Mountain },
    { location: 'Sonamarg & Zojila Pass', status: 'Caution', severity: 'WARNING', icon: Snowflake },
    { location: 'Pahalgam Lidder Circuit', status: 'Open', severity: 'NORMAL', icon: Compass },
  ]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/advisories`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setCorridors(data.slice(0, 4));
          }
        }
      } catch (err) {
        // use fallback
      }
    };
    fetchStatus();
  }, []);

  return (
    <section className="py-12 bg-white border-y border-slate-200 relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 text-[10px] font-bold uppercase tracking-widest mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Ground Operations Intelligence</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-[#111439]">Live Kashmir Travel Status</h3>
            <p className="text-xs text-[#4A5568] mt-1">Verified road clearance, snow conditions, and mountain pass operations.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/travel-status">
              <Button variant="outline" className="border-slate-200 hover:border-slate-300 text-[#111439] bg-white font-bold text-xs uppercase tracking-wider rounded-xl h-11 px-5 shadow-sm">
                <span>View All Corridors</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Corridors Status Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {corridors.map((c, i) => {
            const isCaution = c.severity === 'WARNING' || c.status === 'Caution';
            const isClosed = c.severity === 'CRITICAL_EMERGENCY' || c.severity === 'SEVERE' || c.status === 'Closed';
            return (
              <div key={i} className="p-4 rounded-2xl bg-[#F8F8F9] border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#111439] truncate max-w-[170px]">{c.location}</span>
                  <Badge className={`text-[9px] uppercase font-black tracking-wider ${
                    isClosed
                      ? 'bg-rose-100 text-rose-700 border-rose-200'
                      : isCaution
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}>
                    {c.status || 'Open'}
                  </Badge>
                </div>
                <p className="text-[11px] text-[#4A5568] line-clamp-2">
                  {c.message || 'Pass clear and accessible for tourist light motor vehicles.'}
                </p>
              </div>
            );
          })}
        </div>

        {/* Kashmir Flex Booking Protection Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-50 via-white to-slate-50 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h5 className="font-bold text-[#111439] text-sm">Protected by Kashmir Flex Protocol</h5>
              <p className="text-xs text-[#4A5568]">
                100% wallet refund or free alternate destination rerouting if weather or transit closures affect your itinerary.
              </p>
            </div>
          </div>

          <Link to="/packages">
            <Button className="bg-[#111439] hover:bg-[#1c225a] text-white font-black text-xs uppercase tracking-wider px-5 h-10 rounded-xl shrink-0 shadow-md">
              Book Protected Trips
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
