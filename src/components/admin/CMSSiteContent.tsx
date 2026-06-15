import { useState, useEffect } from 'react';
import { Save, Loader2, Plane, Compass, Coffee, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import MediaPicker from './MediaPicker';
import { API_BASE_URL } from '@/lib/api';

interface SiteContent {
  id?: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  content: Record<string, unknown>;
  image_url: string | null;
}

const defaultContent: Record<string, Partial<SiteContent>> = {
  hero: {
    section_key: 'hero',
    title: 'BEYOND the ORDINARY',
    subtitle: 'Experience Kashmir as it was meant to be seen: Private, Peerless, and Profoundly Beautiful.',
    content: {
      stat1_label: 'Elite Curations',
      stat1_value: '1,200+',
      stat2_label: 'Satisfaction Index',
      stat2_value: '4.95',
      stat3_label: 'Concierge Protocol',
      stat3_value: '24/7',
    },
    image_url: '',
  },
  about: {
    section_key: 'about',
    title: 'The Kashmir Curators Difference',
    subtitle: 'Uncompromising Luxury and Authentic Experiences',
    content: {
      description: 'We are a premier luxury travel atelier specializing in bespoke Kashmir tourism, delivering unparalleled private experiences.',
    },
    image_url: '',
  },
  signatureItinerary: {
    section_key: 'signatureItinerary',
    title: 'THE SIGNATURE ITINERARY',
    subtitle: 'Day-by-day blueprint of our flagship 6-day Kashmir expedition.',
    content: {
      days: []
    },
    image_url: '',
  }
};

export default function CMSSiteContent() {
  const [content, setContent] = useState<Record<string, SiteContent>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/site-content`);
      if (response.ok) {
        const data = await response.json();
        setContent({
          ...defaultContent,
          ...data
        } as Record<string, SiteContent>);
      } else {
        setContent(defaultContent as Record<string, SiteContent>);
      }
    } catch (e) {
      toast.error('Failed to load content');
      setContent(defaultContent as Record<string, SiteContent>);
    }
    setLoading(false);
  };

  const updateField = (sectionKey: string, field: string, value: string) => {
    setContent((prev) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [field]: value,
      },
    }));
  };

  const updateContentField = (sectionKey: string, field: string, value: string) => {
    setContent((prev) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        content: {
          ...(prev[sectionKey]?.content || {}),
          [field]: value,
        },
      },
    }));
  };

  const saveSection = async (sectionKey: string) => {
    setSaving(sectionKey);
    const sectionData = content[sectionKey];

    try {
      const token = localStorage.getItem('teamToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/site-content/${sectionKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(sectionData)
      });

      if (!response.ok) {
        throw new Error('Failed to save to server');
      }

      toast.success('Content saved successfully in real-time!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to save content to the server');
    }

    setSaving(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const heroContent = content.hero;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Site Content</h2>

      {/* Hero Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hero Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Headline</label>
            <Input
              value={heroContent?.title || ''}
              onChange={(e) => updateField('hero', 'title', e.target.value)}
              placeholder="Main headline"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Subheadline</label>
            <Textarea
              value={heroContent?.subtitle || ''}
              onChange={(e) => updateField('hero', 'subtitle', e.target.value)}
              placeholder="Supporting text"
              rows={2}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Background Image</label>
            <MediaPicker
              value={heroContent?.image_url || ''}
              onChange={(url) => updateField('hero', 'image_url', url)}
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Statistics</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Input
                  value={(heroContent?.content as Record<string, string>)?.stat1_label || ''}
                  onChange={(e) => updateContentField('hero', 'stat1_label', e.target.value)}
                  placeholder="Label 1"
                />
                <Input
                  value={(heroContent?.content as Record<string, string>)?.stat1_value || ''}
                  onChange={(e) => updateContentField('hero', 'stat1_value', e.target.value)}
                  placeholder="Value 1"
                />
              </div>
              <div className="space-y-2">
                <Input
                  value={(heroContent?.content as Record<string, string>)?.stat2_label || ''}
                  onChange={(e) => updateContentField('hero', 'stat2_label', e.target.value)}
                  placeholder="Label 2"
                />
                <Input
                  value={(heroContent?.content as Record<string, string>)?.stat2_value || ''}
                  onChange={(e) => updateContentField('hero', 'stat2_value', e.target.value)}
                  placeholder="Value 2"
                />
              </div>
              <div className="space-y-2">
                <Input
                  value={(heroContent?.content as Record<string, string>)?.stat3_label || ''}
                  onChange={(e) => updateContentField('hero', 'stat3_label', e.target.value)}
                  placeholder="Label 3"
                />
                <Input
                  value={(heroContent?.content as Record<string, string>)?.stat3_value || ''}
                  onChange={(e) => updateContentField('hero', 'stat3_value', e.target.value)}
                  placeholder="Value 3"
                />
              </div>
            </div>
          </div>

          <Button onClick={() => saveSection('hero')} disabled={saving === 'hero'}>
            {saving === 'hero' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Hero Section
          </Button>
        </CardContent>
      </Card>

      {/* About Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Title</label>
            <Input
              value={content.about?.title || ''}
              onChange={(e) => updateField('about', 'title', e.target.value)}
              placeholder="About title"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Subtitle</label>
            <Input
              value={content.about?.subtitle || ''}
              onChange={(e) => updateField('about', 'subtitle', e.target.value)}
              placeholder="About subtitle"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <Textarea
              value={(content.about?.content as Record<string, string>)?.description || ''}
              onChange={(e) => updateContentField('about', 'description', e.target.value)}
              placeholder="About description"
              rows={4}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Image</label>
            <MediaPicker
              value={content.about?.image_url || ''}
              onChange={(url) => updateField('about', 'image_url', url)}
            />
          </div>

          <Button onClick={() => saveSection('about')} disabled={saving === 'about'}>
            {saving === 'about' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save About Section
          </Button>
        </CardContent>
      </Card>

      {/* Social Media Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Brand Social Footprint</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Facebook URL</label>
            <Input
              value={(content.socialMedia?.content as Record<string, string>)?.facebook || ''}
              onChange={(e) => updateContentField('socialMedia', 'facebook', e.target.value)}
              placeholder="https://facebook.com/kashmircurators"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Instagram URL</label>
            <Input
              value={(content.socialMedia?.content as Record<string, string>)?.instagram || ''}
              onChange={(e) => updateContentField('socialMedia', 'instagram', e.target.value)}
              placeholder="https://instagram.com/kashmircurators"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Twitter (X) URL</label>
            <Input
              value={(content.socialMedia?.content as Record<string, string>)?.twitter || ''}
              onChange={(e) => updateContentField('socialMedia', 'twitter', e.target.value)}
              placeholder="https://twitter.com/kashmircurators"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">YouTube URL</label>
            <Input
              value={(content.socialMedia?.content as Record<string, string>)?.youtube || ''}
              onChange={(e) => updateContentField('socialMedia', 'youtube', e.target.value)}
              placeholder="https://youtube.com/@kashmircurators"
            />
          </div>

          <Button onClick={() => saveSection('socialMedia')} disabled={saving === 'socialMedia'}>
            {saving === 'socialMedia' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Social Links
          </Button>
        </CardContent>
      </Card>

      {/* Signature Itinerary Section */}
      <Card className="bg-[#0a0f12]/40 bg-white/[0.01] border-white/5 rounded-[2.5rem] p-8 backdrop-blur-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-kashmir-gold/[0.02] to-transparent pointer-events-none" />
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6">
          <div>
            <CardTitle className="text-xl font-display font-black text-white uppercase tracking-tight">Signature Itinerary Configuration</CardTitle>
            <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1">Manage the flagship 6-day kashmir tour experience route</p>
          </div>
          <Button 
            onClick={() => saveSection('signatureItinerary')} 
            disabled={saving === 'signatureItinerary'}
            className="w-full md:w-auto bg-white text-black hover:bg-kashmir-gold hover:text-black font-black px-6 h-12 rounded-xl transition-all duration-300 shadow-lg"
          >
            {saving === 'signatureItinerary' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Itinerary
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 block">Itinerary Section Title</label>
              <Input
                value={content.signatureItinerary?.title || ''}
                onChange={(e) => updateField('signatureItinerary', 'title', e.target.value)}
                placeholder="Section main headline"
                className="bg-white/5 border-white/10 rounded-xl h-12 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 block">Itinerary Section Subtitle</label>
              <Input
                value={content.signatureItinerary?.subtitle || ''}
                onChange={(e) => updateField('signatureItinerary', 'subtitle', e.target.value)}
                placeholder="Section supporting description"
                className="bg-white/5 border-white/10 rounded-xl h-12 text-white"
              />
            </div>
          </div>

          {/* Days Accordion/Editor */}
          <div className="border-t border-white/5 pt-6 space-y-6">
            <h4 className="text-sm font-black uppercase tracking-widest text-white/40 mb-4">Day-by-Day Blueprints</h4>
            
            {Array.from({ length: 6 }).map((_, idx) => {
              const dayNum = idx + 1;
              const daysList = (content.signatureItinerary?.content?.days as any[]) || [];
              const dayData = daysList.find(d => d.day === dayNum) || {
                day: dayNum,
                title: '',
                subtitle: '',
                route: '',
                duration: '',
                image: '',
                description: '',
                highlights: [],
                inclusions: [
                  { icon: 'plane', label: '' },
                  { icon: 'compass', label: '' },
                  { icon: 'coffee', label: '' }
                ]
              };

              const updateDayField = (field: string, val: any) => {
                const newDays = [...daysList];
                const dayIndex = newDays.findIndex(d => d.day === dayNum);
                const updatedDay = { ...dayData, [field]: val };
                if (dayIndex >= 0) {
                  newDays[dayIndex] = updatedDay;
                } else {
                  newDays.push(updatedDay);
                }
                newDays.sort((a, b) => a.day - b.day);
                
                setContent((prev) => ({
                  ...prev,
                  signatureItinerary: {
                    ...prev.signatureItinerary,
                    content: {
                      ...(prev.signatureItinerary?.content || {}),
                      days: newDays
                    }
                  }
                }));
              };

              return (
                <div key={dayNum} className="p-6 rounded-3xl bg-white/[0.01] border border-white/5 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-kashmir-gold text-black flex items-center justify-center font-display font-black text-sm">
                      D0{dayNum}
                    </div>
                    <h5 className="font-bold text-white uppercase text-xs tracking-wider">Day {dayNum} Parameters</h5>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 block">Day Title</label>
                      <Input
                        value={dayData.title || ''}
                        onChange={(e) => updateDayField('title', e.target.value)}
                        placeholder="e.g. Srinagar Arrival"
                        className="bg-white/5 border-white/10 rounded-xl h-11 text-white text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 block">Day Subtitle</label>
                      <Input
                        value={dayData.subtitle || ''}
                        onChange={(e) => updateDayField('subtitle', e.target.value)}
                        placeholder="e.g. VALLEY ENTRY PROTOCOL"
                        className="bg-white/5 border-white/10 rounded-xl h-11 text-white text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 block">Route Waypoints</label>
                      <Input
                        value={dayData.route || ''}
                        onChange={(e) => updateDayField('route', e.target.value)}
                        placeholder="e.g. Airport ➔ Houseboat"
                        className="bg-white/5 border-white/10 rounded-xl h-11 text-white text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 block">Distance / Duration</label>
                      <Input
                        value={dayData.duration || ''}
                        onChange={(e) => updateDayField('duration', e.target.value)}
                        placeholder="e.g. 15 km | 40 mins"
                        className="bg-white/5 border-white/10 rounded-xl h-11 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 block">Display Image</label>
                      <MediaPicker
                        value={dayData.image || ''}
                        onChange={(url) => updateDayField('image', url)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 block">Day Description</label>
                      <Textarea
                        value={dayData.description || ''}
                        onChange={(e) => updateDayField('description', e.target.value)}
                        placeholder="Detail the day activities..."
                        className="bg-white/5 border-white/10 rounded-xl min-h-[96px] text-white text-xs resize-none"
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 block">Highlights (one per line)</label>
                      <Textarea
                        value={(dayData.highlights || []).join('\n')}
                        onChange={(e) => updateDayField('highlights', e.target.value.split('\n').filter(Boolean))}
                        placeholder="Private Sunset Shikara Cruise&#10;Kahwa welcome service"
                        className="bg-white/5 border-white/10 rounded-xl min-h-[96px] text-white text-xs resize-none"
                        rows={4}
                      />
                    </div>
                  </div>

                  {/* Inclusions Row */}
                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 block">Day Inclusions</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Array.from({ length: 3 }).map((_, incIdx) => {
                        const inclusion = (dayData.inclusions || [])[incIdx] || { icon: 'plane', label: '' };
                        const updateInclusion = (key: string, val: string) => {
                          const newInclusions = [...(dayData.inclusions || [])];
                          newInclusions[incIdx] = { ...inclusion, [key]: val };
                          updateDayField('inclusions', newInclusions);
                        };

                        return (
                          <div key={incIdx} className="flex gap-2 bg-white/5 border border-white/5 p-3 rounded-2xl">
                            <select
                              value={inclusion.icon || 'plane'}
                              onChange={(e) => updateInclusion('icon', e.target.value)}
                              className="bg-[#0a0f12] border border-white/10 text-white rounded-xl text-xs px-2 py-1 focus:outline-none"
                            >
                              <option value="plane">Plane</option>
                              <option value="compass">Compass</option>
                              <option value="coffee">Coffee</option>
                              <option value="clock">Clock</option>
                              <option value="checkCircle">Check</option>
                            </select>
                            <Input
                              value={inclusion.label || ''}
                              onChange={(e) => updateInclusion('label', e.target.value)}
                              placeholder="Inclusion label"
                              className="bg-white/5 border-white/10 rounded-xl h-8 text-white text-xs flex-1"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
