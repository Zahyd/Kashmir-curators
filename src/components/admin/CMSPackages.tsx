import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Star, 
  Loader2, 
  Save, 
  Image as ImageIcon, 
  RefreshCw, 
  Sparkles,
  Search,
  Filter,
  Download,
  LayoutGrid,
  List,
  Eye,
  Copy,
  MapPin,
  Clock,
  Compass,
  Check,
  X,
  TrendingUp,
  Tag,
  DollarSign,
  ChevronRight,
  ExternalLink,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTeamAuth } from '@/contexts/TeamAuthContext';
import MediaPicker from './MediaPicker';
import { API_BASE_URL } from '@/lib/api';

interface Package {
  id: string;
  name: string;
  destination: string;
  duration: string;
  price: number;
  originalPrice: number;
  description: string | null;
  imageUrl: string | null;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isActive: boolean;
}

const defaultPackage: Omit<Package, 'id'> = {
  name: '',
  destination: '',
  duration: '',
  price: 0,
  originalPrice: 0,
  description: '',
  imageUrl: '',
  highlights: [],
  inclusions: [],
  exclusions: [],
  rating: 4.8,
  reviewCount: 12,
  isFeatured: false,
  isActive: true,
};

export default function CMSPackages() {
  const { systemEvents } = useTeamAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingCatalog, setSyncingCatalog] = useState(false);
  
  // View mode & filters
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('featured');

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState<'core' | 'curation' | 'settings'>('core');
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [formData, setFormData] = useState(defaultPackage);
  const [highlightsInput, setHighlightsInput] = useState('');
  const [inclusionsInput, setInclusionsInput] = useState('');
  const [exclusionsInput, setExclusionsInput] = useState('');
  
  // Package Dossier Modal
  const [dossierPackage, setDossierPackage] = useState<Package | null>(null);

  // Delete Alert
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Packages Hero config states & modal
  const [heroDialogOpen, setHeroDialogOpen] = useState(false);
  const [heroTitle, setHeroTitle] = useState('PRIVATE PORTFOLIO');
  const [heroSubtitle, setHeroSubtitle] = useState('A meticulously curated registry of the finest expeditions across the Kashmir valley.');
  const [heroImage, setHeroImage] = useState('https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=1600');
  const [savingHero, setSavingHero] = useState(false);
  const [loadingHero, setLoadingHero] = useState(true);

  useEffect(() => {
    fetchPackages();
    fetchHeroData();
  }, []);

  // Real-time refresh on system events
  useEffect(() => {
    const latestEvent = systemEvents[0];
    if (latestEvent && latestEvent.booking && latestEvent.booking.entityType === 'package') {
      fetchPackages();
    }
  }, [systemEvents]);

  const fetchPackages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/packages?all=true`);
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setPackages(data);
      } else {
        setPackages([]);
      }
    } catch (error: any) {
      console.error('[CMSPackages] Fetch error:', error);
      toast.error(`Failed to load packages: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncLandingCatalog = async () => {
    setSyncingCatalog(true);
    try {
      toast.info('Syncing signature landing page collections...');
      await fetchPackages();
      toast.success('Catalog refreshed & synced with live signature collections!');
    } catch (e: any) {
      toast.error('Sync failed: ' + e.message);
    } finally {
      setSyncingCatalog(false);
    }
  };

  const fetchHeroData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/site-content`);
      if (response.ok) {
        const data = await response.json();
        if (data.packagesHero) {
          setHeroTitle(data.packagesHero.title || 'PRIVATE PORTFOLIO');
          setHeroSubtitle(data.packagesHero.subtitle || 'A meticulously curated registry of the finest expeditions across the Kashmir valley.');
          setHeroImage(data.packagesHero.image_url || 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=1600');
        }
      }
    } catch (error) {
      console.error('[CMSPackages] Error loading hero settings:', error);
    } finally {
      setLoadingHero(false);
    }
  };

  const handleSaveHero = async () => {
    setSavingHero(true);
    const token = localStorage.getItem('teamToken') || localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/site-content/packagesHero`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          section_key: 'packagesHero',
          title: heroTitle,
          subtitle: heroSubtitle,
          content: {},
          image_url: heroImage
        })
      });

      if (response.ok) {
        toast.success('Packages hero banner updated in real-time!');
        setHeroDialogOpen(false);
      } else {
        throw new Error('Failed to save to server');
      }
    } catch (error: any) {
      console.error('[CMSPackages] Error saving hero settings:', error);
      toast.error('Failed to save hero settings');
    } finally {
      setSavingHero(false);
    }
  };

  const openCreateDialog = () => {
    setEditingPackage(null);
    setFormData(defaultPackage);
    setHighlightsInput('');
    setInclusionsInput('');
    setExclusionsInput('');
    setDialogTab('core');
    setDialogOpen(true);
  };

  const openEditDialog = (pkg: Package) => {
    setEditingPackage(pkg);
    setFormData(pkg);
    setHighlightsInput(pkg.highlights?.join('\n') || '');
    setInclusionsInput(pkg.inclusions?.join('\n') || '');
    setExclusionsInput(pkg.exclusions?.join('\n') || '');
    setDialogTab('core');
    setDialogOpen(true);
  };

  const handleDuplicate = (pkg: Package) => {
    setEditingPackage(null);
    setFormData({
      ...pkg,
      name: `${pkg.name} (Copy)`,
      isActive: false
    });
    setHighlightsInput(pkg.highlights?.join('\n') || '');
    setInclusionsInput(pkg.inclusions?.join('\n') || '');
    setExclusionsInput(pkg.exclusions?.join('\n') || '');
    setDialogTab('core');
    setDialogOpen(true);
    toast.info('Created draft clone. Review and deploy.');
  };

  const handleSave = async () => {
    if (!formData.name || !formData.destination || !formData.duration) {
      toast.error('Please fill required fields (Name, Destination, Duration)');
      return;
    }

    setSaving(true);
    const token = localStorage.getItem('teamToken');
    const method = editingPackage ? 'PATCH' : 'POST';
    const url = editingPackage 
      ? `${API_BASE_URL}/packages/${editingPackage.id}` 
      : `${API_BASE_URL}/packages`;

    const dataToSave = {
      ...formData,
      highlights: highlightsInput.split('\n').map(s => s.trim()).filter(Boolean),
      inclusions: inclusionsInput.split('\n').map(s => s.trim()).filter(Boolean),
      exclusions: exclusionsInput.split('\n').map(s => s.trim()).filter(Boolean),
    };

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSave)
      });

      if (response.ok) {
        toast.success(editingPackage ? 'Package updated successfully' : 'Package deployed to catalog');
        setDialogOpen(false);
        fetchPackages();
      } else {
        const errData = await response.json().catch(() => ({}));
        toast.error(errData.error || `Failed to save package (${response.status})`);
      }
    } catch (error: any) {
      console.error('[CMSPackages] Error saving package:', error);
      toast.error(`Error saving package: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('teamToken');
    try {
      const response = await fetch(`${API_BASE_URL}/packages/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Package decommissioned from catalog');
        setDeleteConfirmOpen(false);
        setItemToDelete(null);
        if (dossierPackage?.id === id) setDossierPackage(null);
        fetchPackages();
      } else {
        const errData = await response.json().catch(() => ({}));
        toast.error(errData.error || 'Failed to delete package');
      }
    } catch (error: any) {
      toast.error(`Error deleting package: ${error.message}`);
    }
  };

  const toggleActive = async (pkg: Package) => {
    const token = localStorage.getItem('teamToken');
    try {
      const response = await fetch(`${API_BASE_URL}/packages/${pkg.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !pkg.isActive })
      });

      if (response.ok) {
        toast.success(`${pkg.name} is now ${!pkg.isActive ? 'Active Online' : 'Offline'}`);
        fetchPackages();
      } else {
        toast.error('Failed to toggle status');
      }
    } catch (error: any) {
      toast.error('Failed to toggle status');
    }
  };

  const toggleFeatured = async (pkg: Package) => {
    const token = localStorage.getItem('teamToken');
    try {
      const response = await fetch(`${API_BASE_URL}/packages/${pkg.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isFeatured: !pkg.isFeatured })
      });

      if (response.ok) {
        toast.success(`${pkg.name} ${!pkg.isFeatured ? 'marked Featured' : 'removed from Featured'}`);
        fetchPackages();
      } else {
        toast.error('Failed to toggle featured status');
      }
    } catch (error: any) {
      toast.error('Failed to toggle featured status');
    }
  };

  // Telemetry Aggregates
  const telemetry = useMemo(() => {
    const total = packages.length;
    const active = packages.filter(p => p.isActive).length;
    const featured = packages.filter(p => p.isFeatured).length;
    const prices = packages.map(p => p.price).filter(p => p > 0);
    const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;

    return { total, active, featured, avgPrice, minPrice, maxPrice };
  }, [packages]);

  // Unique destinations for filter dropdown
  const uniqueDestinations = useMemo(() => {
    const set = new Set<string>();
    packages.forEach(p => {
      if (p.destination) set.add(p.destination);
    });
    return Array.from(set);
  }, [packages]);

  // Filter & Sort Logic
  const filteredPackages = useMemo(() => {
    return packages.filter(p => {
      const matchSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.duration.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.highlights && p.highlights.some(h => h.toLowerCase().includes(searchTerm.toLowerCase())));

      if (!matchSearch) return false;

      if (destinationFilter !== 'all' && p.destination !== destinationFilter) {
        return false;
      }

      if (statusFilter === 'active' && !p.isActive) return false;
      if (statusFilter === 'offline' && p.isActive) return false;
      if (statusFilter === 'featured' && !p.isFeatured) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'featured') {
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
        return b.price - a.price;
      }
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [packages, searchTerm, destinationFilter, statusFilter, sortBy]);

  // Export CSV
  const exportPackagesCSV = () => {
    const headers = ['Package Name', 'Destination', 'Duration', 'Price (INR)', 'Original Price', 'Rating', 'Reviews', 'Featured', 'Status', 'Image URL'];
    const rows = filteredPackages.map(p => [
      `"${p.name}"`,
      `"${p.destination}"`,
      `"${p.duration}"`,
      p.price,
      p.originalPrice,
      p.rating,
      p.reviewCount,
      p.isFeatured ? 'Yes' : 'No',
      p.isActive ? 'Active' : 'Offline',
      `"${p.imageUrl || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kashmir_curators_packages_catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Package catalog exported to CSV');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Top Header Command Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gradient-to-r from-amber-500/[0.04] via-transparent to-transparent p-6 rounded-3xl border border-white/5 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-[10px] font-black uppercase tracking-[0.25em] mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Signature Atelier Catalog</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold text-white tracking-tight">
            Tour Packages CMS
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Curate bespoke expedition itineraries, pricing tiers, inclusions & real-time landing page catalog.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <Button
            onClick={() => setHeroDialogOpen(true)}
            variant="outline"
            className="h-10 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border-white/10 text-white/80 text-xs font-bold gap-2"
            title="Configure Public Packages Hero Banner"
          >
            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Hero Banner</span>
          </Button>

          <Button
            onClick={handleSyncLandingCatalog}
            variant="outline"
            disabled={syncingCatalog}
            className="h-10 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border-white/10 text-white/80 text-xs font-bold gap-2"
            title="Sync Catalog"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-amber-400", syncingCatalog && "animate-spin")} />
            <span className="hidden sm:inline">{syncingCatalog ? 'Syncing...' : 'Sync Catalog'}</span>
          </Button>

          <Button
            onClick={exportPackagesCSV}
            variant="outline"
            className="h-10 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border-white/10 text-white/80 text-xs font-bold gap-2"
            title="Export CSV Catalog"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>

          <div className="flex items-center bg-black/40 border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-lg text-xs transition-colors",
                viewMode === 'grid' ? "bg-amber-500/20 text-amber-400" : "text-white/40 hover:text-white"
              )}
              title="Grid Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "p-2 rounded-lg text-xs transition-colors",
                viewMode === 'table' ? "bg-amber-500/20 text-amber-400" : "text-white/40 hover:text-white"
              )}
              title="Dense Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button 
            onClick={openCreateDialog}
            className="h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-[11px] px-5 shadow-lg shadow-amber-500/15 gap-2"
          >
            <Plus className="w-3.5 h-3.5" /> 
            <span>Deploy Package</span>
          </Button>
        </div>
      </div>

      {/* High-Density Telemetry Deck */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Catalog */}
        <div className="p-5 rounded-2xl bg-[#090e13]/90 border border-white/5 hover:border-white/10 transition-all relative overflow-hidden group shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Total Packages</span>
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/60">
              <Compass className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl lg:text-3xl font-display font-bold text-white">
              {telemetry.total}
            </p>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              {telemetry.active} Active
            </span>
          </div>
          <p className="text-[11px] text-white/40 mt-1">
            Curated valley itineraries
          </p>
        </div>

        {/* Featured Expeditions */}
        <div className="p-5 rounded-2xl bg-[#090e13]/90 border border-amber-500/20 hover:border-amber-500/35 transition-all relative overflow-hidden group shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Featured Priority</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl lg:text-3xl font-display font-bold text-amber-400">
              {telemetry.featured}
            </p>
            <span className="text-[10px] font-bold text-amber-400/80">
              Top Ranked
            </span>
          </div>
          <p className="text-[11px] text-white/40 mt-1">
            Highlighted on homepage hero
          </p>
        </div>

        {/* Average Tariff */}
        <div className="p-5 rounded-2xl bg-[#090e13]/90 border border-white/5 hover:border-white/10 transition-all relative overflow-hidden group shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Average Tariff</span>
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/60">
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl lg:text-3xl font-display font-bold text-emerald-400">
              ₹{telemetry.avgPrice.toLocaleString()}
            </p>
          </div>
          <p className="text-[11px] text-white/40 mt-1">
            Across active collections
          </p>
        </div>

        {/* Tariff Range */}
        <div className="p-5 rounded-2xl bg-[#090e13]/90 border border-white/5 hover:border-white/10 transition-all relative overflow-hidden group shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Tariff Range</span>
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/60">
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-base lg:text-lg font-mono font-bold text-white">
              ₹{telemetry.minPrice.toLocaleString()} - ₹{telemetry.maxPrice.toLocaleString()}
            </p>
          </div>
          <p className="text-[11px] text-white/40 mt-1">
            Entry to luxury tier range
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#090e13]/90 border border-white/5 rounded-3xl p-5 backdrop-blur-xl space-y-4 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search */}
          <div className="md:col-span-4 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              placeholder="Search by package name, destination, route..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-9 bg-white/5 border-white/10 rounded-xl h-11 text-xs text-white placeholder:text-white/30 focus:border-amber-400"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Destination Filter */}
          <div className="md:col-span-3">
            <select
              value={destinationFilter}
              onChange={(e) => setDestinationFilter(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl h-11 px-3 text-xs text-white/80 focus:border-amber-400 focus:outline-none"
            >
              <option value="all" className="bg-[#090e13]">All Destinations</option>
              {uniqueDestinations.map(d => (
                <option key={d} value={d} className="bg-[#090e13]">{d}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl h-11 px-3 text-xs text-white/80 focus:border-amber-400 focus:outline-none"
            >
              <option value="all" className="bg-[#090e13]">All Statuses</option>
              <option value="active" className="bg-[#090e13]">Active Online</option>
              <option value="offline" className="bg-[#090e13]">Offline Draft</option>
              <option value="featured" className="bg-[#090e13]">Featured Only</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="md:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl h-11 px-3 text-xs text-white/80 focus:border-amber-400 focus:outline-none"
            >
              <option value="featured" className="bg-[#090e13]">Featured First</option>
              <option value="price_asc" className="bg-[#090e13]">Price: Low to High</option>
              <option value="price_desc" className="bg-[#090e13]">Price: High to Low</option>
              <option value="rating" className="bg-[#090e13]">Highest Rated</option>
              <option value="name" className="bg-[#090e13]">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(searchTerm || destinationFilter !== 'all' || statusFilter !== 'all') && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/5 text-xs text-white/50">
            <span className="text-[10px] uppercase font-bold text-white/30">Active Filters:</span>
            {searchTerm && (
              <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1">
                Search: "{searchTerm}"
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchTerm('')} />
              </span>
            )}
            {destinationFilter !== 'all' && (
              <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1">
                Destination: {destinationFilter}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setDestinationFilter('all')} />
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1">
                Status: {statusFilter}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setStatusFilter('all')} />
              </span>
            )}
            <button
              onClick={() => { setSearchTerm(''); setDestinationFilter('all'); setStatusFilter('all'); }}
              className="text-[10px] text-white/40 hover:text-white underline ml-2"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Content Display */}
      {loading ? (
        <div className="py-24 text-center opacity-60 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase font-black tracking-widest text-white/60">
            Loading Signature Tour Packages...
          </p>
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
          <Sparkles className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-xs font-bold uppercase tracking-wider">
            No tour packages match your filters.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Modernized Luxury Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPackages.map((pkg) => (
            <div
              key={pkg.id}
              className="rounded-2xl bg-[#090e13]/90 border border-white/5 hover:border-amber-500/30 transition-all duration-300 group flex flex-col justify-between overflow-hidden shadow-xl"
            >
              <div>
                {/* Image & Header Overlay */}
                <div className="relative aspect-[16/10] overflow-hidden bg-white/5">
                  {pkg.imageUrl ? (
                    <img 
                      src={pkg.imageUrl} 
                      alt={pkg.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/10 to-transparent">
                      <Compass className="w-12 h-12 text-amber-400/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                    {pkg.isFeatured && (
                      <Badge className="bg-amber-500 text-black border-none text-[8px] font-black uppercase tracking-wider px-2 py-0.5 shadow-md flex items-center gap-1">
                        <Crown className="w-2.5 h-2.5" />
                        <span>Featured</span>
                      </Badge>
                    )}
                    <Badge variant="outline" className="bg-black/60 backdrop-blur-md border-white/20 text-white text-[9px] font-bold px-2 py-0.5 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-amber-400" />
                      <span>{pkg.duration}</span>
                    </Badge>
                  </div>

                  {/* Top Right Status Switch */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      onClick={() => toggleActive(pkg)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider backdrop-blur-md transition-all border",
                        pkg.isActive 
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30"
                          : "bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30"
                      )}
                      title="Click to toggle Online/Offline"
                    >
                      {pkg.isActive ? 'Active' : 'Offline'}
                    </button>
                  </div>

                  {/* Bottom Image Info */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-white/90 font-bold bg-black/40 backdrop-blur-md px-2 py-1 rounded-md">
                      <MapPin className="w-3 h-3 text-amber-400" />
                      {pkg.destination}
                    </span>
                    <span className="flex items-center gap-1 text-amber-300 font-bold bg-black/40 backdrop-blur-md px-2 py-1 rounded-md text-[10px]">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {pkg.rating} ({pkg.reviewCount})
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-bold text-white text-base group-hover:text-amber-400 transition-colors line-clamp-1">
                      {pkg.name}
                    </h3>
                    {pkg.description && (
                      <p className="text-xs text-white/50 line-clamp-2 mt-1">
                        {pkg.description}
                      </p>
                    )}
                  </div>

                  {/* Highlights Preview */}
                  {pkg.highlights && pkg.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {pkg.highlights.slice(0, 3).map((h, i) => (
                        <span key={i} className="text-[9px] font-semibold bg-white/5 text-white/70 border border-white/5 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 text-amber-400" />
                          <span className="truncate max-w-[130px]">{h}</span>
                        </span>
                      ))}
                      {pkg.highlights.length > 3 && (
                        <span className="text-[9px] text-white/40 self-center">
                          +{pkg.highlights.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Pricing Strip */}
                  <div className="flex items-baseline justify-between pt-3 border-t border-white/5">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-wider text-white/40 block">Package Tariff</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-mono font-bold text-amber-400">
                          ₹{pkg.price.toLocaleString()}
                        </span>
                        {pkg.originalPrice > pkg.price && (
                          <span className="text-xs text-white/30 line-through font-mono">
                            ₹{pkg.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    {pkg.originalPrice > pkg.price && (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">
                        {Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100)}% OFF
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-5 pt-0 flex items-center gap-2">
                <Button
                  onClick={() => setDossierPackage(pkg)}
                  variant="outline"
                  className="flex-1 h-9 rounded-xl bg-white/5 hover:bg-white/10 border-white/10 text-white/90 text-[10px] font-black uppercase tracking-wider gap-1.5"
                >
                  <Eye className="w-3 h-3 text-amber-400" />
                  <span>Dossier</span>
                </Button>

                <Button
                  onClick={() => openEditDialog(pkg)}
                  variant="outline"
                  className="h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 border-white/10 text-white/80 text-[10px] font-bold"
                  title="Edit Package"
                >
                  <Pencil className="w-3 h-3" />
                </Button>

                <Button
                  onClick={() => handleDuplicate(pkg)}
                  variant="outline"
                  className="h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 border-white/10 text-white/80 text-[10px] font-bold"
                  title="Duplicate Package"
                >
                  <Copy className="w-3 h-3" />
                </Button>

                <button
                  onClick={() => {
                    setItemToDelete(pkg.id);
                    setDeleteConfirmOpen(true);
                  }}
                  className="w-9 h-9 rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 flex items-center justify-center text-rose-400 transition-all shrink-0"
                  title="Decommission Package"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>
      ) : (
        /* Dense Enterprise Table View */
        <div className="bg-[#090e13]/90 border border-white/5 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader className="bg-white/[0.02] border-b border-white/5">
                <TableRow className="border-none text-[9px] font-black uppercase tracking-widest text-white/40">
                  <TableHead className="py-4 px-6 text-white/40">Package / Route</TableHead>
                  <TableHead className="py-4 px-4 text-white/40">Destination</TableHead>
                  <TableHead className="py-4 px-4 text-white/40">Duration</TableHead>
                  <TableHead className="py-4 px-4 text-white/40 text-right">Tariff (INR)</TableHead>
                  <TableHead className="py-4 px-4 text-white/40 text-center">Rating</TableHead>
                  <TableHead className="py-4 px-4 text-white/40 text-center">Status</TableHead>
                  <TableHead className="py-4 px-4 text-white/40 text-center">Featured</TableHead>
                  <TableHead className="py-4 px-6 text-white/40 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-white/5">
                {filteredPackages.map((pkg) => (
                  <TableRow 
                    key={pkg.id}
                    onClick={() => setDossierPackage(pkg)}
                    className="hover:bg-white/[0.02] transition-colors cursor-pointer group border-none"
                  >
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-white/5 overflow-hidden border border-white/10 shrink-0">
                          {pkg.imageUrl ? (
                            <img src={pkg.imageUrl} alt={pkg.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-amber-400/50">
                              <Compass className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white group-hover:text-amber-400 transition-colors text-sm">
                            {pkg.name}
                          </p>
                          <p className="text-[10px] text-white/40 font-mono">
                            REF: #{pkg.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-4 px-4">
                      <span className="flex items-center gap-1.5 text-xs text-white/80 font-bold">
                        <MapPin className="w-3 h-3 text-amber-400" />
                        {pkg.destination}
                      </span>
                    </TableCell>

                    <TableCell className="py-4 px-4">
                      <Badge variant="outline" className="border-white/10 text-white/70 text-[9px]">
                        {pkg.duration}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-4 px-4 text-right">
                      <p className="font-mono font-bold text-amber-400 text-sm">₹{pkg.price.toLocaleString()}</p>
                      {pkg.originalPrice > pkg.price && (
                        <p className="text-[10px] text-white/30 line-through font-mono">₹{pkg.originalPrice.toLocaleString()}</p>
                      )}
                    </TableCell>

                    <TableCell className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-xs text-amber-300 font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {pkg.rating}
                      </span>
                    </TableCell>

                    <TableCell className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => toggleActive(pkg)}>
                        <Badge className={cn(
                          "text-[8px] font-black uppercase tracking-wider px-2 py-0.5 border cursor-pointer",
                          pkg.isActive ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                        )}>
                          {pkg.isActive ? 'Active' : 'Offline'}
                        </Badge>
                      </button>
                    </TableCell>

                    <TableCell className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => toggleFeatured(pkg)}>
                        {pkg.isFeatured ? (
                          <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[8px] font-black uppercase tracking-wider">
                            Featured
                          </Badge>
                        ) : (
                          <span className="text-white/20 text-xs">—</span>
                        )}
                      </button>
                    </TableCell>

                    <TableCell className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDossierPackage(pkg)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                        <button
                          onClick={() => openEditDialog(pkg)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(pkg)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setItemToDelete(pkg.id);
                            setDeleteConfirmOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* PACKAGE DOSSIER INSPECTION MODAL */}
      {dossierPackage && (
        <Dialog open={!!dossierPackage} onOpenChange={() => setDossierPackage(null)}>
          <DialogContent className="max-w-3xl bg-[#090e13]/98 border border-white/10 text-white rounded-3xl p-8 max-h-[90vh] overflow-y-auto custom-scrollbar backdrop-blur-2xl">
            {/* Header Banner */}
            <div className="relative aspect-[21/9] rounded-2xl overflow-hidden mb-6 border border-white/10">
              {dossierPackage.imageUrl ? (
                <img src={dossierPackage.imageUrl} alt={dossierPackage.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/5">
                  <Compass className="w-12 h-12 text-amber-400/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {dossierPackage.isFeatured && (
                      <Badge className="bg-amber-500 text-black border-none text-[8px] font-black uppercase tracking-wider">
                        Featured Priority
                      </Badge>
                    )}
                    <Badge className={dossierPackage.isActive ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[8px]" : "bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[8px]"}>
                      {dossierPackage.isActive ? 'Active Online' : 'Offline Draft'}
                    </Badge>
                  </div>
                  <h2 className="text-2xl font-display font-bold text-white">{dossierPackage.name}</h2>
                  <p className="text-xs text-white/60 flex items-center gap-2 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>{dossierPackage.destination}</span>
                    <span>•</span>
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{dossierPackage.duration}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-black uppercase tracking-wider text-white/40 block">Tariff</span>
                  <span className="text-2xl font-mono font-bold text-amber-400">₹{dossierPackage.price.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Content Details */}
            <div className="space-y-6 text-left">
              {dossierPackage.description && (
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Expedition Overview</h4>
                  <p className="text-xs text-white/80 leading-relaxed">{dossierPackage.description}</p>
                </div>
              )}

              {/* Highlights */}
              {dossierPackage.highlights && dossierPackage.highlights.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Curated Highlights</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {dossierPackage.highlights.map((h, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white/80 flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inclusions & Exclusions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">Package Inclusions</h4>
                  <div className="space-y-1.5">
                    {dossierPackage.inclusions && dossierPackage.inclusions.length > 0 ? (
                      dossierPackage.inclusions.map((inc, i) => (
                        <p key={i} className="text-xs text-white/70 flex items-center gap-2">
                          <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{inc}</span>
                        </p>
                      ))
                    ) : (
                      <p className="text-xs text-white/30 italic">No inclusions listed</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-2">Package Exclusions</h4>
                  <div className="space-y-1.5">
                    {dossierPackage.exclusions && dossierPackage.exclusions.length > 0 ? (
                      dossierPackage.exclusions.map((exc, i) => (
                        <p key={i} className="text-xs text-white/70 flex items-center gap-2">
                          <X className="w-3 h-3 text-rose-400 shrink-0" />
                          <span>{exc}</span>
                        </p>
                      ))
                    ) : (
                      <p className="text-xs text-white/30 italic">No exclusions listed</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-6 border-t border-white/5 flex gap-2">
              <Button
                variant="outline"
                onClick={() => setDossierPackage(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 border-white/10 text-white text-xs h-11 rounded-xl"
              >
                Close Dossier
              </Button>
              <Button
                onClick={() => {
                  const pkg = dossierPackage;
                  setDossierPackage(null);
                  openEditDialog(pkg);
                }}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-xs h-11 rounded-xl"
              >
                Edit Package
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* CREATE / EDIT PACKAGE MODAL */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl bg-[#090e13]/98 border border-white/10 text-white rounded-3xl p-8 max-h-[90vh] overflow-y-auto custom-scrollbar backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold">
              {editingPackage ? 'Modify Experience Node' : 'Deploy Signature Package'}
            </DialogTitle>
            <p className="text-xs text-white/40">Configure itinerary parameters, tariffs, inclusions and live catalog status.</p>
          </DialogHeader>

          {/* Sub-tabs inside modal */}
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 my-3">
            <button
              onClick={() => setDialogTab('core')}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all",
                dialogTab === 'core' ? "bg-amber-500 text-black shadow" : "text-white/50 hover:text-white"
              )}
            >
              1. Core Information
            </button>
            <button
              onClick={() => setDialogTab('curation')}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all",
                dialogTab === 'curation' ? "bg-amber-500 text-black shadow" : "text-white/50 hover:text-white"
              )}
            >
              2. Highlights & Inclusions
            </button>
            <button
              onClick={() => setDialogTab('settings')}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all",
                dialogTab === 'settings' ? "bg-amber-500 text-black shadow" : "text-white/50 hover:text-white"
              )}
            >
              3. Visibility & Badges
            </button>
          </div>

          <div className="space-y-4 py-2 text-left">
            {/* Tab 1: Core */}
            {dialogTab === 'core' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Package Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Royal Kashmir Grandeur"
                      className="bg-white/5 border-white/10 rounded-xl h-11 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Destination *</label>
                    <Input
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      placeholder="e.g. Srinagar • Gulmarg • Pahalgam"
                      className="bg-white/5 border-white/10 rounded-xl h-11 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Duration *</label>
                    <Input
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="e.g. 5 Days / 4 Nights"
                      className="bg-white/5 border-white/10 rounded-xl h-11 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Price (₹) *</label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="bg-white/5 border-white/10 rounded-xl h-11 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Original Price (₹)</label>
                    <Input
                      type="number"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                      className="bg-white/5 border-white/10 rounded-xl h-11 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Overview Description</label>
                  <Textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide a luxurious description of the itinerary..."
                    rows={3}
                    className="bg-white/5 border-white/10 rounded-xl text-xs resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Cover Image</label>
                  <MediaPicker
                    value={formData.imageUrl || ''}
                    onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Curation */}
            {dialogTab === 'curation' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">
                    Highlights (One per line)
                  </label>
                  <Textarea
                    value={highlightsInput}
                    onChange={(e) => setHighlightsInput(e.target.value)}
                    placeholder="Private Shikara ride on Dal Lake&#10;Phase-2 Gondola ride in Gulmarg&#10;Betaab & Aru Valley excursion"
                    rows={4}
                    className="bg-white/5 border-white/10 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-1">
                      Inclusions (One per line)
                    </label>
                    <Textarea
                      value={inclusionsInput}
                      onChange={(e) => setInclusionsInput(e.target.value)}
                      placeholder="Luxury hotel & houseboat accommodation&#10;Daily breakfast & chef dinner&#10;Private 4x4 vehicle with driver"
                      rows={4}
                      className="bg-white/5 border-white/10 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-rose-400 block mb-1">
                      Exclusions (One per line)
                    </label>
                    <Textarea
                      value={exclusionsInput}
                      onChange={(e) => setExclusionsInput(e.target.value)}
                      placeholder="Flights / Airfare&#10;Personal gratuities&#10;Pony rides & personal expenses"
                      rows={4}
                      className="bg-white/5 border-white/10 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Star Rating</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                      className="bg-white/5 border-white/10 rounded-xl h-11 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Review Count</label>
                    <Input
                      type="number"
                      value={formData.reviewCount}
                      onChange={(e) => setFormData({ ...formData, reviewCount: Number(e.target.value) })}
                      className="bg-white/5 border-white/10 rounded-xl h-11 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Settings */}
            {dialogTab === 'settings' && (
              <div className="space-y-5 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">Active Online Status</p>
                    <p className="text-xs text-white/40">Visible to travelers on the public website and booking catalog</p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                  <div>
                    <p className="text-sm font-bold text-white">Featured Signature Collection</p>
                    <p className="text-xs text-white/40">Pin to the premier hero showcase on the home page</p>
                  </div>
                  <Switch
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-white/5 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="flex-1 bg-transparent border-white/10 text-white text-xs h-11 rounded-xl"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-xs h-11 rounded-xl shadow-lg"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingPackage ? 'Update Package' : 'Deploy Package'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PACKAGES HERO CONFIGURATION MODAL */}
      <Dialog open={heroDialogOpen} onOpenChange={setHeroDialogOpen}>
        <DialogContent className="max-w-xl bg-[#090e13]/98 border border-white/10 text-white rounded-3xl p-8 backdrop-blur-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-400 text-[10px] font-black uppercase tracking-[0.25em] mb-1">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Landing Page Hero Configuration</span>
            </div>
            <DialogTitle className="text-2xl font-display font-bold">Public Packages Banner</DialogTitle>
            <p className="text-xs text-white/40">Configure the top cover image and headlines for `/packages`.</p>
          </DialogHeader>

          <div className="space-y-4 py-4 text-left">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Hero Background Image</label>
              <MediaPicker
                value={heroImage}
                onChange={(url) => setHeroImage(url)}
              />
              {heroImage && (
                <div className="mt-3 relative aspect-[21/9] rounded-xl overflow-hidden border border-white/10">
                  <img src={heroImage} alt="Hero Banner Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40" />
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Hero Headline</label>
              <Input
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                placeholder="e.g. PRIVATE PORTFOLIO"
                className="bg-white/5 border-white/10 rounded-xl h-11 text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Hero Subheadline</label>
              <Textarea
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                placeholder="e.g. A meticulously curated registry of the finest expeditions across the Kashmir valley."
                rows={3}
                className="bg-white/5 border-white/10 rounded-xl text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-white/5 flex gap-2">
            <Button
              variant="outline"
              onClick={() => setHeroDialogOpen(false)}
              className="flex-1 bg-transparent border-white/10 text-white text-xs h-11 rounded-xl"
              disabled={savingHero}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveHero}
              disabled={savingHero}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-xs h-11 rounded-xl shadow-lg"
            >
              {savingHero ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DECOMMISSION ALERT */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-[#090e13]/98 border border-rose-500/20 text-white rounded-3xl p-8 backdrop-blur-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5 mx-auto text-rose-400">
            <Trash2 className="w-6 h-6" />
          </div>
          <AlertDialogHeader className="text-center">
            <AlertDialogTitle className="text-2xl font-display font-bold text-center">Decommission Package?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-white/50 text-center mt-2">
              Are you sure you want to permanently decommission this travel package from the catalog? This action will remove it from live customer bookings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-6 border-t border-white/5 flex gap-3">
            <AlertDialogCancel className="flex-1 bg-transparent border-white/10 text-white text-xs h-11 rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => itemToDelete && handleDelete(itemToDelete)}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs h-11 rounded-xl shadow-lg shadow-rose-500/20"
            >
              Confirm Decommission
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
