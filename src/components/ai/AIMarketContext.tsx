import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MarketCandidate {
  symbol: string;
  price: number;
  funding_rate_hl: number;
  funding_rate_lighter?: number;
  open_interest?: number;
  oi_change_pct?: number;
  oi_interpretation?: string;
  volume_24h?: number;
  price_change_24h_pct?: number;
  indicators?: Record<string, any>;
}

interface AIMarketContextProps {
  candidates: MarketCandidate[];
}

const OI_COLORS: Record<string, string> = {
  'new_longs_opening': 'text-green-400',
  'new_shorts_opening': 'text-red-400',
  'shorts_covering': 'text-yellow-400',
  'longs_liquidating': 'text-orange-400',
};

export default function AIMarketContext({ candidates }: AIMarketContextProps) {
  if (!candidates || candidates.length === 0) {
    return (
      <div className="text-center py-8 text-white/20 text-sm">
        No market data available yet. Data will appear after the first AI cycle.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {candidates.map(coin => (
        <Card key={coin.symbol} className="bg-white/[0.02] border-white/[0.06]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white/90 flex items-center gap-2">
                {coin.symbol}
                <span className="text-white/40 font-mono text-xs">${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </CardTitle>
              {coin.price_change_24h_pct != null && (
                <Badge className={cn(
                  "text-[10px] px-2 border",
                  coin.price_change_24h_pct >= 0
                    ? "text-green-400 bg-green-500/10 border-green-500/20"
                    : "text-red-400 bg-red-500/10 border-red-500/20"
                )}>
                  {coin.price_change_24h_pct >= 0 ? '+' : ''}{coin.price_change_24h_pct.toFixed(1)}%
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Funding Rates */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-white/40">HL Funding:</span>
                <span className={cn("font-mono", coin.funding_rate_hl >= 0 ? "text-green-400/80" : "text-red-400/80")}>
                  {coin.funding_rate_hl >= 0 ? '+' : ''}{coin.funding_rate_hl.toFixed(4)}%
                </span>
              </div>
              {coin.funding_rate_lighter != null && (
                <div className="flex items-center gap-1">
                  <span className="text-white/40">Lighter:</span>
                  <span className={cn("font-mono", coin.funding_rate_lighter >= 0 ? "text-green-400/80" : "text-red-400/80")}>
                    {coin.funding_rate_lighter >= 0 ? '+' : ''}{coin.funding_rate_lighter.toFixed(4)}%
                  </span>
                </div>
              )}
              {coin.funding_rate_lighter != null && (
                <div className="flex items-center gap-1">
                  <span className="text-white/40">Spread:</span>
                  <span className="font-mono text-cyan-400/80">
                    {Math.abs(coin.funding_rate_hl - coin.funding_rate_lighter).toFixed(4)}%
                  </span>
                </div>
              )}
            </div>

            {/* OI + Volume */}
            <div className="flex items-center gap-4 text-xs">
              {coin.open_interest != null && (
                <div className="flex items-center gap-1">
                  <BarChart3 size={10} className="text-white/30" />
                  <span className="text-white/40">OI:</span>
                  <span className="font-mono text-white/60">${(coin.open_interest / 1e6).toFixed(1)}M</span>
                  {coin.oi_change_pct != null && (
                    <span className={cn("font-mono", coin.oi_change_pct >= 0 ? "text-green-400/60" : "text-red-400/60")}>
                      ({coin.oi_change_pct >= 0 ? '+' : ''}{coin.oi_change_pct.toFixed(1)}%)
                    </span>
                  )}
                </div>
              )}
              {coin.oi_interpretation && (
                <Badge className={cn(
                  "text-[9px] px-1.5 border border-white/10 bg-white/[0.03]",
                  OI_COLORS[coin.oi_interpretation] || "text-white/40"
                )}>
                  {coin.oi_interpretation.replace(/_/g, ' ')}
                </Badge>
              )}
              {coin.volume_24h != null && (
                <div className="flex items-center gap-1">
                  <DollarSign size={10} className="text-white/30" />
                  <span className="text-white/40">Vol:</span>
                  <span className="font-mono text-white/60">${(coin.volume_24h / 1e6).toFixed(1)}M</span>
                </div>
              )}
            </div>

            {/* Indicators per timeframe */}
            {coin.indicators && Object.entries(coin.indicators).map(([tf, ind]: [string, any]) => (
              <div key={tf} className="flex flex-wrap items-center gap-2 text-[10px]">
                <span className="text-white/30 font-medium w-8">{tf}</span>
                {ind.ema_9 != null && ind.ema_21 != null && (
                  <span className={cn(
                    "px-1.5 py-0.5 rounded",
                    ind.ema_9 > ind.ema_21 ? "bg-green-500/10 text-green-400/70" : "bg-red-500/10 text-red-400/70"
                  )}>
                    EMA {ind.ema_9 > ind.ema_21 ? 'Bullish' : 'Bearish'}
                  </span>
                )}
                {ind.rsi != null && (
                  <span className={cn(
                    "px-1.5 py-0.5 rounded",
                    ind.rsi > 70 ? "bg-red-500/10 text-red-400/70" :
                    ind.rsi < 30 ? "bg-green-500/10 text-green-400/70" :
                    "bg-white/[0.04] text-white/40"
                  )}>
                    RSI {ind.rsi.toFixed(0)}
                  </span>
                )}
                {ind.macd != null && ind.macd_signal != null && (
                  <span className={cn(
                    "px-1.5 py-0.5 rounded",
                    ind.macd > ind.macd_signal ? "bg-green-500/10 text-green-400/70" : "bg-red-500/10 text-red-400/70"
                  )}>
                    MACD {ind.macd > ind.macd_signal ? '+' : '-'}
                  </span>
                )}
                {ind.atr != null && (
                  <span className="px-1.5 py-0.5 rounded bg-white/[0.04] text-white/40">
                    ATR {ind.atr.toFixed(2)}
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
