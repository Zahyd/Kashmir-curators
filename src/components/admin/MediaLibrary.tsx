import { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Copy, Loader2, Image as ImageIcon, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';

interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number | null;
  mimeType: string | null;
  altText: string | null;
  createdAt: string;
}

export default function MediaLibrary() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
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
      } else {
        toast.error('Failed to load media');
      }
    } catch (error) {
      console.error('[MediaLibrary] Fetch error:', error);
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let uploadedCount = 0;
    const token = localStorage.getItem('teamToken');

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        console.log(`[MediaLibrary] Uploading ${file.name} to backend...`);
        const response = await fetch(`${API_BASE_URL}/media/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (response.ok) {
          uploadedCount++;
        } else {
          toast.error(`Failed to upload ${file.name}`);
        }
      } catch (error) {
        console.error(`[MediaLibrary] Upload error for ${file.name}:`, error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    if (uploadedCount > 0) {
      toast.success(`Uploaded ${uploadedCount} file(s)`);
      fetchMedia();
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (item: MediaItem) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/media/${item.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('File deleted');
        fetchMedia();
      } else {
        toast.error('Failed to delete');
      }
    } catch (error) {
      console.error('[MediaLibrary] Delete error:', error);
      toast.error('Failed to delete');
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredMedia = media.filter((item) =>
    item.originalName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold">Media Library ({media.length})</h2>
        <div className="flex gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </div>

      {filteredMedia.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-dashed">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No media files</h3>
          <p className="text-muted-foreground mb-4">Upload images to use in your content</p>
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" /> Upload Files
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className="group relative bg-card rounded-lg overflow-hidden border cursor-pointer hover:ring-2 hover:ring-primary transition-all"
              onClick={() => setSelectedItem(item)}
            >
              <div className="aspect-square">
                {item.mimeType?.startsWith('image/') ? (
                  <img
                    src={item.url}
                    alt={item.altText || item.originalName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs truncate">{item.originalName}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(item.size)}</p>
              </div>
              <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyUrl(item.url);
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Media Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={selectedItem.url}
                  alt={selectedItem.altText || selectedItem.originalName}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-muted-foreground">Filename</label>
                  <p className="font-medium">{selectedItem.originalName}</p>
                </div>
                <div>
                  <label className="text-muted-foreground">Size</label>
                  <p className="font-medium">{formatFileSize(selectedItem.size)}</p>
                </div>
                <div>
                  <label className="text-muted-foreground">Type</label>
                  <p className="font-medium">{selectedItem.mimeType || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-muted-foreground">Uploaded</label>
                  <p className="font-medium">{new Date(selectedItem.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">URL</label>
                <div className="flex gap-2">
                  <Input value={selectedItem.url} readOnly className="text-xs" />
                  <Button variant="outline" onClick={() => copyUrl(selectedItem.url)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button variant="destructive" className="w-full" onClick={() => {
                handleDelete(selectedItem);
                setSelectedItem(null);
              }}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete File
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
