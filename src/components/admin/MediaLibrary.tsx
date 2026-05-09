import { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Copy, Loader2, Image as ImageIcon, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface MediaItem {
  id: string;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  alt_text: string | null;
  created_at: string;
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
    const { data, error } = await supabase
      .from('media_library')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load media');
    } else {
      setMedia(data || []);
    }
    setLoading(false);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let uploadedCount = 0;

    for (const file of Array.from(files)) {
      const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `uploads/${filename}`;

      console.log(`[MediaLibrary] Uploading ${file.name} to 'media/${filePath}'`);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        console.error(`[MediaLibrary] Upload error for ${file.name}:`, uploadError);
        toast.error(`Failed to upload ${file.name}: ${uploadError.message}`);
        continue;
      }

      console.log(`[MediaLibrary] Upload successful for ${file.name}:`, uploadData);
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);

      const { error: dbError } = await supabase.from('media_library').insert({
        filename,
        original_name: file.name,
        file_path: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
      });

      if (!dbError) {
        uploadedCount++;
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

    // Extract path from URL for storage deletion
    const pathMatch = item.file_path.match(/\/media\/(.+)$/);
    if (pathMatch) {
      await supabase.storage.from('media').remove([pathMatch[1]]);
    }

    const { error } = await supabase.from('media_library').delete().eq('id', item.id);

    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('File deleted');
      fetchMedia();
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
    item.original_name.toLowerCase().includes(searchQuery.toLowerCase())
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
                {item.mime_type?.startsWith('image/') ? (
                  <img
                    src={item.file_path}
                    alt={item.alt_text || item.original_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs truncate">{item.original_name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(item.file_size)}</p>
              </div>
              <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyUrl(item.file_path);
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
                  src={selectedItem.file_path}
                  alt={selectedItem.alt_text || selectedItem.original_name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-muted-foreground">Filename</label>
                  <p className="font-medium">{selectedItem.original_name}</p>
                </div>
                <div>
                  <label className="text-muted-foreground">Size</label>
                  <p className="font-medium">{formatFileSize(selectedItem.file_size)}</p>
                </div>
                <div>
                  <label className="text-muted-foreground">Type</label>
                  <p className="font-medium">{selectedItem.mime_type || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-muted-foreground">Uploaded</label>
                  <p className="font-medium">{new Date(selectedItem.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">URL</label>
                <div className="flex gap-2">
                  <Input value={selectedItem.file_path} readOnly className="text-xs" />
                  <Button variant="outline" onClick={() => copyUrl(selectedItem.file_path)}>
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
