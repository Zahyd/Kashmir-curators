import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import MediaPicker from './MediaPicker';

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
    title: 'Discover the Magic of Kashmir',
    subtitle: 'Experience breathtaking landscapes, rich culture, and warm hospitality in paradise on Earth',
    content: {
      stat1_label: 'Happy Travelers',
      stat1_value: '15,000+',
      stat2_label: 'Tour Packages',
      stat2_value: '50+',
      stat3_label: 'Average Rating',
      stat3_value: '4.9',
    },
    image_url: '',
  },
  about: {
    section_key: 'about',
    title: 'About Kashmir Alle',
    subtitle: 'Your trusted travel partner for Kashmir adventures',
    content: {
      description: 'We are a premier travel company specializing in Kashmir tourism...',
    },
    image_url: '',
  },
};

export default function CMSSiteContent() {
  const [content, setContent] = useState<Record<string, SiteContent>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    // Mock fetch for UI demonstration
    try {
      const mockContent = localStorage.getItem('mock_site_content');
      if (mockContent) {
        const parsed = JSON.parse(mockContent);
        // Merge with defaults
        const merged = { ...defaultContent };
        Object.keys(parsed).forEach(key => {
          if (merged[key]) {
             merged[key] = { ...merged[key], ...parsed[key] };
          } else {
             merged[key] = parsed[key];
          }
        });
        setContent(merged as Record<string, SiteContent>);
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

    // Mock save delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const currentStored = JSON.parse(localStorage.getItem('mock_site_content') || '{}');
      currentStored[sectionKey] = sectionData;
      localStorage.setItem('mock_site_content', JSON.stringify(currentStored));
      toast.success('Content saved successfully!');
    } catch (e) {
      toast.error('Failed to save content locally');
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
    </div>
  );
}
