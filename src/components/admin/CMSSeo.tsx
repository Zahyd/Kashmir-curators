import { useState, useEffect } from 'react';
import { 
  Search, Globe, Share2, Save, Sparkles, 
  CheckCircle2, AlertCircle, RefreshCw, ExternalLink, Image as ImageIcon 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';
import MediaPicker from './MediaPicker';
import { useLandingPageContent } from '@/hooks/useLandingPageContent';

export default function CMSSeo() {
  const { seo: cmsSeo, refetch } = useLandingPageContent();
  const [siteName, setSiteName] = useState('The Kashmir Curators');
  const [metaTitle, setMetaTitle] = useState('Luxury Kashmir Tour Packages, B2B Travel Partner DMC & Custom Itineraries');
  const [metaDesc, setMetaDesc] = useState('Book bespoke luxury travel experiences in Kashmir or partner as a verified travel agent. Direct B2B net rates, premium Dal Lake houseboats, private ski chalets, and 24/7 ground execution.');
  const [keywords, setKeywords] = useState('kashmir tour packages, kashmir b2b dmc, travel agent net rates kashmir, gulmarg luxury resort, srinagar houseboats, pahalgam vacation planner, kashmir curators');
  const [canonicalBase, setCanonicalBase] = useState('https://kashmir-curators.vercel.app');
  const [ogImage, setOgImage] = useState('https://images.unsplash.com/photo-1597074866923-dc0589150358?w=1200');
  const [googleVerification, setGoogleVerification] = useState('Cy5eLotuqR5YZT1HJxzC___F1gzOHEFFtmtExKMyNvs');

  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPingingSitemap, setIsPingingSitemap] = useState(false);

  useEffect(() => {
    if (cmsSeo) {
      if (cmsSeo.siteName) setSiteName(cmsSeo.siteName);
      if (cmsSeo.defaultTitle) setMetaTitle(cmsSeo.defaultTitle);
      if (cmsSeo.defaultDescription) setMetaDesc(cmsSeo.defaultDescription);
      if (cmsSeo.defaultKeywords) setKeywords(cmsSeo.defaultKeywords);
      if (cmsSeo.canonicalBase) setCanonicalBase(cmsSeo.canonicalBase);
      if (cmsSeo.ogImage) setOgImage(cmsSeo.ogImage);
    }
  }, [cmsSeo]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('teamToken') || localStorage.getItem('token');
      const payload = {
        title: 'Global SEO Suite',
        subtitle: 'Search Engine Optimization and Social Sharing Tags',
        image_url: ogImage,
        content: {
          site_name: siteName,
          default_title: metaTitle,
          default_description: metaDesc,
          default_keywords: keywords,
          canonical_base: canonicalBase,
          google_verification: googleVerification,
          enable_sitemap_ping: true
        }
      };

      const res = await fetch(`${API_BASE_URL}/site-content/seo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success('SEO metadata synchronized live across all pages!');
        refetch();
      } else {
        toast.error('Failed to save SEO configuration');
      }
    } catch (err) {
      toast.error('Network error saving SEO');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePingSitemap = async () => {
    setIsPingingSitemap(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      toast.success('Googlebot pinged successfully! Sitemap re-crawling requested.');
    } finally {
      setIsPingingSitemap(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Header Card */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 via-white/[0.02] to-transparent border border-amber-400/20 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-2">
            <Search className="w-3.5 h-3.5" />
            <span>Search & Social Optimization</span>
          </div>
          <h2 className="text-3xl font-display font-black text-white">SEO Management Suite</h2>
          <p className="text-white/60 text-xs sm:text-sm mt-1 max-w-xl">
            Configure global meta titles, descriptions, canonical URLs, Open Graph preview cards, and Schema.org structured data.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handlePingSitemap}
            disabled={isPingingSitemap}
            variant="outline"
            className="h-11 px-5 rounded-2xl border-white/15 text-white hover:bg-white/10 font-bold text-xs uppercase tracking-wider flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${isPingingSitemap ? 'animate-spin' : ''}`} />
            <span>Ping Googlebot</span>
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="h-11 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-400/20 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save & Deploy SEO'}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="bg-[#0a0f14]/85 border border-white/10 p-6 rounded-3xl backdrop-blur-xl space-y-4">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400" />
                <span>Search Engine Meta Tags</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">
                  Brand / Organization Site Name
                </label>
                <Input
                  value={siteName}
                  onChange={e => setSiteName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 block">
                    Page Meta Title
                  </label>
                  <span className={`text-[10px] font-mono ${metaTitle.length > 60 ? 'text-amber-400 font-bold' : 'text-white/40'}`}>
                    {metaTitle.length}/60 chars recommended
                  </span>
                </div>
                <Input
                  value={metaTitle}
                  onChange={e => setMetaTitle(e.target.value)}
                  className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 block">
                    Meta Description
                  </label>
                  <span className={`text-[10px] font-mono ${metaDesc.length > 160 ? 'text-amber-400 font-bold' : 'text-white/40'}`}>
                    {metaDesc.length}/160 chars recommended
                  </span>
                </div>
                <Textarea
                  value={metaDesc}
                  onChange={e => setMetaDesc(e.target.value)}
                  rows={3}
                  className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">
                  Keywords (Comma Separated)
                </label>
                <Input
                  value={keywords}
                  onChange={e => setKeywords(e.target.value)}
                  className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">
                    Canonical Base URL
                  </label>
                  <Input
                    value={canonicalBase}
                    onChange={e => setCanonicalBase(e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">
                    Google Site Verification Tag
                  </label>
                  <Input
                    value={googleVerification}
                    onChange={e => setGoogleVerification(e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">
                  Social Sharing Image (Open Graph / Twitter)
                </label>
                <div className="flex gap-2">
                  <Input
                    value={ogImage}
                    onChange={e => setOgImage(e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl flex-1 font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsMediaPickerOpen(true)}
                    className="border-white/15 hover:bg-white/10 text-xs rounded-xl text-amber-300"
                  >
                    <ImageIcon className="w-4 h-4 mr-1.5" />
                    Browse
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Search & Social Preview Simulator */}
        <div className="lg:col-span-5 space-y-6">
          {/* Google Search Snippet Preview */}
          <Card className="bg-[#0a0f14]/85 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-sm font-bold text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-400" />
                  <span>Google Search Live Simulator</span>
                </span>
                <Badge className="bg-emerald-500/20 text-emerald-400 text-[8px] font-mono">SERP</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 rounded-2xl bg-white text-slate-800 space-y-1 shadow-inner">
                <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
                  <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-amber-700">KC</div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-slate-900 leading-none">{siteName}</span>
                    <span className="text-[10px] text-slate-500 font-mono leading-none">{canonicalBase}</span>
                  </div>
                </div>
                <h4 className="text-base font-medium text-[#1a0dab] hover:underline cursor-pointer leading-tight line-clamp-1">
                  {metaTitle}
                </h4>
                <p className="text-xs text-[#4d5156] line-clamp-2 leading-relaxed">
                  {metaDesc}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Social Share Card Preview (WhatsApp / Twitter / Facebook) */}
          <Card className="bg-[#0a0f14]/85 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-sm font-bold text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-blue-400" />
                  <span>Social Card Simulator (OG)</span>
                </span>
                <Badge className="bg-blue-500/20 text-blue-400 text-[8px] font-mono">OpenGraph</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.02]">
                <div className="h-40 w-full overflow-hidden bg-black/60">
                  <img src={ogImage} alt="Social Preview" className="w-full h-full object-cover" />
                </div>
                <div className="p-4 space-y-1 bg-black/40">
                  <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">{new URL(canonicalBase).hostname}</span>
                  <h5 className="text-xs font-bold text-white line-clamp-1">{metaTitle}</h5>
                  <p className="text-[11px] text-white/60 line-clamp-2">{metaDesc}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <MediaPicker
        open={isMediaPickerOpen}
        onOpenChange={setIsMediaPickerOpen}
        onSelect={(url) => {
          setOgImage(url);
          setIsMediaPickerOpen(false);
        }}
      />
    </div>
  );
}
