import React, { useState, useEffect } from 'react';
import {
  Palette,
  Eye,
  Sparkles,
  Lock,
  Save,
  ShieldCheck
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AgentBranding, getErrMsg } from '../lib/agentApi';

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
  initialBranding?: Partial<AgentBranding>;
  onSaveBranding: (branding: AgentBranding) => Promise<void>;
}

export const WhiteLabelBrandingCard: React.FC<WhiteLabelBrandingCardProps> = ({
  isPro,
  onOpenUpgradeModal,
  initialBranding,
  onSaveBranding
}) => {
  const [agencyName, setAgencyName] = useState(initialBranding?.agencyName || '');
  const [agencyTagline, setAgencyTagline] = useState(
    initialBranding?.agencyTagline || 'Verified Kashmir Tour Operator & B2B Partner'
  );
  const [logoUrl, setLogoUrl] = useState(initialBranding?.logoUrl || '');
  const [primaryColor, setPrimaryColor] = useState(initialBranding?.primaryColor || '#d97706');
  const [phone, setPhone] = useState(initialBranding?.phone || '');
  const [website, setWebsite] = useState(initialBranding?.website || '');
  const [isSaving, setIsSaving] = useState(false);

  const bName = initialBranding?.agencyName;
  const bTagline = initialBranding?.agencyTagline;
  const bLogo = initialBranding?.logoUrl;
  const bColor = initialBranding?.primaryColor;
  const bPhone = initialBranding?.phone;
  const bWebsite = initialBranding?.website;

  useEffect(() => {
    if (bName !== undefined) setAgencyName(bName);
    if (bTagline !== undefined) setAgencyTagline(bTagline);
    if (bLogo !== undefined) setLogoUrl(bLogo);
    if (bColor !== undefined) setPrimaryColor(bColor);
    if (bPhone !== undefined) setPhone(bPhone);
    if (bWebsite !== undefined) setWebsite(bWebsite);
  }, [bName, bTagline, bLogo, bColor, bPhone, bWebsite]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPro) {
      onOpenUpgradeModal();
      return;
    }
    if (!agencyName.trim()) {
      toast.error('Agency trade name is required');
      return;
    }

    try {
      setIsSaving(true);
      await onSaveBranding({
        agencyName: agencyName.trim(),
        agencyTagline: agencyTagline.trim(),
        logoUrl: logoUrl.trim(),
        primaryColor,
        phone: phone.trim(),
        website: website.trim()
      });
      toast.success('Agency White-Label Branding Saved to Database!', {
        description: 'Client proposals and portals will reflect your saved identity across devices.'
      });
    } catch (err: unknown) {
      toast.error(getErrMsg(err, 'Failed to save branding'));
    } finally {
      setIsSaving(false);
    }
  };

  const previewName = agencyName.trim() || 'Your Agency Name';

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
                Remove platform watermark. Persist your custom agency logo, colors, and contact number on all proposals.
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
            <span>White-Label Active • Persisted in Agency Organization Profile</span>
          </div>
          <Badge className="bg-emerald-500 text-white font-bold text-[10px]">Pro Active</Badge>
        </div>
      )}

      {/* Grid: Settings Form & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card className="rounded-3xl border border-border/70 p-6 bg-card shadow-sm space-y-4">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Agency Identity & Logo
            </CardTitle>
            <CardDescription className="text-xs">
              Configure how your travel proposals appear to clients across mobile and desktop.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Agency Trade Name</Label>
              <Input
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="e.g. Zahid Travels"
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
                  placeholder="www.youragency.com"
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
              <span>{isSaving ? 'Saving to Database...' : 'Save Agency Branding'}</span>
            </Button>
          </form>
        </Card>

        {/* Right: Live Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              Live Traveler Proposal Preview
            </span>
            <Badge variant="outline" className="text-[10px]">Client Header Preview</Badge>
          </div>

          <div className="bg-card border-2 border-border/80 rounded-3xl p-5 shadow-md space-y-4">
            <div className="p-4 rounded-2xl border" style={{ borderColor: `${primaryColor}40`, backgroundColor: `${primaryColor}08` }}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  {logoUrl ? (
                    <img src={logoUrl} alt={previewName} className="w-10 h-10 rounded-xl object-cover shrink-0 border" />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-base shadow-sm shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {previewName.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-foreground truncate">{previewName}</h4>
                    <p className="text-[11px] text-muted-foreground truncate">{agencyTagline}</p>
                  </div>
                </div>

                <Badge className="text-white text-[10px] font-bold shrink-0" style={{ backgroundColor: primaryColor }}>
                  Verified DMC
                </Badge>
              </div>
            </div>

            <div className="p-3 bg-muted/40 rounded-xl text-[11px] text-muted-foreground space-y-1">
              <p>Contact: {phone || 'Not configured'}</p>
              <p>Website: {website || 'Not configured'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhiteLabelBrandingCard;
