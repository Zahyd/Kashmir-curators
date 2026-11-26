import React, { useState, useEffect, useCallback } from 'react';
import {
  Code2,
  Key,
  Copy,
  Check,
  Crown,
  Terminal,
  RefreshCw,
  Building,
  Car,
  Package,
  AlertCircle
} from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/lib/api';
import { agentApi, getErrMsg } from '../lib/agentApi';

interface EnterpriseApiGatewayProps {
  isEnterprise: boolean;
  onOpenUpgradeModal: () => void;
  agencyCode?: string;
  refreshTrigger?: number;
}

export const EnterpriseApiGateway: React.FC<EnterpriseApiGatewayProps> = ({
  isEnterprise = false,
  onOpenUpgradeModal,
  agencyCode = 'AGT-PENDING',
  refreshTrigger = 0
}) => {
  const { token } = useAuth();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<'json' | 'xml'>('json');
  const [activeEndpoint, setActiveEndpoint] = useState<'hotels' | 'cabs' | 'packages'>('hotels');
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payloadPreview, setPayloadPreview] = useState<string>('');

  const loadFeed = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await agentApi.getApiFeed({ category: activeEndpoint, format }, token);
      setApiKey(data.apiKey || null);
      setPayloadPreview(
        format === 'xml'
          ? data.xml || ''
          : JSON.stringify(data.json, null, 2)
      );
    } catch (err: unknown) {
      setError(getErrMsg(err, 'Failed to query live inventory feed'));
    } finally {
      setLoading(false);
    }
  }, [activeEndpoint, format, token]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed, refreshTrigger]);

  const handleCopyKey = () => {
    if (!apiKey) {
      toast.info('Generate an Enterprise API key first.');
      return;
    }
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    toast.success('B2B API Key copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateKey = async () => {
    if (!isEnterprise) {
      onOpenUpgradeModal();
      return;
    }
    try {
      setRegenerating(true);
      const res = await agentApi.regenerateApiKey(token);
      setApiKey(res.apiKey);
      toast.success('Live B2B API Key provisioned & saved to database.');
    } catch (err: unknown) {
      toast.error(getErrMsg(err, 'Failed to provision API key'));
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {!isEnterprise ? (
        <div className="bg-gradient-to-r from-purple-500/15 via-indigo-500/10 to-transparent p-6 rounded-3xl border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400 shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-foreground">B2B XML/REST Inventory API Feed</h3>
                <Badge className="bg-purple-500 text-white font-bold text-[10px]">Enterprise Only</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                Connect your booking engine to live PostgreSQL Kashmir hotel, cab, and package tariffs. Upgrade to Enterprise to provision production API keys.
              </p>
            </div>
          </div>
          <Button
            onClick={onOpenUpgradeModal}
            className="rounded-2xl text-xs font-bold gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shrink-0 shadow-lg shadow-purple-500/20"
          >
            <Crown className="w-4 h-4" />
            <span>Upgrade to Enterprise Network</span>
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border/70 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                <Code2 className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Direct B2B XML/REST Inventory Feed</h2>
              <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-xs font-bold">
                Live PostgreSQL Feed ({agencyCode})
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground max-w-xl">
              Live wholesale tariffs pulled directly from PostgreSQL Hotel, Cab, and Package tables.
            </p>
          </div>
        </div>
      )}

      {/* API Key Strip */}
      <Card className="rounded-3xl border border-border/70 p-6 bg-card space-y-4">
        <CardTitle className="text-sm font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" />
            <span>Persisted Production B2B Key</span>
          </div>
          <span className="text-xs text-muted-foreground font-normal">
            Bearer JWT or Enterprise Key
          </span>
        </CardTitle>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 bg-muted/60 p-3 rounded-2xl border border-border/60 font-mono text-xs flex items-center justify-between overflow-x-auto text-foreground">
            <span className="truncate">
              {apiKey || (isEnterprise ? 'No key provisioned yet — click Generate Key' : 'Requires Enterprise plan')}
            </span>
          </div>

          <Button
            variant="outline"
            onClick={handleCopyKey}
            disabled={!apiKey}
            className="rounded-xl text-xs font-semibold gap-1.5 h-11 px-4 shrink-0"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy Key'}</span>
          </Button>

          <Button
            variant="ghost"
            onClick={handleRegenerateKey}
            disabled={regenerating}
            className="rounded-xl text-xs font-medium gap-1.5 h-11 text-muted-foreground hover:text-foreground shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
            <span>{apiKey ? 'Regenerate' : 'Generate Key'}</span>
          </Button>
        </div>
      </Card>

      {/* Live Endpoint Preview */}
      <Card className="rounded-3xl border border-border/70 p-6 bg-card space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
          <div>
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              Live Database Feed Inspector
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Queries `/api/agents/api-feed` directly against live PostgreSQL inventory.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/50 text-xs">
              <button
                onClick={() => setFormat('json')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  format === 'json' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                REST (JSON)
              </button>
              <button
                onClick={() => setFormat('xml')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  format === 'xml' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                OTA (XML)
              </button>
            </div>
            <Button size="icon" variant="outline" onClick={loadFeed} disabled={loading} className="rounded-xl h-8 w-8">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'hotels' as const, label: 'Hotels & Houseboats', icon: Building },
            { id: 'cabs' as const, label: 'Fleet & Transfers', icon: Car },
            { id: 'packages' as const, label: 'Packaged Circuits', icon: Package }
          ].map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveEndpoint(cat.id)}
                className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
                  activeEndpoint === cat.id
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border/60 hover:border-border text-muted-foreground'
                }`}
              >
                <Icon className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="font-bold text-xs">/api/agents/api-feed?category={cat.id}</p>
                  <p className="text-[10px] text-muted-foreground">{cat.label}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="bg-slate-950 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto space-y-2 border border-slate-800">
          <code>
            curl -X GET "{API_BASE_URL}/agents/api-feed?category={activeEndpoint}&format={format}" -H "Authorization: Bearer &lt;YOUR_TOKEN&gt;"
          </code>
        </div>

        {error ? (
          <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 text-xs text-rose-500 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <pre className="bg-slate-950 text-emerald-400 p-4 rounded-2xl font-mono text-xs overflow-x-auto max-h-72 border border-slate-800">
            {loading ? 'Loading live database inventory feed...' : payloadPreview}
          </pre>
        )}
      </Card>
    </div>
  );
};
