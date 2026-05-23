import { useState, useEffect } from 'react';
import { Save, Loader2, Image as ImageIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import MediaPicker from './MediaPicker';
import { API_BASE_URL } from '@/lib/api';

export default function CMSJourney() {
  const [heroTitle, setHeroTitle] = useState('Design Your Journey');
  const [heroSubtitle, setHeroSubtitle] = useState('BESPOKE TRAVEL CURATED FOR YOU');
  const [heroImage, setHeroImage] = useState('https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&q=80');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHeroData();
  }, []);

  const fetchHeroData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/site-content`);
      if (response.ok) {
        const data = await response.json();
        if (data.journeyHero) {
          setHeroTitle(data.journeyHero.title || 'Design Your Journey');
          setHeroSubtitle(data.journeyHero.subtitle || 'BESPOKE TRAVEL CURATED FOR YOU');
          setHeroImage(data.journeyHero.image_url || 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&q=80');
        }
      }
    } catch (error) {
      console.error('[CMSJourney] Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem('teamToken') || localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/site-content/journeyHero`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          section_key: 'journeyHero',
          title: heroTitle,
          subtitle: heroSubtitle,
          content: {},
          image_url: heroImage
        })
      });

      if (response.ok) {
        toast.success('Trip Planner settings updated successfully in real-time!');
      } else {
        throw new Error('Failed to save to server');
      }
    } catch (error: any) {
      console.error('[CMSJourney] Error saving settings:', error);
      toast.error('Failed to save hero settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-12 w-12 animate-spin text-kashmir-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-display font-bold text-white tracking-tight">Planner CMS</h2>
        <p className="text-white/40 text-sm mt-1 uppercase tracking-widest font-black">Configure the Interactive Trip Planner Experience</p>
      </div>

      <Card className="bg-white/[0.01] border-white/5 rounded-[2.5rem] p-8 backdrop-blur-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-kashmir-gold/[0.02] to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h3 className="text-xl font-display font-black text-white uppercase tracking-tight flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-kashmir-gold" />
              Planner Header Configuration
            </h3>
            <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1">Configure the main background asset and copy of the planner header</p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full md:w-auto bg-white text-black hover:bg-kashmir-gold hover:text-black font-black px-6 h-12 rounded-xl transition-all duration-300 shadow-lg active:scale-95 flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span className="text-[9px] uppercase tracking-widest">{saving ? 'Saving...' : 'Save Configuration'}</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 block">Hero Background Image</label>
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                <MediaPicker
                  value={heroImage}
                  onChange={(url) => setHeroImage(url)}
                />
                {heroImage && (
                  <div className="mt-4 relative aspect-[21/9] rounded-xl overflow-hidden border border-white/10">
                    <img src={heroImage} alt="Hero Background Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 block">Card Headline</label>
              <Input
                className="bg-white/5 border-white/10 rounded-xl h-12 text-white placeholder-white/20 focus:border-kashmir-gold/50 transition-all font-bold"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                placeholder="e.g., Design Your Journey"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 block">Card Subheadline</label>
              <Textarea
                className="bg-white/5 border-white/10 rounded-xl min-h-[96px] text-white placeholder-white/20 focus:border-kashmir-gold/50 transition-all resize-none font-medium leading-relaxed"
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                placeholder="e.g., BESPOKE TRAVEL CURATED FOR YOU"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
