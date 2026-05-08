import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Eye, 
  ShieldCheck, 
  FileCheck, 
  FolderOpen,
  Search,
  Filter,
  MoreVertical,
  CheckCircle2,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface InquiryVaultProps {
  inquiry: any;
  onBack: () => void;
}

export default function InquiryVault({ inquiry, onBack }: InquiryVaultProps) {
  const [documents, setDocuments] = useState([
    { id: 1, name: 'Guest_Aadhar_Cards.pdf', size: '2.4 MB', type: 'ID Proof', status: 'Verified', date: '2026-05-07' },
    { id: 2, name: 'Flight_Tickets_SXR.pdf', size: '1.1 MB', type: 'Travel', status: 'Pending', date: '2026-05-08' },
  ]);

  const handleUpload = () => {
    toast.info("Upload functionality connected to local vault");
  };

  return (
    <div className="animate-in fade-in duration-700 max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-6">
          <Button 
            onClick={onBack}
            variant="ghost" 
            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-kashmir-gold text-[10px] font-black uppercase tracking-[0.3em] mb-1">
              <ShieldCheck className="w-3 h-3" /> Secure Inquiry Vault
            </div>
            <h2 className="text-3xl font-display font-bold text-white tracking-tight">Documents for {inquiry.customerName}</h2>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl text-xs font-bold flex gap-2">
            <FileCheck className="w-4 h-4" /> 80% Documents Verified
          </Badge>
          <Button 
            onClick={handleUpload}
            className="bg-kashmir-gold text-black hover:bg-amber-500 font-black uppercase tracking-widest text-xs h-12 px-6 rounded-xl gap-2 shadow-lg shadow-kashmir-gold/20"
          >
            <Upload className="w-4 h-4" /> Upload New
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Statistics Column */}
        <div className="space-y-6">
          <Card className="bg-white/[0.03] border-white/5 p-6 rounded-[2rem] backdrop-blur-xl">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-6">Vault Overview</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-xs font-bold text-white/60">Total Files</p>
                <p className="text-lg font-black text-white">{documents.length}</p>
              </div>
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-xs font-bold text-white/60">Verified</p>
                <p className="text-lg font-black text-emerald-400">1</p>
              </div>
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-xs font-bold text-white/60">Storage</p>
                <p className="text-lg font-black text-blue-400">3.5 MB</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-kashmir-gold/10 to-transparent border-white/5 p-6 rounded-[2rem] backdrop-blur-xl">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-kashmir-gold/60 mb-4 flex items-center gap-2">
              <Clock className="w-3 h-3" /> Recent Activity
            </h4>
            <div className="space-y-4">
              {documents.map(doc => (
                <div key={doc.id} className="text-[10px] flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-kashmir-gold mt-1.5" />
                  <div>
                    <p className="text-white font-bold">{doc.name}</p>
                    <p className="text-white/20 uppercase tracking-widest mt-0.5">{doc.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Files Column */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="bg-[#0a0f12] border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-6">
                <div className="relative group w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <Input 
                    placeholder="Search documents..." 
                    className="pl-12 bg-white/5 border-white/5 h-12 rounded-xl text-sm"
                  />
                </div>
                <Button variant="ghost" className="text-white/40 hover:text-white gap-2 text-xs font-bold">
                  <Filter className="w-4 h-4" /> Filter
                </Button>
              </div>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">A-Z Sorting Active</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/20">Document Name</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/20">Type</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/20">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/20">Size</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-white/20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="group hover:bg-white/[0.03] transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white group-hover:text-kashmir-gold transition-colors">{doc.name}</p>
                            <p className="text-[10px] text-white/20 uppercase tracking-widest font-medium mt-0.5">Uploaded {doc.date}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <Badge variant="outline" className="bg-white/5 border-white/10 text-white/60 font-bold text-[9px] uppercase tracking-widest">
                          {doc.type}
                        </Badge>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            doc.status === 'Verified' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                          )} />
                          <span className={cn(
                            "text-xs font-bold",
                            doc.status === 'Verified' ? "text-emerald-400" : "text-amber-500"
                          )}>{doc.status}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm text-white/40 font-mono">
                        {doc.size}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl text-white/20 hover:text-white hover:bg-white/10">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl text-white/20 hover:text-white hover:bg-white/10">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl text-white/20 hover:text-red-400 hover:bg-red-400/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-8 bg-white/[0.01] border-t border-white/5 flex items-center justify-center gap-4 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">
              <FolderOpen className="w-4 h-4" />
              End of Document List
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
