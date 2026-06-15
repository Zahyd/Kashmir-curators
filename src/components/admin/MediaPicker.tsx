import { useState, useEffect, useRef } from 'react';
import { Upload, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';

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
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const formData = new FormData();
      formData.append('file', file);

      console.log(`[MediaPicker] Uploading ${file.name} to backend...`);
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
      toast.success('Image uploaded');
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
      <div className="flex gap-2">
        {value ? (
          <div className="relative w-full">
            <div className="flex items-center gap-2 p-2 border rounded-md">
              <img src={value} alt="Selected" className="w-12 h-12 object-cover rounded" />
              <span className="flex-1 text-sm truncate">{value}</span>
              <Button variant="ghost" size="icon" onClick={() => onChange('')}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground"
            onClick={() => {
              setDialogOpen(true);
              fetchMedia();
            }}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Select Image
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
                  />
                </div>
                {urlInput && (
                  <div className="aspect-video max-h-64 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                    <img
                      src={urlInput}
                      alt="Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
                <Button onClick={handleUrlSubmit} className="w-full" disabled={!urlInput.trim()}>
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
