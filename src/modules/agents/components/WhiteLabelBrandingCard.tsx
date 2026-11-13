import React, { useState } from 'react';
import { 
  Palette, 
  Upload, 
  Eye, 
  Sparkles, 
  Building2, 
  Lock, 
  Check, 
  Save, 
  Share2, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const COLOR_PRESETS = [
  { name: 'Kashmir Chinar Gold', hex: '#d97706' },
  { name: 'Pine Valley Emerald', hex: '#059669' },
  { name: 'Dal Lake Indigo', hex: '#4f46e5' },
  { name: 'Himalayan Crimson', hex: '#e11d48' },
  { name: 'Midnight Charcoal', hex: '#0f172a' }
];

interface WhiteLabelBrandingCardProps {
  isPro: boolean;
  onOpenUpgradeModal: () => void;
  initialBranding?: {
    agencyName: string;
    agencyTagline: string;
    logoUrl: string;
    primaryColor: string;
    phone: string;
    website: string;
  };
  onSaveBranding: (branding: any) => Promise<void>;
}

export const WhiteLabelBrandingCard: React.FC<WhiteLabelBrandingCardProps> = ({
  isPro,
  onOpenUpgradeModal,
  initialBranding,
  onSaveBranding
}) => {
  const [agencyName, setAgencyName] = useState(initialBranding?.agencyName || 'Chinar Luxury Holidays');
  const [agencyTagline, setAgencyTagline] = useState(initialBranding?.agencyTagline || 'Authentic Handcrafted Kashmir DMC');
  const [logoUrl, setLogoUrl] = useState(initialBranding?.logoUrl || '');
  const [primaryColor, setPrimaryColor] = useState(initialBranding?.primaryColor || '#d97706');
  const [phone, setPhone] = useState(initialBranding?.phone || '+91 99060 12345');
  const [website, setWebsite] = useState(initialBranding?.website || 'www.chinarholidays.com');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPro) {
      onOpenUpgradeModal();
      return;
    }

    try {
      setIsSaving(true);
      await onSaveBranding({
        agencyName,
        agencyTagline,
        logoUrl,
        primaryColor,
        phone,
        website
      });
      toast.success('Agency White-Label Branding Saved!', {
        description: 'Client proposals will now feature your agency branding.',
        icon: '🎨'
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to save branding');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Pro Banner or Status */}
      {!isPro ? (
        <div className="bg-gradient-to-r from-amber-500/15 via-primary/10 to-transparent p-5 rounded-3xl border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                White-Label Agency Branding
                <Badge className="bg-amber-500 text-white font-bold text-[10px]">Pro Feature</Badge>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Remove the Kashmir Connect watermark. Add your custom agency logo, colors, and phone number to all client proposals.
              </p>
            </div>
          </div>

          <Button
            onClick={onOpenUpgradeModal}
            className="rounded-xl text-xs font-bold gap-2 shrink-0 bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Upgrade to Pro DMC</span>
          </Button>
        </div>
      ) : (
        <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>White-Label Active • Client proposals display your brand exclusively</span>
          </div>
          <Badge className="bg-emerald-500 text-white font-bold text-[10px]">Pro Active</Badge>
        </div>
      )}

      {/* Grid: Settings Form & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Branding Form */}
        <Card className="rounded-3xl border border-border/70 p-6 bg-card shadow-sm space-y-4">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Agency Identity & Logo
            </CardTitle>
            <CardDescription className="text-xs">
              Configure how your travel proposals appear to clients on mobile and web.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Agency Trade Name</Label>
              <Input
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="e.g. Chinar Luxury Holidays"
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tagline / Slogan</Label>
              <Input
                value={agencyTagline}
                onChange={(e) => setAgencyTagline(e.target.value)}
                placeholder="e.g. Official Kashmir Tourism Specialist"
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Custom Logo Image URL</Label>
              <Input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://.../logo.png"
                className="rounded-xl text-xs"
              />
            </div>

            {/* Brand Color Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Primary Brand Accent Color</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_PRESETS.map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => setPrimaryColor(col.hex)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      primaryColor === col.hex ? 'scale-110 border-foreground shadow-sm' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: col.hex }}
                    title={col.name}
                  />
                ))}
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-24 h-8 rounded-lg font-mono text-xs uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Public WhatsApp Number</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91..."
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Agency Website (Optional)</Label>
                <Input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="www.agency.com"
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-xl text-xs font-bold gap-2 py-2.5 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving Branding...' : 'Save Agency Branding'}</span>
            </Button>
          </form>
        </Card>

        {/* Right: Live Traveler View Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              Live Traveler Proposal Preview
            </span>
            <Badge variant="outline" className="text-[10px]">Client Screen</Badge>
          </div>

          <div className="bg-card border-2 border-border/80 rounded-3xl p-5 shadow-md space-y-4">
            {/* Header with Agency Branding */}
            <div className="p-4 rounded-2xl border" style={{ borderColor: `${primaryColor}40`, backgroundColor: `${primaryColor}08` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-base shadow-sm shrink-0"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {agencyName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{agencyName}</h4>
                    <p className="text-[11px] text-muted-foreground">{agencyTagline}</p>
                  </div>
                </div>

                <Badge 
                  className="text-white text-[10px] font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  Verified DMC
                </Badge>
              </div>
            </div>

            {/* Proposal Body Sample */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Trip: 5N/6D Royal Kashmir Escapes</span>
                <span className="font-bold text-foreground">₹54,000</span>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl text-[11px] text-muted-foreground space-y-1">
                <p>• Premium Stay at Nigeen Lake Royal Cedar Houseboat</p>
                <p>• Private Innova Crysta Chauffeur (Snow Chains Equipped)</p>
                <p>• Direct Contact: {phone}</p>
              </div>
            </div>

            <div className="pt-2 text-center">
              <span className="text-[10px] text-muted-foreground">
                Powered by Kashmir Connect DMC Infrastructure
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhiteLabelBrandingCard;
