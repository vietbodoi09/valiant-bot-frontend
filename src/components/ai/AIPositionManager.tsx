import { TrendingUp, TrendingDown, DollarSign, Target, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AIPosition {
  symbol: string;
  side: string;
  size_usd: number;
  entry_price: number;
  mark_price: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
  peak_pnl_pct: number;
  leverage: number;
  exchange: string;
  ai_confidence?: number;
  ai_reasoning?: string;
}

interface AIPositionManagerProps {
  positions: AIPosition[];
}

export default function AIPositionManager({ positions }: AIPositionManagerProps) {
  if (!positions || positions.length === 0) {
    return (
      <div className="text-center py-8 text-white/20 text-sm">
        No open positions
      </div>
    );
  }

  const totalPnl = positions.reduce((s, p) => s + p.unrealized_pnl, 0);
  const totalValue = positions.reduce((s, p) => s + p.size_usd, 0);

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center justify-between px-1">
        <div className="text-xs text-white/40">
          {positions.length} position{positions.length !== 1 ? 's' : ''} | Total: ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}
        </div>
        <div className={cn("text-sm font-mono font-medium", totalPnl >= 0 ? "text-emerald-400" : "text-red-400")}>
          ${totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}
        </div>
      </div>

      {/* Position Cards */}
      {positions.map((pos, idx) => (
        <Card key={`${pos.symbol}-${pos.side}-${idx}`} className="bg-white/[0.02] border-white/[0.06]">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {pos.side === 'long' ? (
                  <TrendingUp size={14} className="text-green-400" />
                ) : (
                  <TrendingDown size={14} className="text-red-400" />
                )}
                <span className="text-sm font-medium text-white/90">{pos.symbol}</span>
                <Badge className={cn(
                  "text-[10px] px-1.5 border",
                  pos.side === 'long'
                    ? "text-green-400 bg-green-500/10 border-green-500/20"
                    : "text-red-400 bg-red-500/10 border-red-500/20"
                )}>
                  {pos.side.toUpperCase()} {pos.leverage}x
                </Badge>
                <Badge className="text-[10px] px-1.5 border border-white/10 bg-white/[0.03] text-white/40">
                  {pos.exchange}
                </Badge>
              </div>
              <div className={cn("text-sm font-mono font-medium", pos.unrealized_pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                ${pos.unrealized_pnl >= 0 ? '+' : ''}{pos.unrealized_pnl.toFixed(2)}
                <span className="text-[10px] ml-1">({pos.unrealized_pnl_pct >= 0 ? '+' : ''}{pos.unrealized_pnl_pct.toFixed(2)}%)</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 text-xs">
              <div>
                <div className="text-[10px] text-white/30">Size</div>
                <div className="font-mono text-white/60">${pos.size_usd.toLocaleString(undefined, { minimumFractionDigits: 0 })}</div>
              </div>
              <div>
                <div className="text-[10px] text-white/30">Entry</div>
                <div className="font-mono text-white/60">${pos.entry_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div className="text-[10px] text-white/30">Mark</div>
                <div className="font-mono text-white/60">${pos.mark_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div className="text-[10px] text-white/30">Peak P&L</div>
                <div className={cn("font-mono", pos.peak_pnl_pct >= 0 ? "text-emerald-400/70" : "text-red-400/70")}>
                  {pos.peak_pnl_pct >= 0 ? '+' : ''}{pos.peak_pnl_pct.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* AI Reasoning */}
            {pos.ai_confidence != null && (
              <div className="mt-2 pt-2 border-t border-white/[0.04] flex items-start gap-2">
                <Zap size={10} className="text-yellow-400/60 mt-0.5 flex-shrink-0" />
                <div className="text-[10px] text-white/40">
                  <span className="text-yellow-400/60">AI {(pos.ai_confidence * 100).toFixed(0)}%</span>
                  {pos.ai_reasoning && <span className="ml-1">— {pos.ai_reasoning}</span>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
