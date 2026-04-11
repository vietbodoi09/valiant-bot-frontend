import { useState, useEffect } from 'react';
import { Settings2, Zap, Shield, TrendingUp, Loader2, DollarSign, Brain, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const API_URL = 'https://valiant-bot-be-01.fly.dev';

interface Preset {
  id: string;
  name: string;
  description: string;
  estimated_daily_cost?: number;
  config?: Record<string, any>;
}

interface AIStrategyConfigProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
  disabled?: boolean;
}

const AI_MODELS = [
  { id: 'claude-sonnet', name: 'Claude Sonnet', cost: '$6/1M tokens' },
  { id: 'claude-haiku', name: 'Claude Haiku', cost: '$1/1M tokens' },
  { id: 'claude-opus', name: 'Claude Opus', cost: '$30/1M tokens' },
  { id: 'gpt-4o', name: 'GPT-4o', cost: '$5/1M tokens' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', cost: '$0.3/1M tokens' },
  { id: 'deepseek-chat', name: 'DeepSeek Chat', cost: '$0.5/1M tokens' },
  { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', cost: '$2/1M tokens' },
];

const TRADING_MODES = [
  { id: 'conservative', label: 'Conservative', icon: Shield, color: 'text-blue-400', desc: 'Multi-confirm, low leverage' },
  { id: 'aggressive', label: 'Aggressive', icon: Zap, color: 'text-orange-400', desc: 'Trend breakouts, higher risk' },
  { id: 'scalping', label: 'Scalping', icon: TrendingUp, color: 'text-purple-400', desc: 'Quick in/out, tight stops' },
];

const COIN_SOURCES = [
  { id: 'static', label: 'Static List' },
  { id: 'oi_top', label: 'Top OI Coins' },
  { id: 'funding_top', label: 'Top Funding' },
  { id: 'mixed', label: 'Mixed (All)' },
];

export default function AIStrategyConfig({ config, onChange, disabled }: AIStrategyConfigProps) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    setLoadingPresets(true);
    try {
      const res = await fetch(`${API_URL}/api/autotrade/presets`);
      const data = await res.json();
      setPresets(data.presets || []);
    } catch (e) {
      console.error('Failed to load presets:', e);
    }
    setLoadingPresets(false);
  };

  const applyPreset = (preset: Preset) => {
    if (preset.config) {
      onChange({ ...config, ...preset.config, preset_id: preset.id });
    }
  };

  const update = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Strategy Presets */}
      <Card className="bg-white/[0.02] border-white/[0.06]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
            <BarChart3 size={14} /> Strategy Presets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPresets ? (
            <div className="flex items-center gap-2 text-white/40 text-sm"><Loader2 className="animate-spin" size={14} /> Loading...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {presets.map(p => (
                <button key={p.id} onClick={() => applyPreset(p)} disabled={disabled}
                  className={cn(
                    "text-left p-3 rounded-lg border transition-all",
                    config.preset_id === p.id
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}>
                  <div className="text-xs font-medium text-white/90">{p.name}</div>
                  <div className="text-[10px] text-white/40 mt-0.5">{p.description}</div>
                  {p.estimated_daily_cost != null && (
                    <div className="text-[10px] text-emerald-400/70 mt-1">~${p.estimated_daily_cost}/day AI cost</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trading Mode */}
      <Card className="bg-white/[0.02] border-white/[0.06]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-white/70">Trading Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {TRADING_MODES.map(mode => {
              const Icon = mode.icon;
              return (
                <button key={mode.id} onClick={() => update('trading_mode', mode.id)} disabled={disabled}
                  className={cn(
                    "p-3 rounded-lg border text-center transition-all",
                    config.trading_mode === mode.id
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/10",
                    disabled && "opacity-50"
                  )}>
                  <Icon size={16} className={cn("mx-auto mb-1", mode.color)} />
                  <div className="text-xs font-medium text-white/80">{mode.label}</div>
                  <div className="text-[10px] text-white/40">{mode.desc}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Model + API Key */}
      <Card className="bg-white/[0.02] border-white/[0.06]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
            <Brain size={14} /> AI Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-white/50">AI Model</Label>
            <select value={config.ai_model || 'claude-sonnet'} onChange={e => update('ai_model', e.target.value)}
              disabled={disabled}
              className="w-full mt-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 focus:border-emerald-500/40 outline-none">
              {AI_MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.cost})</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs text-white/50">AI API Key</Label>
            <Input type="password" placeholder="sk-... or anthropic key"
              value={config.ai_api_key || ''} onChange={e => update('ai_api_key', e.target.value)}
              disabled={disabled}
              className="mt-1 bg-white/[0.04] border-white/[0.08] text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-white/50">Decision Interval (sec)</Label>
              <Input type="number" min={10} max={3600}
                value={config.decision_interval_sec || 60} onChange={e => update('decision_interval_sec', parseInt(e.target.value) || 60)}
                disabled={disabled}
                className="mt-1 bg-white/[0.04] border-white/[0.08] text-sm" />
            </div>
            <div>
              <Label className="text-xs text-white/50">Coin Source</Label>
              <select value={config.coin_source || 'mixed'} onChange={e => update('coin_source', e.target.value)}
                disabled={disabled}
                className="w-full mt-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 outline-none">
                {COIN_SOURCES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>
          {config.coin_source === 'static' && (
            <div>
              <Label className="text-xs text-white/50">Static Coins (comma separated)</Label>
              <Input value={(config.static_coins || []).join(', ')}
                onChange={e => update('static_coins', e.target.value.split(',').map((s: string) => s.trim().toUpperCase()).filter(Boolean))}
                disabled={disabled} placeholder="BTC, ETH, SOL"
                className="mt-1 bg-white/[0.04] border-white/[0.08] text-sm" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk Settings */}
      <Card className="bg-white/[0.02] border-white/[0.06]">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
            <Shield size={14} /> Risk Limits
          </CardTitle>
          <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-[10px] text-emerald-400/60 hover:text-emerald-400">
            {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
          </button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-white/50">Max Positions</Label>
              <Input type="number" min={1} max={20}
                value={config.max_positions || 3} onChange={e => update('max_positions', parseInt(e.target.value) || 3)}
                disabled={disabled} className="mt-1 bg-white/[0.04] border-white/[0.08] text-sm" />
            </div>
            <div>
              <Label className="text-xs text-white/50">Daily Loss Limit ($)</Label>
              <Input type="number" min={5}
                value={config.daily_loss_limit_usd || 50} onChange={e => update('daily_loss_limit_usd', parseFloat(e.target.value) || 50)}
                disabled={disabled} className="mt-1 bg-white/[0.04] border-white/[0.08] text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-white/50">Max Margin Usage (%)</Label>
              <Input type="number" min={10} max={95}
                value={Math.round((config.max_margin_usage || 0.9) * 100)}
                onChange={e => update('max_margin_usage', (parseInt(e.target.value) || 90) / 100)}
                disabled={disabled} className="mt-1 bg-white/[0.04] border-white/[0.08] text-sm" />
            </div>
            <div>
              <Label className="text-xs text-white/50">Min Position Size ($)</Label>
              <Input type="number" min={5}
                value={config.min_position_size_usd || 12} onChange={e => update('min_position_size_usd', parseFloat(e.target.value) || 12)}
                disabled={disabled} className="mt-1 bg-white/[0.04] border-white/[0.08] text-sm" />
            </div>
          </div>

          {showAdvanced && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-white/50">Drawdown Threshold (%)</Label>
                  <Input type="number" min={10} max={80}
                    value={Math.round((config.drawdown_threshold || 0.4) * 100)}
                    onChange={e => update('drawdown_threshold', (parseInt(e.target.value) || 40) / 100)}
                    disabled={disabled} className="mt-1 bg-white/[0.04] border-white/[0.08] text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-white/50">Profit Trailing Trigger (%)</Label>
                  <Input type="number" min={1} max={50}
                    value={Math.round((config.profit_trailing_trigger || 0.05) * 100)}
                    onChange={e => update('profit_trailing_trigger', (parseInt(e.target.value) || 5) / 100)}
                    disabled={disabled} className="mt-1 bg-white/[0.04] border-white/[0.08] text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-white/50">BTC/ETH Max Value Ratio (x equity)</Label>
                  <Input type="number" min={1} max={10} step={0.5}
                    value={config.max_position_value_ratio_btc_eth || 5}
                    onChange={e => update('max_position_value_ratio_btc_eth', parseFloat(e.target.value) || 5)}
                    disabled={disabled} className="mt-1 bg-white/[0.04] border-white/[0.08] text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-white/50">Altcoin Max Value Ratio (x equity)</Label>
                  <Input type="number" min={0.5} max={5} step={0.5}
                    value={config.max_position_value_ratio_alt || 1}
                    onChange={e => update('max_position_value_ratio_alt', parseFloat(e.target.value) || 1)}
                    disabled={disabled} className="mt-1 bg-white/[0.04] border-white/[0.08] text-sm" />
                </div>
              </div>
            </>
          )}

          {/* Feature Toggles */}
          <div className="flex flex-wrap gap-2 pt-2">
            {[
              { key: 'enable_hedge_mode', label: 'Delta-Neutral Hedge' },
              { key: 'enable_funding_arb', label: 'Funding Arbitrage' },
              { key: 'enable_grid_mode', label: 'Grid Trading' },
              { key: 'enable_pipeline_mode', label: 'Multi-Agent Pipeline' },
              { key: 'dry_run', label: 'Dry Run (Paper)' },
            ].map(toggle => (
              <button key={toggle.key} onClick={() => update(toggle.key, !config[toggle.key])} disabled={disabled}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                  config[toggle.key]
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                    : "bg-white/[0.02] border-white/[0.06] text-white/40",
                  disabled && "opacity-50"
                )}>
                {toggle.label}
              </button>
            ))}
          </div>

          {/* Pipeline sub-options */}
          {config.enable_pipeline_mode && (
            <div className="pt-2 pl-2 border-l-2 border-purple-500/20 space-y-2">
              <p className="text-[10px] text-purple-400/60 font-medium uppercase tracking-wider">Pipeline Agents</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'enable_pattern_agent', label: 'Pattern Agent (Vision)' },
                  { key: 'enable_trend_agent', label: 'Trend Agent (Vision)' },
                ].map(toggle => (
                  <button key={toggle.key} onClick={() => update(toggle.key, config[toggle.key] === false ? true : !(config[toggle.key] ?? true))} disabled={disabled}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      (config[toggle.key] ?? true)
                        ? "bg-purple-500/15 border-purple-500/30 text-purple-400"
                        : "bg-white/[0.02] border-white/[0.06] text-white/40",
                      disabled && "opacity-50"
                    )}>
                    {toggle.label}
                  </button>
                ))}
              </div>
              <div>
                <Label className="text-xs text-white/50">Vision Model Override (optional)</Label>
                <select value={config.pipeline_vision_model || ''} onChange={e => update('pipeline_vision_model', e.target.value || null)}
                  disabled={disabled}
                  className="w-full mt-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 outline-none">
                  <option value="">Same as main model</option>
                  {AI_MODELS.filter(m => ['claude-sonnet', 'claude-haiku', 'claude-opus', 'gpt-4o', 'gpt-4o-mini'].includes(m.id)).map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.cost})</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Prompt */}
      <Card className="bg-white/[0.02] border-white/[0.06]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-white/70">Custom AI Instructions (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea value={config.custom_prompt || ''} onChange={e => update('custom_prompt', e.target.value)}
            disabled={disabled} placeholder="Add custom instructions for the AI trader..."
            rows={3}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/20 resize-none outline-none focus:border-emerald-500/40" />
        </CardContent>
      </Card>
    </div>
  );
}
