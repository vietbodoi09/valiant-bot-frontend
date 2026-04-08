import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Square, Brain, Activity, BarChart3, Shield, Eye,
  TrendingUp, Terminal, Settings2, Loader2, Wifi, WifiOff,
  AlertCircle, Key, Wallet, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import AIStrategyConfig from '@/components/ai/AIStrategyConfig';
import AIDecisionLog from '@/components/ai/AIDecisionLog';
import AIRiskPanel from '@/components/ai/AIRiskPanel';
import AIPerformanceChart from '@/components/ai/AIPerformanceChart';
import AIMarketContext from '@/components/ai/AIMarketContext';
import AIPositionManager from '@/components/ai/AIPositionManager';

const API_URL = 'https://valiant-bot-be-01.fly.dev';

interface AutoTradeDashboardProps {
  onLogout?: () => void;
}

export default function AutoTradeDashboard({ onLogout }: AutoTradeDashboardProps) {
  // Auth & session
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [wsStatus, setWsStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

  // API Keys
  const [apiKeys, setApiKeys] = useState({
    valiant_agent_key: '',
    valiant_master_address: '',
    lighter_api_key: '',
    lighter_account_index: 0,
    lighter_api_key_index: 2,
  });
  const [showKeys, setShowKeys] = useState(false);

  // AI Config
  const [config, setConfig] = useState<Record<string, any>>({
    trading_mode: 'conservative',
    max_positions: 3,
    max_margin_usage: 0.9,
    max_position_value_ratio_btc_eth: 5.0,
    max_position_value_ratio_alt: 1.0,
    min_position_size_usd: 12.0,
    daily_loss_limit_usd: 50.0,
    drawdown_threshold: 0.4,
    profit_trailing_trigger: 0.05,
    ai_model: 'claude-sonnet',
    ai_api_key: '',
    decision_interval_sec: 60,
    coin_source: 'mixed',
    static_coins: ['BTC', 'ETH', 'SOL'],
    enable_hedge_mode: true,
    enable_funding_arb: true,
    enable_grid_mode: false,
    dry_run: true,
  });

  // Live data from WebSocket
  const [riskData, setRiskData] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [realtimeDecisions, setRealtimeDecisions] = useState<any[]>([]);
  const [marketCandidates, setMarketCandidates] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('strategy');

  // WebSocket
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Load saved keys from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('valiant_autotrade_keys');
    if (saved) {
      try { setApiKeys(JSON.parse(saved)); } catch {}
    }
    const savedConfig = localStorage.getItem('valiant_autotrade_config');
    if (savedConfig) {
      try { setConfig(prev => ({ ...prev, ...JSON.parse(savedConfig) })); } catch {}
    }

    // Check for active session
    checkActiveSession();
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const checkActiveSession = async () => {
    const wallet = apiKeys.valiant_master_address || '';
    try {
      const res = await fetch(`${API_URL}/api/active-session?wallet=${wallet}`);
      const data = await res.json();
      if (data.session_id) {
        setSessionId(data.session_id);
        setIsRunning(true);
        connectWS(data.session_id);
      }
    } catch {}
  };

  // WebSocket connection
  const connectWS = useCallback((sid: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setWsStatus('connecting');
    const wsUrl = API_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    const ws = new WebSocket(`${wsUrl}/ws/${sid}`);
    wsRef.current = ws;

    ws.onopen = () => setWsStatus('connected');

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleWSMessage(msg);
      } catch {}
    };

    ws.onclose = () => {
      setWsStatus('disconnected');
      // Reconnect if still running
      if (isRunning) {
        reconnectRef.current = setTimeout(() => connectWS(sid), 3000);
      }
    };

    ws.onerror = () => ws.close();
  }, [isRunning]);

  const handleWSMessage = (msg: any) => {
    switch (msg.type) {
      case 'log':
        if (Array.isArray(msg.data)) {
          setLogs(prev => [...prev, ...msg.data].slice(-500));
        }
        break;
      case 'ai_decision':
        setRealtimeDecisions(prev => [msg.data, ...prev].slice(0, 100));
        break;
      case 'ai_risk':
        setRiskData(msg.data);
        break;
      case 'ai_positions':
        setPositions(msg.data || []);
        break;
      case 'ai_market':
        setMarketCandidates(msg.data || []);
        break;
      case 'state':
        if (msg.data) {
          setIsRunning(msg.data.is_running);
        }
        break;
      case 'position':
        // Handle legacy position updates
        break;
    }
  };

  // Start trading
  const handleStart = async () => {
    if (!apiKeys.valiant_agent_key || !apiKeys.valiant_master_address) {
      alert('Please enter your Hyperliquid API keys');
      return;
    }
    if (!config.ai_api_key && !config.dry_run) {
      alert('Please enter an AI API key or enable Dry Run mode');
      return;
    }

    setIsStarting(true);
    // Save keys (not the AI api key for security)
    const keysToSave = { ...apiKeys };
    localStorage.setItem('valiant_autotrade_keys', JSON.stringify(keysToSave));
    const configToSave = { ...config };
    delete configToSave.ai_api_key;
    localStorage.setItem('valiant_autotrade_config', JSON.stringify(configToSave));

    try {
      const token = localStorage.getItem('valiant_jwt_token') || '';
      const res = await fetch(`${API_URL}/api/autotrade/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          api_keys: apiKeys,
          auth_token: token,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to start');
      }

      const data = await res.json();
      setSessionId(data.session_id);
      setIsRunning(true);
      setLogs([]);
      setPositions([]);
      setRiskData(null);
      setRealtimeDecisions([]);
      setActiveTab('logs');
      connectWS(data.session_id);
    } catch (e: any) {
      alert(`Start failed: ${e.message}`);
    }
    setIsStarting(false);
  };

  // Stop trading
  const handleStop = async () => {
    if (!sessionId) return;
    setIsStopping(true);
    try {
      await fetch(`${API_URL}/api/stop/${sessionId}`, { method: 'POST' });
      setIsRunning(false);
    } catch (e: any) {
      alert(`Stop failed: ${e.message}`);
    }
    setIsStopping(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, []);

  return (
    <div className="pt-20 pb-12 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/20 flex items-center justify-center">
            <Brain size={20} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AI Auto-Trade</h1>
            <p className="text-xs text-white/40">Autonomous AI-powered trading on Hyperliquid</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Connection status */}
          {sessionId && (
            <Badge className={cn(
              "text-[10px] px-2 py-1 border",
              wsStatus === 'connected' ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
              wsStatus === 'connecting' ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" :
              "text-red-400 bg-red-500/10 border-red-500/20"
            )}>
              {wsStatus === 'connected' ? <Wifi size={10} className="mr-1" /> : <WifiOff size={10} className="mr-1" />}
              {wsStatus}
            </Badge>
          )}

          {/* Dry run indicator */}
          {config.dry_run && (
            <Badge className="text-[10px] px-2 py-1 border text-orange-400 bg-orange-500/10 border-orange-500/20">
              PAPER MODE
            </Badge>
          )}

          {/* Start/Stop */}
          {isRunning ? (
            <Button onClick={handleStop} disabled={isStopping} variant="destructive" size="sm"
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30">
              {isStopping ? <Loader2 className="animate-spin mr-1" size={14} /> : <Square size={14} className="mr-1" />}
              Stop
            </Button>
          ) : (
            <Button onClick={handleStart} disabled={isStarting} size="sm"
              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30">
              {isStarting ? <Loader2 className="animate-spin mr-1" size={14} /> : <Play size={14} className="mr-1" />}
              Start AI Trading
            </Button>
          )}
        </div>
      </div>

      {/* API Keys Section (collapsible) */}
      <Card className="bg-white/[0.02] border-white/[0.06] mb-4">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => setShowKeys(!showKeys)}>
          <CardTitle className="text-sm font-medium text-white/60 flex items-center justify-between">
            <span className="flex items-center gap-2"><Key size={14} /> Exchange API Keys</span>
            <span className="text-[10px] text-white/30">{showKeys ? 'Hide' : 'Show'}</span>
          </CardTitle>
        </CardHeader>
        {showKeys && (
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-white/50">HL Agent Key</Label>
                <Input type="password" value={apiKeys.valiant_agent_key}
                  onChange={e => setApiKeys(k => ({ ...k, valiant_agent_key: e.target.value }))}
                  disabled={isRunning} placeholder="Agent private key"
                  className="mt-1 bg-white/[0.04] border-white/[0.08] text-sm" />
              </div>
              <div>
                <Label className="text-xs text-white/50">HL Master Address</Label>
                <Input value={apiKeys.valiant_master_address}
                  onChange={e => setApiKeys(k => ({ ...k, valiant_master_address: e.target.value }))}
                  disabled={isRunning} placeholder="0x..."
                  className="mt-1 bg-white/[0.04] border-white/[0.08] text-sm" />
              </div>
              <div>
                <Label className="text-xs text-white/50">Lighter API Key</Label>
                <Input type="password" value={apiKeys.lighter_api_key}
                  onChange={e => setApiKeys(k => ({ ...k, lighter_api_key: e.target.value }))}
                  disabled={isRunning} placeholder="Lighter private key JSON"
                  className="mt-1 bg-white/[0.04] border-white/[0.08] text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-white/50">Account Index</Label>
                  <Input type="number" value={apiKeys.lighter_account_index}
                    onChange={e => setApiKeys(k => ({ ...k, lighter_account_index: parseInt(e.target.value) || 0 }))}
                    disabled={isRunning} className="mt-1 bg-white/[0.04] border-white/[0.08] text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-white/50">API Key Index</Label>
                  <Input type="number" value={apiKeys.lighter_api_key_index}
                    onChange={e => setApiKeys(k => ({ ...k, lighter_api_key_index: parseInt(e.target.value) || 2 }))}
                    disabled={isRunning} className="mt-1 bg-white/[0.04] border-white/[0.08] text-sm" />
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/[0.03] border border-white/[0.06] mb-4 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="strategy" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Settings2 size={12} className="mr-1" /> Strategy
          </TabsTrigger>
          <TabsTrigger value="positions" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <TrendingUp size={12} className="mr-1" /> Positions
          </TabsTrigger>
          <TabsTrigger value="performance" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <BarChart3 size={12} className="mr-1" /> Performance
          </TabsTrigger>
          <TabsTrigger value="decisions" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Brain size={12} className="mr-1" /> Decisions
          </TabsTrigger>
          <TabsTrigger value="risk" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Shield size={12} className="mr-1" /> Risk
          </TabsTrigger>
          <TabsTrigger value="market" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Activity size={12} className="mr-1" /> Market
          </TabsTrigger>
          <TabsTrigger value="logs" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Terminal size={12} className="mr-1" /> Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="strategy">
          <AIStrategyConfig config={config} onChange={setConfig} disabled={isRunning} />
        </TabsContent>

        <TabsContent value="positions">
          <AIPositionManager positions={positions} />
        </TabsContent>

        <TabsContent value="performance">
          {sessionId ? (
            <AIPerformanceChart sessionId={sessionId} />
          ) : (
            <div className="text-center py-8 text-white/20 text-sm">Start a session to see performance</div>
          )}
        </TabsContent>

        <TabsContent value="decisions">
          {sessionId ? (
            <AIDecisionLog sessionId={sessionId} realtimeDecisions={realtimeDecisions} />
          ) : (
            <div className="text-center py-8 text-white/20 text-sm">Start a session to see decisions</div>
          )}
        </TabsContent>

        <TabsContent value="risk">
          <AIRiskPanel riskData={riskData} config={config} />
        </TabsContent>

        <TabsContent value="market">
          <AIMarketContext candidates={marketCandidates} />
        </TabsContent>

        <TabsContent value="logs">
          <Card className="bg-white/[0.02] border-white/[0.06]">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
                <Terminal size={14} /> Live Logs
              </CardTitle>
              <button onClick={() => setLogs([])} className="text-[10px] text-white/30 hover:text-white/50">Clear</button>
            </CardHeader>
            <CardContent>
              <div className="bg-black/30 rounded-lg p-3 h-[500px] overflow-y-auto font-mono text-xs leading-relaxed">
                {logs.length === 0 ? (
                  <div className="text-white/20 text-center py-8">No logs yet. Start the AI trader to see activity.</div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className={cn(
                      "py-0.5",
                      log.includes('ERROR') ? 'text-red-400/80' :
                      log.includes('WARNING') || log.includes('BLOCKED') ? 'text-yellow-400/70' :
                      log.includes('EXECUTED') || log.includes('SUCCESS') ? 'text-emerald-400/70' :
                      log.includes('[AI]') ? 'text-purple-400/70' :
                      'text-white/40'
                    )}>
                      {log}
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
