import React, { useEffect, useRef, useState } from 'react';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Eye,
  ShieldCheck,
  FileCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { salesApi, InquiryDocumentItem } from '@/lib/salesApi';

interface InquiryVaultProps {
  inquiry: any;
  onBack: () => void;
  onChanged?: () => void;
}

const CATEGORIES = [
  { value: 'ID_PROOF', label: 'ID Proof' },
  { value: 'FLIGHT_TICKET', label: 'Flight / Train' },
  { value: 'VOUCHER', label: 'Hotel / Cab Voucher' },
  { value: 'PROPOSAL', label: 'Itinerary Proposal' },
  { value: 'PAYMENT_RECEIPT', label: 'Payment Receipt' },
  { value: 'OTHER', label: 'Other Document' }
];

function formatBytes(bytes: number) {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function InquiryVault({ inquiry, onBack, onChanged }: InquiryVaultProps) {
  const [documents, setDocuments] = useState<InquiryDocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ID_PROOF');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('ALL');
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = async () => {
    if (!inquiry?.id) return;
    setLoading(true);
    try {
      const list = await salesApi.listDocuments(inquiry.id);
      setDocuments(list);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load vault documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [inquiry?.id]);

  if (!inquiry) return null;

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const toastId = toast.loading(`Uploading ${file.name} to Cloudinary Vault...`);
    try {
      const uploaded = await salesApi.uploadMediaFile(file);
      const created = await salesApi.createDocument(inquiry.id, {
        name: uploaded.originalName || file.name,
        category: selectedCategory,
        url: uploaded.url,
        publicId: uploaded.publicId,
        mimeType: uploaded.mimeType || file.type,
        sizeBytes: uploaded.size || file.size
      });
      setDocuments((prev) => [created, ...prev]);
      toast.success('Document uploaded & stored in Inquiry Vault', { id: toastId });
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.message || 'Document upload failed', { id: toastId });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleStatusChange = async (doc: InquiryDocumentItem, status: 'VERIFIED' | 'REJECTED' | 'PENDING') => {
    setBusyId(doc.id);
    try {
      const updated = await salesApi.updateDocument(doc.id, { status });
      setDocuments((prev) => prev.map((d) => (d.id === doc.id ? updated : d)));
      toast.success(`Document marked ${status.toLowerCase()}`);
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (doc: InquiryDocumentItem) => {
    if (!window.confirm(`Delete "${doc.name}" permanently from this inquiry vault?`)) return;
    setBusyId(doc.id);
    try {
      await salesApi.deleteDocument(doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      toast.success('Document removed from Vault');
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete document');
    } finally {
      setBusyId(null);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter !== 'ALL' && doc.status !== statusFilter) return false;
    return true;
  });

  const verifiedCount = documents.filter((d) => d.status === 'VERIFIED').length;
  const totalBytes = documents.reduce((sum, d) => sum + (d.sizeBytes || 0), 0);
  const verifiedPct = documents.length > 0 ? Math.round((verifiedCount / documents.length) * 100) : 0;

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0F141C]/90 border border-white/10 p-4 sm:p-5 rounded-xl shadow-lg">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            onClick={onBack}
            variant="outline"
            size="icon"
            className="w-9 h-9 rounded-lg bg-[#07090E] border-white/10 text-slate-300 hover:text-white shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Inquiry Document Vault</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white truncate">
              {inquiry.customerName} {inquiry.leadId ? `(${inquiry.leadId})` : ''}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 text-xs font-mono">
            <FileCheck className="w-3.5 h-3.5 mr-1" /> {verifiedPct}% Verified
          </Badge>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 bg-[#07090E] border border-white/10 rounded-lg px-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.docx"
            className="hidden"
            onChange={handleFileSelected}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs h-9 px-3.5 rounded-lg"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
            Upload File
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={loadDocuments}
            className="h-9 px-2.5 border-white/10 text-slate-300 hover:text-white"
            title="Refresh documents"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin text-amber-400')} />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-[#0F141C]/90 border border-white/10 p-4 rounded-xl">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stored Files</p>
          <p className="text-2xl font-extrabold text-white mt-1">{documents.length}</p>
        </Card>
        <Card className="bg-[#0F141C]/90 border border-white/10 p-4 rounded-xl">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Verified</p>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">{verifiedCount}</p>
        </Card>
        <Card className="bg-[#0F141C]/90 border border-white/10 p-4 rounded-xl">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Size</p>
          <p className="text-2xl font-extrabold text-blue-400 mt-1">{formatBytes(totalBytes)}</p>
        </Card>
      </div>

      {/* Search & Filter + Documents Table */}
      <Card className="bg-[#0F141C]/90 border border-white/10 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search documents by name or type..."
              className="pl-8 bg-[#07090E] border-white/10 text-xs text-white h-9 rounded-lg"
            />
          </div>
          <div className="flex items-center gap-1 bg-[#07090E] p-1 rounded-lg border border-white/10 overflow-x-auto">
            {(['ALL', 'PENDING', 'VERIFIED', 'REJECTED'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-2.5 py-1 rounded text-[11px] font-semibold transition',
                  statusFilter === s ? 'bg-amber-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
            <p className="text-xs">Loading stored inquiry documents...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-60" />
            <p className="text-sm font-semibold text-white">No documents in Vault</p>
            <p className="text-xs text-slate-400 mt-1">
              Upload ID proofs, flight manifests, hotel vouchers, or receipts for {inquiry.customerName}.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-[#07090E]/60 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">Document</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredDocs.map((doc) => {
                  const isBusy = busyId === doc.id;
                  return (
                    <tr key={doc.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate max-w-[220px]">{doc.name}</p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(doc.createdAt).toLocaleDateString()} • {doc.uploadedBy || 'Staff'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant="outline" className="bg-white/5 border-white/10 text-slate-300 text-[10px]">
                          {doc.category.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          className={cn(
                            'text-[10px] font-bold border',
                            doc.status === 'VERIFIED'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : doc.status === 'REJECTED'
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          )}
                        >
                          {doc.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-400">
                        {formatBytes(doc.sizeBytes)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
                            title="Preview document"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          <a
                            href={doc.url}
                            download={doc.name}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
                            title="Download document"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          {doc.status !== 'VERIFIED' && (
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={isBusy}
                              onClick={() => handleStatusChange(doc, 'VERIFIED')}
                              className="w-7 h-7 text-emerald-400 hover:bg-emerald-500/15"
                              title="Mark Verified"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                          )}
                          {doc.status !== 'REJECTED' && (
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={isBusy}
                              onClick={() => handleStatusChange(doc, 'REJECTED')}
                              className="w-7 h-7 text-amber-400 hover:bg-amber-500/15"
                              title="Mark Rejected"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={isBusy}
                            onClick={() => handleDelete(doc)}
                            className="w-7 h-7 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15"
                            title="Delete document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
