import { Shield, AlertTriangle, TrendingDown, Pause, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RiskData {
  equity: number;
  available_balance: number;
  total_margin_used: number;
  margin_usage_pct: number;
  open_positions: number;
  daily_pnl: number;
  peak_equity: number;
  current_drawdown_pct: number;
  consecutive_ai_failures: number;
  is_safe_mode: boolean;
  daily_trade_count: number;
  stop_until?: string | null;
}

interface AIRiskPanelProps {
  riskData: RiskData | null;
  config: Record<string, any>;
}

function ProgressBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const isWarning = pct > 75;
  const isDanger = pct > 90;

  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-white/40">{label}</span>
        <span className={cn(isDanger ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-white/60')}>
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AIRiskPanel({ riskData, config }: AIRiskPanelProps) {
  if (!riskData) {
    return (
      <div className="text-center py-8 text-white/20 text-sm">
        No risk data available yet
      </div>
    );
  }

  const maxMargin = (config.max_margin_usage || 0.9) * 100;
  const maxPositions = config.max_positions || 3;
  const dailyLossLimit = config.daily_loss_limit_usd || 50;

  return (
    <div className="space-y-4">
      {/* Safe Mode / Pause Alerts */}
      {riskData.is_safe_mode && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertTriangle size={16} className="text-red-400" />
          <div>
            <div className="text-sm font-medium text-red-400">SAFE MODE ACTIVE</div>
            <div className="text-xs text-red-400/60">
              {riskData.consecutive_ai_failures} consecutive AI failures. Only close/hold actions allowed.
            </div>
          </div>
        </div>
      )}

      {riskData.stop_until && (
        <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <Pause size={16} className="text-yellow-400" />
          <div>
            <div className="text-sm font-medium text-yellow-400">TRADING PAUSED</div>
            <div className="text-xs text-yellow-400/60">Until {riskData.stop_until}</div>
          </div>
        </div>
      )}

      {/* Account Overview */}
      <Card className="bg-white/[0.02] border-white/[0.06]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
            <Activity size={14} /> Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] text-white/40">Equity</div>
              <div className="text-sm font-mono text-white/90">${riskData.equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            <div>
              <div className="text-[10px] text-white/40">Available</div>
              <div className="text-sm font-mono text-white/90">${riskData.available_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            <div>
              <div className="text-[10px] text-white/40">Peak Equity</div>
              <div className="text-sm font-mono text-white/90">${riskData.peak_equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Gauges */}
      <Card className="bg-white/[0.02] border-white/[0.06]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
            <Shield size={14} /> Risk Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProgressBar
            value={riskData.margin_usage_pct * 100}
            max={maxMargin}
            color={riskData.margin_usage_pct > 0.8 ? 'bg-red-500' : riskData.margin_usage_pct > 0.6 ? 'bg-yellow-500' : 'bg-emerald-500'}
            label={`Margin Usage (limit: ${maxMargin.toFixed(0)}%)`}
          />

          <ProgressBar
            value={riskData.open_positions}
            max={maxPositions}
            color={riskData.open_positions >= maxPositions ? 'bg-red-500' : 'bg-emerald-500'}
            label={`Positions: ${riskData.open_positions}/${maxPositions}`}
          />

          <ProgressBar
            value={Math.abs(riskData.daily_pnl)}
            max={dailyLossLimit}
            color={riskData.daily_pnl < 0 ? 'bg-red-500' : 'bg-emerald-500'}
            label={`Daily P&L: $${riskData.daily_pnl >= 0 ? '+' : ''}${riskData.daily_pnl.toFixed(2)} (limit: -$${dailyLossLimit})`}
          />

          <ProgressBar
            value={riskData.current_drawdown_pct * 100}
            max={(config.drawdown_threshold || 0.4) * 100}
            color={riskData.current_drawdown_pct > 0.3 ? 'bg-red-500' : riskData.current_drawdown_pct > 0.15 ? 'bg-yellow-500' : 'bg-emerald-500'}
            label={`Drawdown from Peak: ${(riskData.current_drawdown_pct * 100).toFixed(1)}%`}
          />
        </CardContent>
      </Card>

      {/* Daily Stats */}
      <Card className="bg-white/[0.02] border-white/[0.06]">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-[10px] text-white/40">Daily Trades</div>
              <div className="text-lg font-mono text-white/80">{riskData.daily_trade_count}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-white/40">AI Failures</div>
              <div className={cn("text-lg font-mono", riskData.consecutive_ai_failures > 0 ? "text-red-400" : "text-white/80")}>
                {riskData.consecutive_ai_failures}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-white/40">Margin Used</div>
              <div className="text-lg font-mono text-white/80">${riskData.total_margin_used.toLocaleString(undefined, { minimumFractionDigits: 0 })}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
