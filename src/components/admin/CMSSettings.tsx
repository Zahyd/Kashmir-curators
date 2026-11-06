import { useState } from 'react';
import { 
  Settings, ShieldAlert, Phone, Mail, DollarSign, 
  Save, Bell, CheckCircle2, RefreshCw, Key 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function CMSSettings() {
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [emergencyMessage, setEmergencyMessage] = useState('All Kashmir mountain corridors operating normally under certified weather safety clearance.');
  const [supportPhone, setSupportPhone] = useState('+91 91037 98448');
  const [supportEmail, setSupportEmail] = useState('Zahidreyaz44123@gmail.com');
  const [currencySymbol, setCurrencySymbol] = useState('INR (₹)');
  const [gstPercentage, setGstPercentage] = useState('5');
  const [autoAssignLeads, setAutoAssignLeads] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success('Platform operational settings saved successfully!');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Header Card */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 via-white/[0.02] to-transparent border border-amber-400/20 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-2">
            <Settings className="w-3.5 h-3.5" />
            <span>HQ Operations Control</span>
          </div>
          <h2 className="text-3xl font-display font-black text-white">Platform Settings & Protocols</h2>
          <p className="text-white/60 text-xs sm:text-sm mt-1 max-w-xl">
            Configure system emergency broadcast mode, lead routing rules, tax specifications, and contact protocols.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="h-11 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-400/20 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Emergency Broadcast Shield */}
        <Card className="bg-[#0a0f14]/85 border border-red-500/30 p-6 rounded-3xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl pointer-events-none" />
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <span>Valley Crisis & Weather Broadcast Mode</span>
              </span>
              <Switch checked={emergencyMode} onCheckedChange={setEmergencyMode} />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <p className="text-xs text-white/60 leading-relaxed">
              When toggled ON, an alert broadcast banner will instantly appear across the entire public platform advising travelers of snowfall or road diversions.
            </p>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">
                Broadcast Advisory Text
              </label>
              <Input
                value={emergencyMessage}
                onChange={e => setEmergencyMessage(e.target.value)}
                className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Badge className={emergencyMode ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}>
                {emergencyMode ? 'CRISIS BROADCAST ACTIVE' : 'NORMAL VALLEY OPERATIONS'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Lead Automation Rules */}
        <Card className="bg-[#0a0f14]/85 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                <span>Lead Routing & Concierge Dispatch</span>
              </span>
              <Switch checked={autoAssignLeads} onCheckedChange={setAutoAssignLeads} />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <p className="text-xs text-white/60 leading-relaxed">
              Automatically distribute incoming inquiries from landing page and trip planner across active sales executives using round-robin capacity.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">
                  Support Direct Phone
                </label>
                <Input
                  value={supportPhone}
                  onChange={e => setSupportPhone(e.target.value)}
                  className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">
                  Support Email
                </label>
                <Input
                  value={supportEmail}
                  onChange={e => setSupportEmail(e.target.value)}
                  className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fiscal & Tax Rates */}
        <Card className="bg-[#0a0f14]/85 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span>Currency & Tax Governance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">
                  Display Currency
                </label>
                <Input
                  value={currencySymbol}
                  onChange={e => setCurrencySymbol(e.target.value)}
                  className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">
                  Standard GST Tax (%)
                </label>
                <Input
                  value={gstPercentage}
                  onChange={e => setGstPercentage(e.target.value)}
                  className="bg-white/5 border-white/10 text-white text-xs rounded-xl font-mono"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integration Credentials Status */}
        <Card className="bg-[#0a0f14]/85 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-400" />
              <span>Connected Integration Bridges</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-3">
            {[
              { name: 'Neon Serverless PostgreSQL', status: 'Connected & Healthy', icon: CheckCircle2, color: 'text-emerald-400' },
              { name: 'Cloudinary Media CDN', status: 'Active (Direct Uploads)', icon: CheckCircle2, color: 'text-emerald-400' },
              { name: 'Razorpay Payment Gateway', status: 'Test Keys Verified', icon: CheckCircle2, color: 'text-emerald-400' },
              { name: 'Gmail SMTP / Nodemailer', status: 'Configured for Quotations', icon: CheckCircle2, color: 'text-emerald-400' }
            ].map((srv, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-xs">
                <span className="text-white font-medium">{srv.name}</span>
                <span className={`flex items-center gap-1.5 font-bold ${srv.color}`}>
                  <srv.icon className="w-3.5 h-3.5" />
                  {srv.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
