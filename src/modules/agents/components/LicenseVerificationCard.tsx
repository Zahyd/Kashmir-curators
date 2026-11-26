import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Upload, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Building2, 
  Award, 
  QrCode, 
  ExternalLink,
  Copy,
  Info,
  Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface LicenseVerificationCardProps {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_APPLIED';
  agentCode?: string;
  companyName?: string;
  licenseNumber?: string;
  commissionPct?: number;
  onSubmitVerification: (data: {
    companyName: string;
    licenseNumber: string;
    association: string;
    gstin: string;
    officeAddress: string;
    file?: File | null;
  }) => Promise<void>;
}

export const LicenseVerificationCard: React.FC<LicenseVerificationCardProps> = ({
  status,
  agentCode,
  companyName,
  licenseNumber,
  commissionPct = 10,
  onSubmitVerification
}) => {
  const [formData, setFormData] = useState({
    companyName: companyName || '',
    licenseNumber: licenseNumber || '',
    association: 'TAAK',
    gstin: '',
    officeAddress: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.licenseNumber) {
      toast.error('Company Name and J&K Tourism License Number are required.');
      return;
    }
    try {
      setIsSubmitting(true);
      await onSubmitVerification({ ...formData, file: selectedFile });
      toast.success('Accreditation application submitted successfully!');
    } catch (err: unknown) {
      toast.error(err instanceof Error && err.message ? err.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyBadgeLink = () => {
    const url = `${window.location.origin}/verify/${agentCode || 'partner'}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Public Verified Partner link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner explaining why licensing matters */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent p-5 rounded-3xl border border-emerald-500/20 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground">
              Official J&K Tourism Accreditation & B2B Trust Standard
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed max-w-2xl">
              Verified travel agents get priority access to wholesale houseboats, Gulmarg Gondola coordination, police-cleared fleet, and official "Kashmir Connect Verified Partner" status.
            </p>
          </div>
        </div>

        <div className="shrink-0">
          {status === 'APPROVED' ? (
            <Badge className="bg-emerald-500 text-white font-bold px-3 py-1 text-xs gap-1.5 shadow-sm">
              <ShieldCheck className="w-4 h-4" />
              Verified & Licensed Partner
            </Badge>
          ) : status === 'PENDING' ? (
            <Badge className="bg-amber-500 text-white font-bold px-3 py-1 text-xs gap-1.5 animate-pulse">
              <Clock className="w-4 h-4" />
              Verification In Review (24h SLA)
            </Badge>
          ) : (
            <Badge variant="outline" className="font-semibold text-xs border-dashed">
              Accreditation Required
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form or Approved Certificate Card */}
        <div className="lg:col-span-2 space-y-6">
          {status === 'APPROVED' ? (
            <Card className="border-emerald-500/30 bg-card rounded-3xl overflow-hidden shadow-sm">
              <CardHeader className="bg-emerald-500/5 border-b border-emerald-500/10 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <CardTitle className="text-lg">Accreditation Certificate</CardTitle>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-none font-bold">
                    Tier 1 DMC Partner
                  </Badge>
                </div>
                <CardDescription>
                  Your agency is officially certified to vend tourism packages across Jammu & Kashmir.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/40 rounded-2xl border border-border/50">
                    <span className="text-xs text-muted-foreground">Company Name</span>
                    <p className="font-bold text-foreground text-sm mt-0.5">{companyName || 'Registered Travel Co'}</p>
                  </div>
                  <div className="p-4 bg-muted/40 rounded-2xl border border-border/50">
                    <span className="text-xs text-muted-foreground">J&K Tourism Reg No.</span>
                    <p className="font-bold text-foreground text-sm mt-0.5 font-mono">{licenseNumber || 'JK-TOUR-2026-X89'}</p>
                  </div>
                  <div className="p-4 bg-muted/40 rounded-2xl border border-border/50">
                    <span className="text-xs text-muted-foreground">Partner Code</span>
                    <p className="font-bold text-primary text-sm mt-0.5 font-mono">{agentCode || 'AGT-KASHMIR-01'}</p>
                  </div>
                  <div className="p-4 bg-muted/40 rounded-2xl border border-border/50">
                    <span className="text-xs text-muted-foreground">Contract Commission</span>
                    <p className="font-bold text-emerald-600 text-sm mt-0.5">{commissionPct}% Net Wholesale Markup</p>
                  </div>
                </div>

                {/* Shareable Trust Seal */}
                <div className="p-4 border border-dashed border-emerald-500/40 rounded-2xl bg-emerald-500/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-background border flex items-center justify-center text-primary shadow-sm">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">Public Trust Profile & Seal</h4>
                      <p className="text-xs text-muted-foreground">Share with clients to prove government registration and genuine bookings.</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleCopyBadgeLink}
                    variant="outline"
                    className="shrink-0 gap-2 rounded-xl border-emerald-500/30 hover:bg-emerald-500/10"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied URL' : 'Copy Seal Link'}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-3xl border border-border/80 shadow-sm overflow-hidden bg-card">
              <CardHeader className="p-6 border-b border-border/50 bg-muted/20">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Apply for J&K Tourism Verification
                </CardTitle>
                <CardDescription>
                  Enter your official trade registration details to unlock wholesale inventory and verified badges.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="companyName" className="text-xs font-semibold">
                        Registered Agency / DMC Name <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="companyName"
                        placeholder="e.g. Chinar Luxury Holidays"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        required
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="licenseNumber" className="text-xs font-semibold">
                        J&K Tourism Reg. / License No. <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="licenseNumber"
                        placeholder="e.g. TRC/SXR/2024/774"
                        value={formData.licenseNumber}
                        onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                        required
                        className="rounded-xl font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="gstin" className="text-xs font-semibold">GSTIN Number (Optional)</Label>
                      <Input
                        id="gstin"
                        placeholder="e.g. 01AAAAA0000A1Z5"
                        value={formData.gstin}
                        onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                        className="rounded-xl font-mono uppercase"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="association" className="text-xs font-semibold">Affiliated Trade Body</Label>
                      <Input
                        id="association"
                        placeholder="e.g. TAAK, TASK, PILTOF, IATO"
                        value={formData.association}
                        onChange={(e) => setFormData({ ...formData, association: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="officeAddress" className="text-xs font-semibold">
                      Registered Office Address
                    </Label>
                    <Input
                      id="officeAddress"
                      placeholder="e.g. Boulevard Road, Near TRC, Srinagar, J&K - 190001"
                      value={formData.officeAddress}
                      onChange={(e) => setFormData({ ...formData, officeAddress: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>

                  <div className="p-4 bg-muted/40 rounded-2xl border border-dashed border-border/80 flex flex-col items-center justify-center text-center p-6 space-y-2">
                    <Upload className="w-8 h-8 text-primary/60" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {selectedFile ? selectedFile.name : 'Upload Tourism Certificate / GST Doc'}
                      </p>
                      <p className="text-[11px] text-muted-foreground">PDF, PNG or JPG (Max 5MB)</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl text-xs"
                    >
                      {selectedFile ? 'Change Document' : 'Select Documents'}
                    </Button>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full rounded-xl font-semibold gap-2 shadow-md shadow-primary/20 py-2.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isSubmitting ? 'Submitting Details...' : 'Submit for J&K Tourism Verification'}</span>
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right 1 Col: Compliance Steps & FAQ */}
        <div className="space-y-4">
          <Card className="rounded-3xl border border-border/70 p-5 bg-card">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-primary" />
              Verification Checklist
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">
                  Valid registration with J&K Directorate of Tourism (TRC Srinagar / Jammu).
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">
                  Police clearance & zero complaints on the tourist grievance cell.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">
                  Physical office presence in Jammu & Kashmir or registered tourism GSTIN.
                </span>
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border border-border/70 p-5 bg-muted/20">
            <h4 className="font-bold text-sm text-foreground mb-1">Partner Benefits</h4>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4 mt-2">
              <li>Direct wholesale access to luxury Houseboats on Dal & Nigeen.</li>
              <li>Priority allocation of Innova Crysta & 4x4 snow chain vehicles.</li>
              <li>White-labeled PDF/Web proposals featuring your agency's logo.</li>
              <li>Automated payment link generation with protected wallet escrow.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LicenseVerificationCard;
