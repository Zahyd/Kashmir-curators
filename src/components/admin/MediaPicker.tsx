import { useState, useEffect, useRef } from 'react';
import { Upload, Image as ImageIcon, X, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';
import { removeDarkBackground, isImageDarkBackground } from '@/lib/imageTransparency';

interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  url: string;
}

interface MediaPickerProps {
  value: string;
  onChange: (url: string) => void;
}

export default function MediaPicker({ value, onChange }: MediaPickerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUrlError(false);
  }, [urlInput]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/media`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMedia(data || []);
      }
    } catch (error) {
      console.error('[MediaPicker] Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const token = localStorage.getItem('teamToken');
      let fileToUpload = file;

      // Automatically inspect if image has dark/black background
      try {
        const isDark = await isImageDarkBackground(file);
        if (isDark) {
          toast.loading('Black background detected. Auto-converting to transparent PNG cutout...', { id: 'bg-remove' });
          const processed = await removeDarkBackground(file);
          fileToUpload = processed.file;
          toast.success('Converted to transparent PNG cutout!', { id: 'bg-remove' });
        }
      } catch (err) {
        console.warn('[MediaPicker] Auto-transparency skipped:', err);
      }

      const formData = new FormData();
      formData.append('file', fileToUpload);

      console.log(`[MediaPicker] Uploading ${fileToUpload.name} to backend...`);
      const response = await fetch(`${API_BASE_URL}/media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const uploadedMedia = await response.json();
      console.log('[MediaPicker] Upload successful:', uploadedMedia);
      
      onChange(uploadedMedia.url);
      setDialogOpen(false);
      toast.success('Asset uploaded successfully');
    } catch (error: any) {
      console.error('[MediaPicker] Upload error:', error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleMakeTransparent = async () => {
    if (!value) return;
    setConverting(true);
    toast.loading('Analyzing & converting to transparent PNG...', { id: 'trans-convert' });
    try {
      const token = localStorage.getItem('teamToken');

      // If it's a Cloudinary URL, we can directly apply transparent PNG transformation
      if (value.includes('cloudinary.com') && value.includes('/upload/')) {
        let transformed = value;
        if (!transformed.includes('e_make_transparent')) {
          transformed = transformed.replace('/upload/', '/upload/e_make_transparent:20,f_png/');
        }
        if (transformed.endsWith('.jpg') || transformed.endsWith('.jpeg')) {
          transformed = transformed.replace(/\.(jpg|jpeg)$/, '.png');
        }
        onChange(transformed);
        toast.success('Applied clean transparent PNG transformation!', { id: 'trans-convert' });
        return;
      }

      // Otherwise, run client canvas flood-fill
      const processed = await removeDarkBackground(value);
      const formData = new FormData();
      formData.append('file', processed.file);

      const response = await fetch(`${API_BASE_URL}/media/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const uploaded = await response.json();
        onChange(uploaded.url);
        toast.success('Converted to transparent PNG!', { id: 'trans-convert' });
      } else {
        throw new Error('Upload failed');
      }
    } catch (err: any) {
      console.error('Transparency conversion error:', err);
      if (value.includes('cloudinary.com') && value.includes('/upload/')) {
        let transformed = value.replace('/upload/', '/upload/e_make_transparent:20,f_png/');
        transformed = transformed.replace(/\.(jpg|jpeg)$/, '.png');
        onChange(transformed);
        toast.success('Applied clean transparent PNG transformation!', { id: 'trans-convert' });
      } else {
        toast.error(`Conversion failed: ${err.message}`, { id: 'trans-convert' });
      }
    } finally {
      setConverting(false);
    }
  };

  const selectFromLibrary = (url: string) => {
    onChange(url);
    setDialogOpen(false);
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setDialogOpen(false);
      setUrlInput('');
    }
  };

  return (
    <div>
      <div className="flex gap-2 w-full">
        {value ? (
          <div className="relative group rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02] aspect-video w-full max-h-48 flex items-center justify-center">
            <img 
              src={value} 
              alt="Selected" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
              onError={(e) => {
                // If it fails to load, fallback to showing a placeholder styling but keep url
                e.currentTarget.style.opacity = '0.3';
              }}
            />
            
            {/* Control Overlay */}
            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2.5 px-4 flex-wrap">
              <Button 
                variant="secondary" 
                size="sm" 
                className="rounded-xl font-bold bg-white text-black hover:bg-kashmir-gold hover:text-black transition-all"
                onClick={() => {
                  setDialogOpen(true);
                  fetchMedia();
                }}
              >
                <ImageIcon className="h-4 w-4 mr-1.5" />
                Change
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                disabled={converting}
                className="rounded-xl font-bold bg-amber-500 text-black hover:bg-amber-400 transition-all gap-1.5 shadow-md shadow-amber-500/20"
                onClick={handleMakeTransparent}
                title="Remove black/dark background and convert to transparent PNG"
              >
                {converting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                <span>Make Transparent PNG</span>
              </Button>
              <Button 
                variant="destructive" 
                size="icon" 
                className="rounded-xl h-9 w-9"
                onClick={() => onChange('')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Small floating info badge */}
            <div className="absolute bottom-2 left-2 right-2 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center justify-between pointer-events-none group-hover:opacity-0 transition-opacity duration-300">
              <span className="text-[10px] text-white/50 truncate font-semibold flex-1 mr-2">{value}</span>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full h-28 border-dashed border-2 border-white/10 hover:border-kashmir-gold/40 bg-white/[0.01] hover:bg-white/[0.03] rounded-2xl flex flex-col items-center justify-center gap-2 text-white/40 hover:text-white transition-all duration-300 py-6"
            onClick={() => {
              setDialogOpen(true);
              fetchMedia();
            }}
          >
            <ImageIcon className="h-6 w-6 text-white/30" />
            <span className="text-xs font-bold uppercase tracking-wider">Select Display Image</span>
          </Button>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Image</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="library" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full">
              <TabsTrigger value="library" className="flex-1">Library</TabsTrigger>
              <TabsTrigger value="upload" className="flex-1">Upload</TabsTrigger>
              <TabsTrigger value="url" className="flex-1">URL</TabsTrigger>
            </TabsList>

            <TabsContent value="library" className="flex-1 overflow-auto mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : media.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No images in library yet
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {media.map((item) => (
                    <button
                      key={item.id}
                      className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
                      onClick={() => selectFromLibrary(item.url)}
                    >
                      <img
                        src={item.url}
                        alt={item.originalName}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="upload" className="flex-1 overflow-auto mt-4 pr-1">
              <div className="border-2 border-dashed rounded-lg p-12 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload}
                />
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Drag and drop or click to upload</p>
                <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" /> Choose File
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="url" className="flex-1 overflow-auto mt-4 pr-1">
              <div className="space-y-4 pb-2">
                <div>
                  <label className="text-sm font-medium mb-2 block">Image URL</label>
                  <Input
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="bg-white/5 border-white/10 rounded-xl"
                  />
                </div>
                {urlInput && (
                  <div className="aspect-video max-h-60 bg-muted rounded-xl overflow-hidden flex items-center justify-center relative border border-white/5">
                    <img
                      src={urlInput}
                      alt="Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        setUrlError(true);
                      }}
                      onLoad={() => {
                        setUrlError(false);
                      }}
                    />
                    {urlError && (
                      <div className="absolute inset-0 bg-red-950/40 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
                        <span className="text-sm font-black text-red-400">Unable to load image preview</span>
                        <span className="text-[10px] text-white/50 mt-1 max-w-xs">Please verify the URL is a direct link to an image file (PNG, JPG, WEBP, or data URI)</span>
                      </div>
                    )}
                  </div>
                )}
                <Button 
                  onClick={handleUrlSubmit} 
                  className="w-full bg-white text-black hover:bg-kashmir-gold hover:text-black font-bold h-11 rounded-xl transition-all" 
                  disabled={!urlInput.trim() || urlError}
                >
                  Use This Image
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
