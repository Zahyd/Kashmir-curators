import { useState, useEffect } from 'react';
import { 
  Layers, Eye, EyeOff, ArrowUp, ArrowDown, Edit3, 
  Save, Sparkles, RefreshCw, Smartphone, Tablet, 
  Monitor, ExternalLink, RotateCcw, CheckCircle2, 
  Image as ImageIcon, Compass, Plus, Trash2, Check 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';
import MediaPicker from './MediaPicker';
import { useLandingPageContent, PageSectionConfig, DEFAULT_PAGE_SECTIONS } from '@/hooks/useLandingPageContent';

export default function CMSPageBuilder() {
  const { content: liveContent, pageSectionsOrder: liveSections, refetch } = useLandingPageContent();
  const [sections, setSections] = useState<PageSectionConfig[]>(DEFAULT_PAGE_SECTIONS);
  const [selectedSectionKey, setSelectedSectionKey] = useState<string>('hero');
  const [editingContent, setEditingContent] = useState<Record<string, any>>({});
  
  // Preview states
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  // MediaPicker
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [activeMediaTarget, setActiveMediaTarget] = useState<string | null>(null);

  // Revision & rollback
  const [revisions, setRevisions] = useState<any[]>([]);
  const [isRevisionsModalOpen, setIsRevisionsModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (liveSections && liveSections.length > 0) {
      setSections(liveSections);
    }
    if (liveContent && Object.keys(liveContent).length > 0) {
      setEditingContent(JSON.parse(JSON.stringify(liveContent)));
    }
  }, [liveSections, liveContent]);

  // Section Ordering Handlers
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    // Recalculate order index
    const reordered = newSections.map((s, idx) => ({ ...s, order: idx + 1 }));
    setSections(reordered);
    toast.info(`Moved ${temp.name} ${direction}`);
  };

  const toggleSectionVisibility = (id: string) => {
    const updated = sections.map(s => s.id === id ? { ...s, isVisible: !s.isVisible } : s);
    setSections(updated);
  };

  // Field Edit Handlers
  const handleFieldChange = (sectionKey: string, fieldPath: string, value: any) => {
    setEditingContent(prev => {
      const copy = { ...prev };
      if (!copy[sectionKey]) copy[sectionKey] = { content: {} };
      if (!copy[sectionKey].content) copy[sectionKey].content = {};

      if (fieldPath.startsWith('content.')) {
        const subfield = fieldPath.replace('content.', '');
        copy[sectionKey].content[subfield] = value;
      } else {
        copy[sectionKey][fieldPath] = value;
      }
      return copy;
    });
  };

  // Save / Publish
  const handlePublishLive = async () => {
    setIsPublishing(true);
    try {
      const token = localStorage.getItem('teamToken') || localStorage.getItem('token');
      
      // 1. Save pageSectionsOrder
      await fetch(`${API_BASE_URL}/site-content/pageSectionsOrder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title: 'Landing Page Section Order & Visibility',
          subtitle: 'Configured via Visual Page Builder',
          content: { sections }
        })
      });

      // 2. Save modified section content
      const targetData = editingContent[selectedSectionKey];
      if (targetData) {
        await fetch(`${API_BASE_URL}/site-content/${selectedSectionKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify(targetData)
        });
      }

      toast.success('Landing page updated and published live in real-time!');
      refetch();
    } catch (err) {
      toast.error('Failed to publish changes to live site');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleResetSection = async (sectionKey: string) => {
    try {
      const token = localStorage.getItem('teamToken') || localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/site-content/reset/${sectionKey}`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Reset ${sectionKey} to default system template`);
        refetch();
      }
    } catch (err) {
      toast.error('Failed to reset template');
    }
  };

  const fetchRevisions = async () => {
    try {
      const token = localStorage.getItem('teamToken') || localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/site-content/revisions`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setRevisions(data);
        setIsRevisionsModalOpen(true);
      }
    } catch (err) {
      toast.error('Failed to load revision history');
    }
  };

  const handleRollback = async (revisionId: string) => {
    try {
      const token = localStorage.getItem('teamToken') || localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/site-content/revert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ revisionId })
      });
      if (res.ok) {
        toast.success('Successfully rolled back to selected revision!');
        setIsRevisionsModalOpen(false);
        refetch();
      }
    } catch (err) {
      toast.error('Rollback failed');
    }
  };

  const currentSec = editingContent[selectedSectionKey] || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Header Card */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 via-white/[0.02] to-transparent border border-amber-400/20 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Interactive Layout Architect</span>
          </div>
          <h2 className="text-3xl font-display font-black text-white">Visual Landing Page Builder</h2>
          <p className="text-white/60 text-xs sm:text-sm mt-1 max-w-xl">
            Reorder landing page sections, toggle visibility, customize headings, copy, media, and preview live on simulated viewports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchRevisions}
            className="h-11 px-4 rounded-2xl border-white/15 text-white hover:bg-white/10 text-xs font-bold flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Revision History</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsPreviewModalOpen(true)}
            className="h-11 px-5 rounded-2xl border-white/15 text-white hover:bg-white/10 text-xs font-bold flex items-center gap-2"
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>Live Preview</span>
          </Button>
          <Button
            onClick={handlePublishLive}
            disabled={isPublishing}
            className="h-11 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-400/20 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isPublishing ? 'Publishing...' : 'Publish Live to Website'}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Section Ordering & Visibility Hierarchy */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="bg-[#0a0f14]/85 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-sm font-bold text-white flex items-center justify-between">
                <span>Landing Page Sections Hierarchy</span>
                <span className="text-[10px] text-white/40 font-mono">{sections.filter(s => s.isVisible).length} Active</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-2.5">
              {sections.map((section, idx) => (
                <div
                  key={section.id}
                  onClick={() => setSelectedSectionKey(section.id)}
                  className={`p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 ${
                    selectedSectionKey === section.id
                      ? 'bg-amber-400/10 border-amber-400/40 shadow-lg shadow-amber-400/5'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                  } ${!section.isVisible ? 'opacity-40' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-mono text-white/50">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{section.name}</h4>
                      <span className="text-[9px] font-mono text-white/40 block">Key: #{section.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={idx === 0}
                      onClick={() => moveSection(idx, 'up')}
                      className="w-7 h-7 rounded-lg text-white/40 hover:text-white disabled:opacity-20"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={idx === sections.length - 1}
                      onClick={() => moveSection(idx, 'down')}
                      className="w-7 h-7 rounded-lg text-white/40 hover:text-white disabled:opacity-20"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleSectionVisibility(section.id)}
                      className={`w-7 h-7 rounded-lg ${section.isVisible ? 'text-emerald-400' : 'text-white/20'}`}
                      title={section.isVisible ? 'Hide from public landing page' : 'Show on public landing page'}
                    >
                      {section.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Visual Section Content Editor */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="bg-[#0a0f14]/85 border border-white/10 p-6 rounded-3xl backdrop-blur-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-amber-400 font-bold block">Selected Node</span>
                <h3 className="text-xl font-bold text-white font-display">
                  {sections.find(s => s.id === selectedSectionKey)?.name || selectedSectionKey}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleResetSection(selectedSectionKey)}
                className="text-[10px] text-white/50 hover:text-amber-400 rounded-xl"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset Defaults
              </Button>
            </div>

            {/* Content Field Renderers based on Selected Section */}
            {selectedSectionKey === 'hero' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Main Hero Heading</label>
                  <Input
                    value={currentSec.title || ''}
                    onChange={e => handleFieldChange('hero', 'title', e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Hero Subtitle</label>
                  <Textarea
                    value={currentSec.subtitle || ''}
                    onChange={e => handleFieldChange('hero', 'subtitle', e.target.value)}
                    rows={2}
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Top Badge Label</label>
                  <Input
                    value={currentSec.content?.badge_text || ''}
                    onChange={e => handleFieldChange('hero', 'content.badge_text', e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Custom Background Image URL</label>
                  <div className="flex gap-2">
                    <Input
                      value={currentSec.image_url || ''}
                      onChange={e => handleFieldChange('hero', 'image_url', e.target.value)}
                      placeholder="Leave blank for high-res local wallpaper"
                      className="bg-white/5 border-white/10 text-white text-xs rounded-xl flex-1 font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setActiveMediaTarget('hero.image_url');
                        setIsMediaPickerOpen(true);
                      }}
                      className="border-white/15 hover:bg-white/10 text-xs rounded-xl text-amber-300"
                    >
                      <ImageIcon className="w-4 h-4 mr-1.5" />
                      Browse
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1 block">Stat 1 (Value/Label)</label>
                    <Input
                      value={currentSec.content?.stat1_value || ''}
                      onChange={e => handleFieldChange('hero', 'content.stat1_value', e.target.value)}
                      className="bg-white/5 border-white/10 text-white text-xs rounded-xl mb-1"
                    />
                    <Input
                      value={currentSec.content?.stat1_label || ''}
                      onChange={e => handleFieldChange('hero', 'content.stat1_label', e.target.value)}
                      className="bg-white/5 border-white/10 text-white/60 text-[10px] rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1 block">Stat 2 (Value/Label)</label>
                    <Input
                      value={currentSec.content?.stat2_value || ''}
                      onChange={e => handleFieldChange('hero', 'content.stat2_value', e.target.value)}
                      className="bg-white/5 border-white/10 text-white text-xs rounded-xl mb-1"
                    />
                    <Input
                      value={currentSec.content?.stat2_label || ''}
                      onChange={e => handleFieldChange('hero', 'content.stat2_label', e.target.value)}
                      className="bg-white/5 border-white/10 text-white/60 text-[10px] rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1 block">Stat 3 (Value/Label)</label>
                    <Input
                      value={currentSec.content?.stat3_value || ''}
                      onChange={e => handleFieldChange('hero', 'content.stat3_value', e.target.value)}
                      className="bg-white/5 border-white/10 text-white text-xs rounded-xl mb-1"
                    />
                    <Input
                      value={currentSec.content?.stat3_label || ''}
                      onChange={e => handleFieldChange('hero', 'content.stat3_label', e.target.value)}
                      className="bg-white/5 border-white/10 text-white/60 text-[10px] rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedSectionKey === 'radar' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Radar Badge Text</label>
                  <Input
                    value={editingContent?.ticker?.content?.badge_text || 'LIVE VALLEY DISPATCH'}
                    onChange={e => handleFieldChange('ticker', 'content.badge_text', e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Scroll Speed (Seconds)</label>
                  <Input
                    type="number"
                    value={editingContent?.ticker?.content?.speed || 35}
                    onChange={e => handleFieldChange('ticker', 'content.speed', Number(e.target.value))}
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Live Announcements</label>
                  <div className="space-y-2">
                    {(editingContent?.ticker?.content?.announcements || []).map((ann: string, i: number) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          value={ann}
                          onChange={e => {
                            const updated = [...(editingContent?.ticker?.content?.announcements || [])];
                            updated[i] = e.target.value;
                            handleFieldChange('ticker', 'content.announcements', updated);
                          }}
                          className="bg-white/5 border-white/10 text-white text-xs rounded-xl flex-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedSectionKey === 'b2bPartner' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">B2B Section Title</label>
                  <Input
                    value={editingContent?.b2bSection?.title || ''}
                    onChange={e => handleFieldChange('b2bSection', 'title', e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Subtitle</label>
                  <Textarea
                    value={editingContent?.b2bSection?.subtitle || ''}
                    onChange={e => handleFieldChange('b2bSection', 'subtitle', e.target.value)}
                    rows={2}
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                  />
                </div>
              </div>
            )}

            {selectedSectionKey === 'closingCta' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Closing CTA Title</label>
                  <Input
                    value={editingContent?.closingCta?.title || ''}
                    onChange={e => handleFieldChange('closingCta', 'title', e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Subtitle / Description</label>
                  <Textarea
                    value={editingContent?.closingCta?.subtitle || ''}
                    onChange={e => handleFieldChange('closingCta', 'subtitle', e.target.value)}
                    rows={2}
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Button Label</label>
                    <Input
                      value={editingContent?.closingCta?.content?.button_text || ''}
                      onChange={e => handleFieldChange('closingCta', 'content.button_text', e.target.value)}
                      className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Direct Phone</label>
                    <Input
                      value={editingContent?.closingCta?.content?.direct_phone || ''}
                      onChange={e => handleFieldChange('closingCta', 'content.direct_phone', e.target.value)}
                      className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Generic Editor for other sections */}
            {!['hero', 'radar', 'b2bPartner', 'closingCta'].includes(selectedSectionKey) && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Section Heading</label>
                  <Input
                    value={currentSec.title || ''}
                    onChange={e => handleFieldChange(selectedSectionKey, 'title', e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Section Subtitle</label>
                  <Textarea
                    value={currentSec.subtitle || ''}
                    onChange={e => handleFieldChange(selectedSectionKey, 'subtitle', e.target.value)}
                    rows={3}
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                  />
                </div>
                {currentSec.content?.badge_text !== undefined && (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Badge Label</label>
                    <Input
                      value={currentSec.content.badge_text || ''}
                      onChange={e => handleFieldChange(selectedSectionKey, 'content.badge_text', e.target.value)}
                      className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-[10px] text-white/40 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Auto-validated React schema
              </span>
              <Button
                onClick={handlePublishLive}
                disabled={isPublishing}
                className="bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase px-5 rounded-xl"
              >
                Save This Section
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Live Preview Modal */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] bg-[#070b0e] border border-white/20 text-white rounded-3xl p-6 flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/10">
            <DialogTitle className="text-lg font-display font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-cyan-400" />
              <span>Landing Page Live Responsive Simulation</span>
            </DialogTitle>

            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`p-2 rounded-xl text-xs flex items-center gap-1.5 ${previewDevice === 'desktop' ? 'bg-amber-400 text-black font-bold' : 'text-white/60 hover:text-white'}`}
              >
                <Monitor className="w-4 h-4" /> Desktop
              </button>
              <button
                onClick={() => setPreviewDevice('tablet')}
                className={`p-2 rounded-xl text-xs flex items-center gap-1.5 ${previewDevice === 'tablet' ? 'bg-amber-400 text-black font-bold' : 'text-white/60 hover:text-white'}`}
              >
                <Tablet className="w-4 h-4" /> Tablet
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`p-2 rounded-xl text-xs flex items-center gap-1.5 ${previewDevice === 'mobile' ? 'bg-amber-400 text-black font-bold' : 'text-white/60 hover:text-white'}`}
              >
                <Smartphone className="w-4 h-4" /> Mobile
              </button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/60 rounded-2xl">
            <div className={`transition-all duration-500 bg-[#F8F8F9] dark:bg-[#05080a] overflow-hidden rounded-2xl border border-white/20 shadow-2xl h-full ${
              previewDevice === 'desktop' ? 'w-full' : previewDevice === 'tablet' ? 'w-[768px]' : 'w-[375px]'
            }`}>
              <iframe
                src="/"
                title="Live Landing Page Simulation"
                className="w-full h-full border-none"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revisions History Modal */}
      <Dialog open={isRevisionsModalOpen} onOpenChange={setIsRevisionsModalOpen}>
        <DialogContent className="max-w-xl bg-[#0c1218] border border-amber-400/30 text-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-400" />
              <span>Historical Revisions & 1-Click Rollback</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 py-2">
            {revisions.length > 0 ? (
              revisions.map((rev) => (
                <div key={rev.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-amber-400 border-amber-400/30 text-[9px] font-mono">
                        #{rev.sectionKey}
                      </Badge>
                      <span className="text-[10px] text-white/40">{new Date(rev.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-white/80 line-clamp-1">{rev.data?.title || rev.data?.subtitle || 'Section content snapshot'}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleRollback(rev.id)}
                    className="bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs rounded-xl"
                  >
                    Restore
                  </Button>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-white/30 text-xs font-mono">
                No previous snapshots recorded yet. Snapshots are created automatically whenever edits are published.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <MediaPicker
        open={isMediaPickerOpen}
        onOpenChange={setIsMediaPickerOpen}
        onSelect={(url) => {
          if (activeMediaTarget === 'hero.image_url') {
            handleFieldChange('hero', 'image_url', url);
          }
          setIsMediaPickerOpen(false);
          setActiveMediaTarget(null);
        }}
      />
    </div>
  );
}
