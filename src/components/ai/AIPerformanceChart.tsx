import { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const API_URL = 'https://valiant-bot-be-01.fly.dev';

interface PerformanceEntry {
  date: string;
  total_pnl: number;
  realized_pnl: number;
  unrealized_pnl: number;
  trade_count: number;
  win_count: number;
  loss_count: number;
  max_drawdown: number;
  ai_cost_usd: number;
}

interface AIPerformanceChartProps {
  sessionId: string;
}

export default function AIPerformanceChart({ sessionId }: AIPerformanceChartProps) {
  const [data, setData] = useState<PerformanceEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [sessionId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/autotrade/performance/${sessionId}`);
      const json = await res.json();
      setData((json.performance || []).reverse());
    } catch (e) {
      console.error('Failed to load performance:', e);
    }
    setLoading(false);
  };

  // Compute summary stats
  const totalPnl = data.reduce((s, d) => s + d.total_pnl, 0);
  const totalTrades = data.reduce((s, d) => s + d.trade_count, 0);
  const totalWins = data.reduce((s, d) => s + d.win_count, 0);
  const totalLosses = data.reduce((s, d) => s + d.loss_count, 0);
  const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
  const totalAiCost = data.reduce((s, d) => s + d.ai_cost_usd, 0);
  const maxDrawdown = Math.min(...data.map(d => d.max_drawdown), 0);

  // Simple equity curve using cumulative PnL
  const cumulativePnl = data.reduce<number[]>((acc, d) => {
    const prev = acc.length > 0 ? acc[acc.length - 1] : 0;
    acc.push(prev + d.total_pnl);
    return acc;
  }, []);

  const maxPnl = Math.max(...cumulativePnl, 1);
  const minPnl = Math.min(...cumulativePnl, -1);
  const range = maxPnl - minPnl || 1;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardContent className="p-3 text-center">
            <div className="text-[10px] text-white/40">Total P&L</div>
            <div className={cn("text-lg font-mono font-bold", totalPnl >= 0 ? "text-emerald-400" : "text-red-400")}>
              ${totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardContent className="p-3 text-center">
            <div className="text-[10px] text-white/40">Win Rate</div>
            <div className={cn("text-lg font-mono font-bold", winRate >= 50 ? "text-emerald-400" : "text-yellow-400")}>
              {winRate.toFixed(1)}%
            </div>
            <div className="text-[10px] text-white/30">{totalWins}W / {totalLosses}L</div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardContent className="p-3 text-center">
            <div className="text-[10px] text-white/40">Total Trades</div>
            <div className="text-lg font-mono font-bold text-white/80">{totalTrades}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardContent className="p-3 text-center">
            <div className="text-[10px] text-white/40">AI Cost</div>
            <div className="text-lg font-mono font-bold text-white/60">${totalAiCost.toFixed(3)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Equity Curve */}
      <Card className="bg-white/[0.02] border-white/[0.06]">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
            <TrendingUp size={14} /> Equity Curve
          </CardTitle>
          <button onClick={loadData} className="text-white/30 hover:text-white/60">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </CardHeader>
        <CardContent>
          {cumulativePnl.length > 1 ? (
            <div className="relative h-40">
              {/* Zero line */}
              <div className="absolute left-0 right-0 border-t border-dashed border-white/10"
                style={{ top: `${((maxPnl - 0) / range) * 100}%` }} />

              {/* Chart using SVG */}
              <svg viewBox={`0 0 ${cumulativePnl.length - 1} 100`} className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={totalPnl >= 0 ? '#10b981' : '#ef4444'} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={totalPnl >= 0 ? '#10b981' : '#ef4444'} stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Area fill */}
                <path d={
                  `M 0 ${((maxPnl - cumulativePnl[0]) / range) * 100} ` +
                  cumulativePnl.map((v, i) => `L ${i} ${((maxPnl - v) / range) * 100}`).join(' ') +
                  ` L ${cumulativePnl.length - 1} ${((maxPnl - 0) / range) * 100} L 0 ${((maxPnl - 0) / range) * 100} Z`
                } fill="url(#pnlGrad)" />

                {/* Line */}
                <polyline
                  points={cumulativePnl.map((v, i) => `${i},${((maxPnl - v) / range) * 100}`).join(' ')}
                  fill="none"
                  stroke={totalPnl >= 0 ? '#10b981' : '#ef4444'}
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              {/* Labels */}
              <div className="absolute top-0 left-0 text-[9px] text-white/30">${maxPnl.toFixed(2)}</div>
              <div className="absolute bottom-0 left-0 text-[9px] text-white/30">${minPnl.toFixed(2)}</div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-white/20 text-sm">
              Not enough data for chart
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily P&L Table */}
      {data.length > 0 && (
        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
              <BarChart3 size={14} /> Daily Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              <div className="grid grid-cols-5 gap-2 text-[10px] text-white/30 font-medium pb-1 border-b border-white/[0.04]">
                <span>Date</span><span>P&L</span><span>Trades</span><span>Win%</span><span>Drawdown</span>
              </div>
              {data.slice().reverse().map(d => {
                const wr = d.trade_count > 0 ? (d.win_count / d.trade_count) * 100 : 0;
                return (
                  <div key={d.date} className="grid grid-cols-5 gap-2 text-xs py-1 border-b border-white/[0.02]">
                    <span className="text-white/50 font-mono">{d.date}</span>
                    <span className={cn("font-mono", d.total_pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                      ${d.total_pnl >= 0 ? '+' : ''}{d.total_pnl.toFixed(2)}
                    </span>
                    <span className="text-white/60">{d.trade_count}</span>
                    <span className={cn(wr >= 50 ? "text-emerald-400/70" : "text-red-400/70")}>{wr.toFixed(0)}%</span>
                    <span className="text-red-400/50">{(d.max_drawdown * 100).toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
