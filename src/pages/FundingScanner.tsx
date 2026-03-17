import { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, TrendingDown, RefreshCw, Search, ArrowRight,
  Zap, BarChart3, Activity, Shield, Filter, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const API_URL = 'https://valiant-bot-be-01.fly.dev';

import TokenIcon from '@/components/TokenIcon';

interface FundingOpportunity {
  symbol: string;
  price: number;
  hl_funding: number;
  lighter_funding: number;
  spread_8h: number;
  apr: number;
  long_exchange: string;
  short_exchange: string;
  lighter_volume_24h: number;
  hl_volume_24h: number;
  open_interest: number;
  price_change_24h: number;
  quality: number;
}

interface FundingScannerProps {
  onSelectPair: (symbol: string, longExchange: string, shortExchange: string) => void;
}

function QualityDots({ quality }: { quality: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className={cn(
          'w-2 h-2 rounded-full transition-colors',
          i <= quality ? 'bg-green-400' : 'bg-white/10'
        )} />
      ))}
    </div>
  );
}

function formatVolume(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

function FundingCard({ opp, onSelect }: { opp: FundingOpportunity; onSelect: () => void }) {
  const isPositiveAPR = opp.apr > 0;
  const longIsHL = opp.long_exchange === 'hyperliquid';

  return (
    <Card className="group relative overflow-hidden bg-black/40 border-white/10 hover:border-green-500/40 transition-all duration-300 cursor-pointer hover:scale-[1.02]"
          onClick={onSelect}>
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <CardContent className="p-5 relative z-10">
        {/* Header: Symbol + Quality */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <TokenIcon symbol={opp.symbol} size={40} />
            <div>
              <div className="text-white font-bold text-lg">{opp.symbol}</div>
              <div className="text-white/40 text-xs">
                ${opp.price > 1000 ? opp.price.toLocaleString(undefined, {maximumFractionDigits: 2}) 
                  : opp.price > 1 ? opp.price.toFixed(2) 
                  : opp.price.toFixed(6)}
                {' · '}
                <span className="text-white/30">HL</span> + <span className="text-white/30">Lighter</span>
              </div>
            </div>
          </div>
          <QualityDots quality={opp.quality} />
        </div>

        {/* APR */}
        <div className={cn(
          'text-3xl font-bold mb-1',
          isPositiveAPR ? 'text-green-400' : 'text-red-400'
        )}>
          {isPositiveAPR ? '+' : ''}{opp.apr.toFixed(1)}%
          <span className="text-sm font-normal text-white/40 ml-1">APR</span>
        </div>

        {/* Funding rates */}
        <div className="flex items-center gap-3 mb-4 text-xs">
          <span className={cn('px-2 py-0.5 rounded-full', opp.hl_funding >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400')}>
            HL {opp.hl_funding >= 0 ? '+' : ''}{opp.hl_funding.toFixed(4)}%
          </span>
          <span className={cn('px-2 py-0.5 rounded-full', opp.lighter_funding >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400')}>
            LT {opp.lighter_funding >= 0 ? '+' : ''}{opp.lighter_funding.toFixed(4)}%
          </span>
        </div>

        {/* Metrics bars */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/40">Spread</span>
            <div className="flex-1 mx-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-green-400 rounded-full" style={{width: `${Math.min(opp.spread_8h * 1000, 100)}%`}} />
            </div>
            <span className="text-white/60">{opp.spread_8h > 0.001 ? 'High' : opp.spread_8h > 0.0003 ? 'Med' : 'Low'}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/40">Volume</span>
            <div className="flex-1 mx-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-blue-400 rounded-full" style={{width: `${Math.min(opp.lighter_volume_24h / 5000000 * 100, 100)}%`}} />
            </div>
            <span className="text-white/60">{opp.lighter_volume_24h > 1000000 ? 'High' : opp.lighter_volume_24h > 100000 ? 'Med' : 'Low'}</span>
          </div>
        </div>

        {/* Strategy */}
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-center">
            <div className="text-white/40 text-[10px] uppercase">
              {longIsHL ? 'Hyperliquid' : 'Lighter'}
            </div>
            <div className="text-green-400 text-sm font-semibold">Long</div>
          </div>
          <div className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-center">
            <div className="text-white/40 text-[10px] uppercase">
              {longIsHL ? 'Lighter' : 'Hyperliquid'}
            </div>
            <div className="text-red-400 text-sm font-semibold">Short</div>
          </div>
        </div>

        {/* Volume */}
        <div className="mt-3 text-xs text-white/30">
          Volume {formatVolume(opp.lighter_volume_24h + opp.hl_volume_24h)}
        </div>
      </CardContent>
    </Card>
  );
}

export default function FundingScanner({ onSelectPair }: FundingScannerProps) {
  const [opportunities, setOpportunities] = useState<FundingOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'apr' | 'volume' | 'spread'>('apr');
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/funding-scan`, { signal: AbortSignal.timeout(15000) });
      if (res.ok) {
        const json = await res.json();
        setOpportunities(json.data || []);
        setLastUpdate(new Date().toLocaleTimeString());
      } else {
        setError('Failed to fetch funding data');
      }
    } catch (e: any) {
      setError(e.message || 'Network error');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, [fetchData]);

  const filtered = opportunities
    .filter(o => !searchTerm || o.symbol.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'apr') return b.apr - a.apr;
      if (sortBy === 'volume') return (b.lighter_volume_24h + b.hl_volume_24h) - (a.lighter_volume_24h + a.hl_volume_24h);
      return b.spread_8h - a.spread_8h;
    });

  const bestAPR = opportunities.length > 0 ? opportunities.reduce((a, b) => a.apr > b.apr ? a : b) : null;
  const totalMarkets = opportunities.length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-black/40 border border-white/10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-white/60">
            <Activity className="w-4 h-4 text-green-400" />
            <span className="text-sm">Scanning</span>
            <span className="text-white font-bold text-lg">{totalMarkets}</span>
            <span className="text-sm">markets</span>
          </div>
          
          {bestAPR && (
            <div className="flex items-center gap-2 text-white/60">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm">Best APR:</span>
              <span className="text-green-400 font-bold">{bestAPR.symbol} +{bestAPR.apr.toFixed(1)}%</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {lastUpdate && <span className="text-white/30 text-xs">Updated {lastUpdate}</span>}
          <Button variant="ghost" size="sm" onClick={fetchData} disabled={loading}
            className="text-white/60 hover:text-white h-8">
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Search + Sort */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input 
            placeholder="Search markets..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white h-9"
          />
        </div>
        <div className="flex items-center gap-1">
          {(['apr', 'volume', 'spread'] as const).map(s => (
            <Button key={s} variant="ghost" size="sm"
              className={cn('h-8 px-3 text-xs capitalize', sortBy === s ? 'bg-white/10 text-white' : 'text-white/40')}
              onClick={() => setSortBy(s)}>
              {s === 'apr' ? 'APR' : s === 'volume' ? 'Volume' : 'Spread'}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      {/* Cards Grid */}
      {loading && opportunities.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(opp => (
            <FundingCard 
              key={opp.symbol} 
              opp={opp} 
              onSelect={() => onSelectPair(opp.symbol, opp.long_exchange, opp.short_exchange)} 
            />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-white/40">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No funding opportunities found</p>
        </div>
      )}
    </div>
  );
}
