import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Trash2, 
  ExternalLink, 
  Lock, 
  ShieldCheck, 
  Loader2, 
  Download, 
  FileCheck2, 
  AlertCircle,
  FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { UploadedDoc } from '../types';

interface DocumentVaultDeskProps {
  documents: UploadedDoc[];
  isUploading: boolean;
  onUploadFile: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onDeleteDocument: (docId: string, docName: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  selectedDocType: string;
  onSelectDocType: (type: 'Aadhaar Card' | 'Passport' | 'Flight Ticket' | 'Other') => void;
}

export const DocumentVaultDesk: React.FC<DocumentVaultDeskProps> = ({
  documents,
  isUploading,
  onUploadFile,
  onDeleteDocument,
  fileInputRef,
  selectedDocType,
  onSelectDocType
}) => {
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'IDENTITY' | 'TICKETS'>('ALL');

  const filteredDocs = documents.filter(doc => {
    if (filterCategory === 'IDENTITY' && !['Aadhaar Card', 'Passport'].includes(doc.type)) return false;
    if (filterCategory === 'TICKETS' && !['Flight Ticket', 'Other'].includes(doc.type)) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-amber-400 mb-2">
            <Lock className="w-3 h-3 text-amber-400" />
            <span>Digital Vault</span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Encrypted Travel Document Vault
          </h2>
          <p className="text-white/50 text-xs md:text-sm mt-0.5">
            Safely store government IDs, flight passes, and hotel check-in permits for streamlined verification across Kashmir.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/50 bg-slate-900/80 border border-white/5 px-3.5 py-2 rounded-2xl shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Encrypted Storage</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Card */}
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 flex flex-col justify-between shadow-2xl min-h-[300px]">
          <div>
            <h4 className="font-extrabold text-sm text-white mb-1.5 flex items-center gap-2">
              <Upload className="w-4 h-4 text-amber-400" /> 
              <span>Upload Travel Document</span>
            </h4>
            <p className="text-[11px] text-white/45 mb-5">
              JPG, PNG, or PDF up to 5MB. Verified for hotel check-ins and cab dispatch records.
            </p>
            
            <label className="text-[10px] font-black text-white/50 block mb-2 uppercase tracking-wider">
              Document Category
            </label>
            <select 
              value={selectedDocType}
              onChange={(e) => onSelectDocType(e.target.value as any)}
              className="w-full bg-black/50 border border-white/10 rounded-xl h-11 px-3 text-xs text-white outline-none focus:border-amber-400 transition-colors"
            >
              <option value="Aadhaar Card">Aadhaar Card (Indian Residents)</option>
              <option value="Passport">Passport / Visa (International Visitors)</option>
              <option value="Flight Ticket">Flight Ticket / Boarding Pass</option>
              <option value="Other">Other Travel Document</option>
            </select>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 space-y-3">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={onUploadFile}
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              variant="gold"
              className="w-full rounded-2xl text-slate-950 font-extrabold h-12 bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-500/20 text-xs"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Encrypting & Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" /> Select File & Upload
                </>
              )}
            </Button>
            <p className="text-[9px] text-white/30 text-center">
              Files are automatically purged according to J&K Tourism data retention compliance.
            </p>
          </div>
        </div>

        {/* Stored Files Workspace */}
        <div className="lg:col-span-2 bg-slate-900/70 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
              <div>
                <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-amber-400" />
                  <span>Stored Vault Documents</span>
                </h4>
                <p className="text-[10px] text-white/40 mt-0.5">{documents.length} verified documents in secure vault</p>
              </div>

              <div className="flex p-0.5 bg-black/40 border border-white/10 rounded-xl text-[10px]">
                {(['ALL', 'IDENTITY', 'TICKETS'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFilterCategory(cat)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-bold transition-all",
                      filterCategory === cat ? "bg-amber-500 text-slate-950 font-black" : "text-white/50 hover:text-white"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {filteredDocs.length === 0 ? (
              <div className="py-16 text-center text-white/30 text-xs flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-white/50">Your Document Vault is empty</p>
                  <p className="text-[10px] text-white/30 mt-0.5">Upload Aadhaar, Passport, or flight boarding passes to speed up resort check-ins.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[360px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 pr-1">
                {filteredDocs.map((doc) => (
                  <div 
                    key={doc.id} 
                    className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:border-amber-500/30 transition-all group shadow-md"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 text-left">
                        <h5 className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                          {doc.name}
                        </h5>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] font-bold text-amber-400/80 bg-amber-500/10 px-1.5 py-0.2 rounded">
                            {doc.type}
                          </span>
                          <span className="text-[9px] text-white/30">• {doc.uploadedAt}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 text-white/50 hover:text-amber-400 hover:bg-white/5 rounded-xl transition-colors"
                        title="Open Document Preview"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => onDeleteDocument(doc.id, doc.name)}
                        className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
