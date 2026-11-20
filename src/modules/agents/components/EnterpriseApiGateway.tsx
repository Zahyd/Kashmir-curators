import React, { useState } from 'react';
import { 
  Code2, 
  Key, 
  Copy, 
  Check, 
  Sparkles, 
  Crown, 
  Terminal, 
  Layers, 
  FileCode, 
  RefreshCw, 
  ExternalLink,
  ShieldAlert,
  Building,
  Car,
  Package
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface EnterpriseApiGatewayProps {
  isEnterprise: boolean;
  onOpenUpgradeModal: () => void;
  agencyCode?: string;
}

export const EnterpriseApiGateway: React.FC<EnterpriseApiGatewayProps> = ({
  isEnterprise = false,
  onOpenUpgradeModal,
  agencyCode = 'KCB2B-ALPHA'
}) => {
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('b2b_api_key') || `kcb2b_live_${agencyCode.toLowerCase()}_98f419c82`;
  });
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<'JSON' | 'XML'>('JSON');
  const [activeEndpoint, setActiveEndpoint] = useState<'hotels' | 'cabs' | 'packages'>('hotels');
  const [isTesting, setIsTesting] = useState(false);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    toast.success('B2B API Key copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateKey = () => {
    if (!isEnterprise) {
      onOpenUpgradeModal();
      return;
    }
    const newKey = `kcb2b_live_${agencyCode.toLowerCase()}_${Math.random().toString(36).substring(2, 11)}`;
    setApiKey(newKey);
    localStorage.setItem('b2b_api_key', newKey);
    toast.success('B2B API Key Regenerated. Update your production connections.');
  };

  const sampleHotelJson = {
    status: 'success',
    timestamp: new Date().toISOString(),
    currency: 'INR',
    tier: 'WHOLESALE_NET_B2B',
    inventoryCount: 3,
    hotels: [
      {
        id: 'KC-HTL-GUL01',
        name: 'The Highland Chalet & Alpine Spa',
        location: 'Gulmarg Gondola Base',
        b2bNetRate: 18500,
        retailMrp: 26000,
        availableRooms: 4,
        amenities: ['Central Heating 24/7', 'Ski Locker', 'Gondola Priority Desk'],
        season: 'Winter Ski Season'
      },
      {
        id: 'KC-HTL-NIG02',
        name: 'Nigeen Lake Royal Cedar Houseboat',
        location: 'Nigeen Lake (Quiet Corridor), Srinagar',
        b2bNetRate: 6500,
        retailMrp: 9800,
        availableRooms: 6,
        amenities: ['Bukhari Wood Heating', 'Shikara Crossings Included', 'Kahwa on Arrival'],
        season: 'Year-Round Luxury'
      }
    ]
  };

  const sampleHotelXml = `<?xml version="1.0" encoding="UTF-8"?>
<KashmirCuratorsB2BFeed version="2.0" timestamp="${new Date().toISOString()}">
  <Header>
    <AgencyCode>${agencyCode}</AgencyCode>
    <RateType>WHOLESALE_NET_CONTRACT</RateType>
    <Currency>INR</Currency>
  </Header>
  <Inventory category="HOTELS">
    <Property id="KC-HTL-GUL01" name="The Highland Chalet &amp; Alpine Spa" location="Gulmarg">
      <NetRate currency="INR">18500</NetRate>
      <RetailMrp currency="INR">26000</RetailMrp>
      <AvailableRooms>4</AvailableRooms>
      <HeatingType>Central Radiator 24/7</HeatingType>
    </Property>
    <Property id="KC-HTL-NIG02" name="Nigeen Lake Royal Cedar Houseboat" location="Srinagar">
      <NetRate currency="INR">6500</NetRate>
      <RetailMrp currency="INR">9800</RetailMrp>
      <AvailableRooms>6</AvailableRooms>
      <HeatingType>Traditional Bukhari &amp; Heated Mattresses</HeatingType>
    </Property>
  </Inventory>
</KashmirCuratorsB2BFeed>`;

  const sampleCabJson = {
    status: 'success',
    vehicleCategory: 'COMMERCIAL_TOURIST_FLEET',
    fleet: [
      {
        class: 'INNOVA_CRYSTA',
        driverUnion: 'J&K Taxi Union Srinagar #104',
        mountainSpec: 'Snow Chains Equipped',
        paxCapacity: 6,
        luggageCapacity: 4,
        airportTransferNetRate: 2850,
        dailyChauffeurNetRate: 4500
      },
      {
        class: 'FORTUNER_4X4',
        driverUnion: 'Gulmarg Mountain Chauffeur Union',
        mountainSpec: '4x4 Low-Gear AWD + Snow Chains',
        paxCapacity: 6,
        luggageCapacity: 4,
        airportTransferNetRate: 5500,
        dailyChauffeurNetRate: 8500
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Enterprise Gate Banner */}
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
                Direct machine-to-machine inventory feed connecting your OTA website, custom booking engine, or agency ERP directly to live Kashmir 5-star hotel allotments and commercial 4x4 cab dispatches.
              </p>
            </div>
          </div>
          <Button
            onClick={onOpenUpgradeModal}
            className="rounded-2xl text-xs font-bold gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shrink-0 shadow-lg shadow-purple-500/20"
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
                Live & Active
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground max-w-xl">
              Distribute real-time Kashmir inventory with live wholesale net tariffs directly to your agency portal or ERP via REST JSON or OTA XML.
            </p>
          </div>
        </div>
      )}

      {/* API Key Management Strip */}
      <Card className="rounded-3xl border border-border/70 p-6 bg-card space-y-4">
        <CardTitle className="text-sm font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" />
            <span>Live Production B2B API Key</span>
          </div>
          <span className="text-xs text-muted-foreground font-normal">
            Bearer authentication required on all endpoint calls
          </span>
        </CardTitle>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 bg-muted/60 p-3 rounded-2xl border border-border/60 font-mono text-xs flex items-center justify-between overflow-x-auto text-foreground">
            <span className="truncate">{apiKey}</span>
          </div>

          <Button
            variant="outline"
            onClick={handleCopyKey}
            className="rounded-xl text-xs font-semibold gap-1.5 h-11 px-4 shrink-0"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy Key'}</span>
          </Button>

          <Button
            variant="ghost"
            onClick={handleRegenerateKey}
            className="rounded-xl text-xs font-medium gap-1.5 h-11 text-muted-foreground hover:text-foreground shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerate</span>
          </Button>
        </div>
      </Card>

      {/* Interactive API Explorer & Endpoint Catalog */}
      <Card className="rounded-3xl border border-border/70 p-6 bg-card space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
          <div>
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              API Feed Endpoints & Live Responses
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select an endpoint to inspect request headers and preview output formats.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-muted/60 p-1 rounded-xl border border-border/50 text-xs">
            <button
              onClick={() => setFormat('JSON')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                format === 'JSON' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              REST (JSON)
            </button>
            <button
              onClick={() => setFormat('XML')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                format === 'XML' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              OTA (XML)
            </button>
          </div>
        </div>

        {/* Endpoint Selector Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setActiveEndpoint('hotels')}
            className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
              activeEndpoint === 'hotels'
                ? 'border-primary bg-primary/5 text-foreground'
                : 'border-border/60 hover:border-border text-muted-foreground'
            }`}
          >
            <Building className="w-4 h-4 text-primary shrink-0" />
            <div>
              <p className="font-bold text-xs">/api/b2b/inventory/hotels</p>
              <p className="text-[10px] text-muted-foreground">5-Star Resorts & Houseboats</p>
            </div>
          </button>

          <button
            onClick={() => setActiveEndpoint('cabs')}
            className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
              activeEndpoint === 'cabs'
                ? 'border-primary bg-primary/5 text-foreground'
                : 'border-border/60 hover:border-border text-muted-foreground'
            }`}
          >
            <Car className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <p className="font-bold text-xs">/api/b2b/inventory/cabs</p>
              <p className="text-[10px] text-muted-foreground">4x4 Mountain Fleet & Transfers</p>
            </div>
          </button>

          <button
            onClick={() => setActiveEndpoint('packages')}
            className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
              activeEndpoint === 'packages'
                ? 'border-primary bg-primary/5 text-foreground'
                : 'border-border/60 hover:border-border text-muted-foreground'
            }`}
          >
            <Package className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <p className="font-bold text-xs">/api/b2b/inventory/packages</p>
              <p className="text-[10px] text-muted-foreground">Wholesale Packaged Circuits</p>
            </div>
          </button>
        </div>

        {/* cURL Snippet */}
        <div className="bg-slate-950 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto space-y-2 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-[10px] border-b border-slate-800 pb-2">
            <span>HTTP GET REQUEST</span>
            <span>Content-Type: {format === 'JSON' ? 'application/json' : 'application/xml'}</span>
          </div>
          <code>
            curl -X GET "https://kashmir-curators.vercel.app/api/b2b/inventory/{activeEndpoint}?format={format.toLowerCase()}" \<br />
            &nbsp;&nbsp;-H "Authorization: Bearer {apiKey}" \<br />
            &nbsp;&nbsp;-H "Accept: {format === 'JSON' ? 'application/json' : 'application/xml'}"
          </code>
        </div>

        {/* Response Payload Viewer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold">Live Response Payload ({format}):</span>
            <span className="text-[11px] text-emerald-500 font-medium">Status: 200 OK</span>
          </div>

          <pre className="bg-slate-950 text-emerald-400 p-4 rounded-2xl font-mono text-xs overflow-x-auto max-h-72 border border-slate-800">
            {format === 'XML' 
              ? sampleHotelXml 
              : activeEndpoint === 'cabs' 
                ? JSON.stringify(sampleCabJson, null, 2) 
                : JSON.stringify(sampleHotelJson, null, 2)}
          </pre>
        </div>
      </Card>
    </div>
  );
};
