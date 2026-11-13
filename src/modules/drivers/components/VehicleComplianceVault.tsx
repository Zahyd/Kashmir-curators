import React from 'react';
import { 
  ShieldCheck, 
  FileCheck, 
  Snowflake, 
  AlertCircle, 
  Calendar, 
  Upload, 
  Award,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface VehicleComplianceVaultProps {
  licenseNumber: string;
  vehicleRegNo: string;
  licenseExpiry: string;
  policeVerification: string;
  experienceYears: number;
}

export const VehicleComplianceVault: React.FC<VehicleComplianceVaultProps> = ({
  licenseNumber,
  vehicleRegNo,
  licenseExpiry,
  policeVerification,
  experienceYears
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base text-foreground">Vehicle & Driver Compliance</h3>
          <p className="text-xs text-muted-foreground">Government documents & verified credentials.</p>
        </div>
        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-bold gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          100% Compliant
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Police Verification */}
        <Card className="rounded-2xl border border-border/70 p-4 bg-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">J&K Police Clearance</span>
            <Badge className="bg-emerald-500 text-white text-[10px] font-bold">
              {policeVerification || 'Verified'}
            </Badge>
          </div>
          <p className="font-bold text-sm text-foreground">Zero Tourist Grievances</p>
          <p className="text-[11px] text-muted-foreground">Issued by District Police Office, Srinagar.</p>
        </Card>

        {/* Commercial Driving License */}
        <Card className="rounded-2xl border border-border/70 p-4 bg-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Commercial License</span>
            <span className="text-xs font-mono font-bold text-foreground">{licenseNumber}</span>
          </div>
          <p className="font-bold text-sm text-foreground">Valid until {licenseExpiry}</p>
          <p className="text-[11px] text-muted-foreground">{experienceYears}+ years mountain driving experience.</p>
        </Card>

        {/* Vehicle Registration & Fitness */}
        <Card className="rounded-2xl border border-border/70 p-4 bg-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Vehicle RC & Fitness</span>
            <span className="text-xs font-mono font-bold text-primary">{vehicleRegNo}</span>
          </div>
          <p className="font-bold text-sm text-foreground">Commercial Tourist Permit</p>
          <p className="text-[11px] text-muted-foreground">Fitness passed with high-altitude heating clearance.</p>
        </Card>

        {/* Snow Chains & Winter Pass */}
        <Card className="rounded-2xl border border-border/70 p-4 bg-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Winter Equipment</span>
            <Badge className="bg-blue-500 text-white text-[10px] font-bold flex items-center gap-1">
              <Snowflake className="w-3 h-3" />
              Equipped
            </Badge>
          </div>
          <p className="font-bold text-sm text-foreground">Gulmarg & Sonamarg Snow Chains</p>
          <p className="text-[11px] text-muted-foreground">Certified 4x4 / Snow chain traction kit onboard.</p>
        </Card>
      </div>

      <Button
        variant="outline"
        onClick={() => toast.info('Document renewal desk is up to date')}
        className="w-full rounded-2xl text-xs font-semibold py-2.5 gap-2"
      >
        <Upload className="w-3.5 h-3.5" />
        <span>Upload Document Renewal</span>
      </Button>
    </div>
  );
};

export default VehicleComplianceVault;
