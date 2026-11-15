import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Upload, 
  FileText, 
  Sparkles, 
  Lock, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  Check, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export const AgencyOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const initialPlan = searchParams.get('plan')?.toUpperCase() || 'STARTER';

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    agencyName: '',
    authorizedPerson: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: '',
    websiteOrSocial: '',
    businessCategory: 'TOUR_OPERATOR',
    tourismLicenseNo: '',
    gstin: '',
    documentUrl: '',
    selectedPlan: initialPlan === 'PROFESSIONAL' || initialPlan === 'ENTERPRISE' ? initialPlan : 'STARTER',
    billingCycle: 'MONTHLY'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 1) {
      if (!formData.agencyName.trim() || !formData.authorizedPerson.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.location.trim()) {
        toast.error('Please fill in all mandatory agency contact fields');
        return;
      }
      setCurrentStep(2);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    } else if (currentStep === 2) {
      setCurrentStep(3);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const handleSubmitApplication = async () => {
    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/agents/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: user?.id || null
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit application');
      }

      const result = await res.json();
      toast.success('Agency application successfully submitted!');
      navigate(`/agent/success?ref=${result.applicationRef}&email=${encodeURIComponent(formData.email)}`);
    } catch (error: any) {
      toast.error(error.message || 'Submission error. Please check details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-amber-500 selection:text-black">
      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        {/* Header Navigation */}
        <div className="mb-8">
          <Link 
            to="/agent"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to B2B Platform Overview</span>
          </Link>

          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-bold">
              Agency Partner Onboarding
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">Official J&K DMC Portal</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-black text-foreground tracking-tight mt-2">
            Apply for B2B Agency Access
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
            Gain direct contracted wholesale rates for 5-star Gulmarg ski resorts, heritage houseboats, and 1,200+ 4x4 cabs. Applications are reviewed within 24–48 hours.
          </p>
        </div>

        {/* Multi-Step Progress Tracker */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
          {[
            { step: 1, title: 'Agency Profile', desc: 'Contact & Location' },
            { step: 2, title: 'Credentials', desc: 'J&K License & GST' },
            { step: 3, title: 'Plan & Review', desc: 'Entitlements' }
          ].map((s) => {
            const isActive = currentStep === s.step;
            const isCompleted = currentStep > s.step;
            return (
              <div 
                key={s.step} 
                className={`p-3 sm:p-4 rounded-2xl border transition-all ${
                  isActive 
                    ? 'border-amber-500 bg-amber-500/10 shadow-sm' 
                    : isCompleted 
                    ? 'border-emerald-500/40 bg-emerald-500/5' 
                    : 'border-border/60 bg-card/40 opacity-70'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                    isCompleted 
                      ? 'bg-emerald-500 text-white' 
                      : isActive 
                      ? 'bg-amber-500 text-slate-950 font-black' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.step}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{s.title}</p>
                    <p className="text-[10px] text-muted-foreground hidden sm:block truncate">{s.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* STEP 1: AGENCY & CONTACT DETAILS */}
        {currentStep === 1 && (
          <Card className="rounded-3xl border-border/70 bg-card shadow-xl overflow-hidden animate-fade-in">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleNextStep} className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-500" />
                    <span>Step 1: Agency & Representative Details</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Provide your registered travel business information.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-foreground">Travel Agency / Company Name *</label>
                    <Input
                      placeholder="e.g. Himalayan Horizon Holidays"
                      value={formData.agencyName}
                      onChange={e => handleInputChange('agencyName', e.target.value)}
                      required
                      className="rounded-xl h-11 bg-background text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Authorized Representative Name *</label>
                    <Input
                      placeholder="e.g. Rajesh Sharma"
                      value={formData.authorizedPerson}
                      onChange={e => handleInputChange('authorizedPerson', e.target.value)}
                      required
                      className="rounded-xl h-11 bg-background text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Business Category *</label>
                    <Select 
                      value={formData.businessCategory} 
                      onValueChange={val => handleInputChange('businessCategory', val)}
                    >
                      <SelectTrigger className="rounded-xl h-11 bg-background text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TOUR_OPERATOR" className="text-xs">Outbound Tour Operator</SelectItem>
                        <SelectItem value="TRAVEL_AGENT" className="text-xs">Retail Travel Agency</SelectItem>
                        <SelectItem value="CORPORATE_DESK" className="text-xs">Corporate Travel Desk</SelectItem>
                        <SelectItem value="FREELANCE_CURATOR" className="text-xs">Independent Travel Curator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Official Business Email *</label>
                    <Input
                      type="email"
                      placeholder="e.g. b2b@himalayanholidays.com"
                      value={formData.email}
                      onChange={e => handleInputChange('email', e.target.value)}
                      required
                      className="rounded-xl h-11 bg-background text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Phone / WhatsApp Number *</label>
                    <Input
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={formData.phone}
                      onChange={e => handleInputChange('phone', e.target.value)}
                      required
                      className="rounded-xl h-11 bg-background text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Operating City & State *</label>
                    <Input
                      placeholder="e.g. New Delhi, Delhi"
                      value={formData.location}
                      onChange={e => handleInputChange('location', e.target.value)}
                      required
                      className="rounded-xl h-11 bg-background text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Agency Website or Social Profile (Optional)</label>
                    <Input
                      placeholder="e.g. www.himalayanholidays.com or instagram.com/..."
                      value={formData.websiteOrSocial}
                      onChange={e => handleInputChange('websiteOrSocial', e.target.value)}
                      className="rounded-xl h-11 bg-background text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-border/50">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Your details are kept strictly confidential</span>
                  </span>
                  <Button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 h-11 rounded-xl text-xs gap-1.5 shadow-md shadow-amber-500/20"
                  >
                    <span>Continue to Credentials</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: BUSINESS CREDENTIALS & LICENSES */}
        {currentStep === 2 && (
          <Card className="rounded-3xl border-border/70 bg-card shadow-xl overflow-hidden animate-fade-in">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleNextStep} className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Step 2: Business Credentials & Regulatory Compliance</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    In compliance with the J&K Tourist Trade Act, we verify business identity before unlocking live wholesale inventory.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      J&K Tourism Registration or State Tourism License Number (Optional if applying)
                    </label>
                    <Input
                      placeholder="e.g. JKT-TR-2026-8942"
                      value={formData.tourismLicenseNo}
                      onChange={e => handleInputChange('tourismLicenseNo', e.target.value)}
                      className="rounded-xl h-11 bg-background text-xs font-mono"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      If you do not possess a J&K license yet, you can operate under our provisional partner allotment for 30 days while your papers are processed.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">GSTIN Number (Optional)</label>
                    <Input
                      placeholder="e.g. 01AAAAA0000A1Z5"
                      value={formData.gstin}
                      onChange={e => handleInputChange('gstin', e.target.value)}
                      className="rounded-xl h-11 bg-background text-xs font-mono uppercase"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-2">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-primary" />
                      <span>Document Link / Digital Verification (Certificate or Letterhead)</span>
                    </label>
                    <Input
                      placeholder="Provide Google Drive / Dropbox link or leave blank for email follow-up"
                      value={formData.documentUrl}
                      onChange={e => handleInputChange('documentUrl', e.target.value)}
                      className="rounded-xl h-10 bg-background text-xs"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      You can also email your documents directly to verification@kashmircurators.com after submitting.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-border/50">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="rounded-xl h-11 text-xs"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 h-11 rounded-xl text-xs gap-1.5 shadow-md shadow-amber-500/20"
                  >
                    <span>Proceed to Plan Selection</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: PLAN SELECTION & FINAL SUBMISSION */}
        {currentStep === 3 && (
          <Card className="rounded-3xl border-border/70 bg-card shadow-xl overflow-hidden animate-fade-in">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Step 3: Select Your Operating Plan & Review Application</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  <strong>Zero Immediate Charge</strong>: Your card is NOT charged upon application. Verification review happens first.
                </p>
              </div>

              {/* Plan Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'STARTER',
                    name: 'Starter DMC',
                    price: '₹0',
                    sub: 'Free Verification',
                    margin: '5% Standard B2B Discount',
                    features: ['Wholesale room tariffs', 'Pay-as-you-go cabs', 'Standard quoting']
                  },
                  {
                    id: 'PROFESSIONAL',
                    name: 'Professional DMC',
                    price: '₹2,999/mo',
                    sub: 'Recommended',
                    margin: '10% Contract B2B Margin',
                    features: ['White-label PDF quotes', 'AI Sales Copilot', 'WhatsApp centralized inbox'],
                    highlight: true
                  },
                  {
                    id: 'ENTERPRISE',
                    name: 'Enterprise DMC',
                    price: '₹7,999/mo',
                    sub: 'High-Volume Operators',
                    margin: '15% VIP Tariff Discount',
                    features: ['Dedicated Srinagar desk', 'Custom sub-accounts', 'Priority snow clearance']
                  }
                ].map(plan => {
                  const isSelected = formData.selectedPlan === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => handleInputChange('selectedPlan', plan.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-amber-500 bg-amber-500/10 shadow-md ring-2 ring-amber-500/20' 
                          : 'border-border/60 bg-muted/20 hover:border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{plan.name}</span>
                        {plan.highlight && (
                          <Badge className="bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0">
                            Popular
                          </Badge>
                        )}
                      </div>
                      <p className="text-lg font-black text-foreground mt-2 font-mono">{plan.price}</p>
                      <p className="text-[10px] text-muted-foreground">{plan.sub}</p>
                      <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-2">{plan.margin}</p>
                      <ul className="text-[10px] text-muted-foreground mt-3 space-y-1">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              {/* Review Summary */}
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 text-xs space-y-2">
                <h4 className="font-bold text-foreground uppercase tracking-wider text-[10px]">Application Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <div>Agency: <strong className="text-foreground">{formData.agencyName}</strong></div>
                  <div>Person: <strong className="text-foreground">{formData.authorizedPerson}</strong></div>
                  <div>Email: <strong className="text-foreground">{formData.email}</strong></div>
                  <div>Phone: <strong className="text-foreground">{formData.phone}</strong></div>
                  <div>Location: <strong className="text-foreground">{formData.location}</strong></div>
                  <div>Selected Plan: <strong className="text-amber-500">{formData.selectedPlan}</strong></div>
                </div>
              </div>

              {/* Legal Checkbox */}
              <div className="flex items-start gap-2 pt-2 text-xs text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  By submitting, you agree to adhere to Kashmir Curators wholesale B2B confidentiality guidelines and official Jammu & Kashmir Tourist Trade regulatory standards.
                </span>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="rounded-xl h-11 text-xs"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmitApplication}
                  disabled={isSubmitting}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-8 h-12 rounded-xl text-sm gap-2 shadow-xl shadow-amber-500/25"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmitting ? 'Submitting Application...' : 'Submit B2B Application'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AgencyOnboardingPage;
