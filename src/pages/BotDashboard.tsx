import { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Key, Activity, RefreshCw, 
  TrendingUp, Server, 
  Copy, ChevronDown, ChevronUp,
  BarChart3, DollarSign, Shield, Zap, Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const API_URL = 'https://valiant-bot-be-01.fly.dev'; // Backend URL - no wallet required

interface Position {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entry_price: number;
  mark_price: number;
  pnl: number;
  exchange: string;
}

export default function BotDashboard() {
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [loading, setLoading] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [stats, setStats] = useState({ trades: 0, volume: 0, pnl: 0 });
  
  // Initial loading state - wait for backend connection
  const [initialLoading, setInitialLoading] = useState(true);
  const [backendReady, setBackendReady] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  const [apiKeys, setApiKeys] = useState(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem('valiant_api_keys');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved API keys:', e);
      }
    }
    return {
      valiant_agent_key: '',
      valiant_master_address: '',
      lighter_api_key: '',
      lighter_account_index: '0',
    };
  });

  // Save to localStorage when apiKeys change
  useEffect(() => {
    localStorage.setItem('valiant_api_keys', JSON.stringify(apiKeys));
  }, [apiKeys]);
  
  const [config, setConfig] = useState(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem('valiant_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved config:', e);
      }
    }
    return {
      mode: 'hedge' as 'spam' | 'hedge',
      symbol: 'BTC',
      size_usd: 150,
      leverage: 10,
      hedge_hold_hours: 8,
      auto_reenter: true,
      spam_rounds: 10,
      spam_interval: 10,
    };
  });

  // Save to localStorage when config change
  useEffect(() => {
    localStorage.setItem('valiant_config', JSON.stringify(config));
  }, [config]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => {
      const newLogs = [...prev, `[${time}] ${msg}`];
      // Keep only last 50 logs for better performance
      return newLogs.slice(-50);
    });
  };

  // Optimized scroll - only scroll to bottom every 500ms max
  useEffect(() => {
    const timer = setTimeout(() => {
      logsEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }, 100);
    return () => clearTimeout(timer);
  }, [logs]);

  // Check backend connection on mount
  useEffect(() => {
    const checkBackend = async () => {
      const startTime = Date.now();
      
      try {
        const res = await fetch(`${API_URL}/health`, { 
          method: 'GET',
          signal: AbortSignal.timeout(10000)
        });
        if (res.ok) {
          setBackendReady(true);
        } else {
          setBackendReady(false);
        }
      } catch (e) {
        setBackendReady(false);
      } finally {
        // Minimum loading time of 2 seconds for UX
        const elapsed = Date.now() - startTime;
        const minDelay = 2000;
        if (elapsed < minDelay) {
          setTimeout(() => setInitialLoading(false), minDelay - elapsed);
        } else {
          setInitialLoading(false);
        }
      }
    };
    
    checkBackend();
  }, []);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, []);

  // Load saved session and reconnect
  useEffect(() => {
    if (!backendReady || initialLoading) return;
    
    const savedSession = localStorage.getItem('valiant_session_id');
    if (savedSession) {
      addLog('Found saved session, reconnecting...');
      setSessionId(savedSession);
      setTimeout(() => connectWS(savedSession), 500);
    }
  }, [backendReady, initialLoading]);

  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const connectWS = (sid: string) => {
    if (wsRef.current) wsRef.current.close();
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    
    setWsStatus('connecting');
    addLog('Connecting to live feed...');
    
    const ws = new WebSocket(`wss://valiant-bot-backend.onrender.com/ws/${sid}`);
    
    ws.onopen = () => {
      setWsStatus('connected');
      addLog('Live feed connected');
    };
    
    // Batch logs to prevent too many re-renders
    let logBatch: string[] = [];
    let batchTimeout: ReturnType<typeof setTimeout> | null = null;
    
    const flushLogs = () => {
      if (logBatch.length > 0) {
        setLogs(prev => {
          const newLogs = [...prev, ...logBatch];
          // Keep only last 100 logs for performance
          return newLogs.slice(-100);
        });
        logBatch = [];
      }
    };
    
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        
        if (msg.type === 'log') {
          // Handle both array of logs and single log
          const logs = Array.isArray(msg.data) ? msg.data : [msg.data];
          logBatch.push(...logs);
          flushLogs(); // Update immediately for real-time feel
        }
        else if (msg.type === 'state') {
          setIsRunning(msg.data.is_running);
          setStats(msg.data.stats || { trades: 0, volume: 0, pnl: 0 });
        }
        else if (msg.type === 'position') {
          const pos = msg.data.position;
          if (pos) {
            setPositions(prev => {
              const filtered = prev.filter(p => p.exchange !== msg.data.exchange);
              return [...filtered, { ...pos, exchange: msg.data.exchange }];
            });
          }
        }
        else if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    };
    
    ws.onclose = (e) => {
      if (batchTimeout) clearTimeout(batchTimeout);
      flushLogs();
      setWsStatus('disconnected');
      // Only reconnect if bot is still running and not a normal close
      if (isRunning && sid && e.code !== 1000 && e.code !== 1001) {
        addLog('Connection lost, reconnecting...');
        reconnectTimeoutRef.current = setTimeout(() => connectWS(sid), 3000);
      }
    };
    
    ws.onerror = (e) => {
      console.error('WebSocket error:', e);
      setWsStatus('disconnected');
    };
    
    wsRef.current = ws;
  };

  const handleStart = async () => {
    setLoading(true);
    wsRef.current?.close();
    
    try {
      const res = await fetch(`${API_URL}/api/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          api_keys: {
            valiant_agent_key: apiKeys.valiant_agent_key,
            valiant_master_address: apiKeys.valiant_master_address,
            lighter_api_key: apiKeys.lighter_api_key,
            lighter_account_index: parseInt(apiKeys.lighter_account_index) || 0,
          }
        }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.session_id) {
        setSessionId(data.session_id);
        localStorage.setItem('valiant_session_id', data.session_id);
        setIsRunning(true);
        setLogs([]);
        setPositions([]);
        addLog('Bot initialized');
        setTimeout(() => connectWS(data.session_id), 800);
      } else {
        addLog(`Error: ${data.detail || 'Failed to start'}`);
      }
    } catch (e: any) {
      addLog(`Error: ${e.message}`);
    }
    
    setLoading(false);
  };

  const [isStopping, setIsStopping] = useState(false);
  
  const handleStop = async () => {
    if (!sessionId || isStopping) return;
    
    setIsStopping(true);
    setLoading(true);
    
    try {
      // Stop via REST API first
      const res = await fetch(`${API_URL}/api/stop/${sessionId}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'already_stopping') {
          addLog('Stop already in progress...');
        } else {
          addLog('Bot stopped successfully');
          setIsRunning(false);
          setPositions([]);
        }
      } else {
        addLog('Stop request failed');
      }
    } catch (e: any) {
      addLog(`Stop error: ${e.message}`);
    }
    
    // Close WebSocket
    wsRef.current?.close();
    setWsStatus('disconnected');
    setIsStopping(false);
    
    // Clear session from storage
    localStorage.removeItem('valiant_session_id');
    setSessionId(null);
    setLoading(false);
  };

  const copySession = () => {
    if (sessionId) navigator.clipboard.writeText(sessionId);
  };

  // Loading screen - checking backend
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] flex items-center justify-center">
        <div className="text-center animate-in fade-in zoom-in duration-500">
          {/* Animated Logo */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 animate-pulse opacity-50 blur-xl" />
            <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center border border-orange-400/30 shadow-2xl shadow-orange-500/30">
              <Zap className="w-12 h-12 text-white animate-pulse" />
            </div>
            {/* Spinning ring */}
            <div className="absolute -inset-2 rounded-3xl border-2 border-orange-500/30 border-t-orange-500 animate-spin" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-3">Valiant Bot</h1>
          <div className="flex items-center justify-center gap-2 text-white/60">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Connecting to backend...</span>
          </div>
          
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  // Backend not ready
  if (!backendReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 bg-black/40 backdrop-blur-xl border-white/10">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
              <Server className="w-10 h-10 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Backend Offline</h1>
            <p className="text-white/50 mb-6">Unable to connect to the backend server. It may be waking up from sleep.</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const netPnl = positions?.reduce((acc, p) => acc + (p?.pnl || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0d0d0d] to-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Valiant Bot</h1>
              <p className="text-xs text-white/40">Delta-Neutral Arbitrage</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={wsStatus === 'connected' ? 'default' : 'secondary'} 
                   className={cn(
                     wsStatus === 'connected' && 'bg-green-500/20 text-green-400 border-green-500/30',
                     wsStatus === 'connecting' && 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                     wsStatus === 'disconnected' && 'bg-gray-500/20 text-gray-400'
                   )}>
              <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', 
                wsStatus === 'connected' ? 'bg-green-400 animate-pulse' : 
                wsStatus === 'connecting' ? 'bg-yellow-400' : 'bg-gray-400'
              )} />
              {wsStatus === 'connected' ? 'Live' : wsStatus === 'connecting' ? 'Connecting' : 'Offline'}
            </Badge>
            
            {sessionId && (
              <Badge variant="outline" className="border-white/10 text-white/60 font-mono text-xs">
                {sessionId}
                <button onClick={copySession} className="ml-2 hover:text-white">
                  <Copy className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-black/40 backdrop-blur border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-white/40 text-sm mb-1">
                <DollarSign className="w-4 h-4" /> Net PnL
              </div>
              <div className={cn('text-2xl font-bold', netPnl >= 0 ? 'text-green-400' : 'text-red-400')}>
                {netPnl >= 0 ? '+' : ''}${netPnl.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/40 backdrop-blur border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-white/40 text-sm mb-1">
                <BarChart3 className="w-4 h-4" /> Trades
              </div>
              <div className="text-2xl font-bold text-white">{stats?.trades || 0}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/40 backdrop-blur border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-white/40 text-sm mb-1">
                <Activity className="w-4 h-4" /> Volume
              </div>
              <div className="text-2xl font-bold text-white">${(stats?.volume || 0).toFixed(0)}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/40 backdrop-blur border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-white/40 text-sm mb-1">
                <Shield className="w-4 h-4" /> Status
              </div>
              <div className={cn('text-2xl font-bold', isRunning ? 'text-green-400' : 'text-white/60')}>
                {isRunning ? 'Active' : 'Idle'}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* API Keys */}
            <Card className="bg-black/40 backdrop-blur border-white/5 overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2 text-base">
                    <Key className="w-4 h-4 text-orange-400" /> API Keys
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowKeys(!showKeys)} className="text-white/40 hover:text-white">
                    {showKeys ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </CardHeader>
              
              {showKeys && (
                <CardContent className="space-y-4 pt-0">
                  <div className="space-y-2">
                    <Label className="text-white/60 text-xs">Valiant Agent Key</Label>
                    <Input 
                      type="password" 
                      value={apiKeys.valiant_agent_key}
                      onChange={e => setApiKeys({...apiKeys, valiant_agent_key: e.target.value})}
                      placeholder="0x..."
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/60 text-xs">Master Address</Label>
                    <Input 
                      value={apiKeys.valiant_master_address}
                      onChange={e => setApiKeys({...apiKeys, valiant_master_address: e.target.value})}
                      placeholder="0x..."
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/60 text-xs">Lighter API Key</Label>
                    <Input 
                      value={apiKeys.lighter_api_key}
                      onChange={e => setApiKeys({...apiKeys, lighter_api_key: e.target.value})}
                      placeholder='{"2": "..."}'
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/60 text-xs">Account Index</Label>
                    <Input 
                      type="number"
                      value={apiKeys.lighter_account_index}
                      onChange={e => setApiKeys({...apiKeys, lighter_account_index: e.target.value})}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Bot Config */}
            <Card className="bg-black/40 backdrop-blur border-white/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-base">
                  <Activity className="w-4 h-4 text-orange-400" /> Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-white/60 text-xs">Mode</Label>
                    <select 
                      value={config.mode}
                      onChange={e => setConfig({...config, mode: e.target.value as 'spam' | 'hedge'})}
                      className="w-full px-3 py-2 bg-black border border-white/10 rounded-md text-white text-sm appearance-none cursor-pointer relative z-10"
                      style={{backgroundImage: 'none'}}
                    >
                      <option value="hedge" className="bg-black text-white">Hedge</option>
                      <option value="spam" className="bg-black text-white">Spam</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/60 text-xs">Symbol</Label>
                    <select 
                      value={config.symbol}
                      onChange={e => setConfig({...config, symbol: e.target.value})}
                      className="w-full px-3 py-2 bg-black border border-white/10 rounded-md text-white text-sm appearance-none cursor-pointer relative z-10"
                      style={{backgroundImage: 'none'}}
                    >
                      <option value="BTC" className="bg-black text-white">BTC</option>
                      <option value="ETH" className="bg-black text-white">ETH</option>
                      <option value="SOL" className="bg-black text-white">SOL</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-white/60 text-xs">Size (USD)</Label>
                    <Input 
                      type="number"
                      value={config.size_usd}
                      onChange={e => setConfig({...config, size_usd: Number(e.target.value)})}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/60 text-xs">Leverage</Label>
                    <Input 
                      type="number"
                      value={config.leverage}
                      onChange={e => setConfig({...config, leverage: Number(e.target.value)})}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>

                {config.mode === 'hedge' && (
                  <div className="space-y-2">
                    <Label className="text-white/60 text-xs">Hold Time (hours)</Label>
                    <Input 
                      type="number"
                      step={0.1}
                      value={config.hedge_hold_hours}
                      onChange={e => setConfig({...config, hedge_hold_hours: Number(e.target.value)})}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                )}

                {/* Spam mode config - v2 */}
                {config.mode === 'spam' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-white/60 text-xs">Spam Rounds</Label>
                        <Input 
                          type="number"
                          value={config.spam_rounds}
                          onChange={e => setConfig({...config, spam_rounds: Number(e.target.value)})}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/60 text-xs">Interval (seconds)</Label>
                        <Input 
                          type="number"
                          step={1}
                          value={config.spam_interval}
                          onChange={e => setConfig({...config, spam_interval: Number(e.target.value)})}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    id="autoReenter"
                    checked={config.auto_reenter}
                    onChange={e => setConfig({...config, auto_reenter: e.target.checked})}
                    className="rounded border-white/20 bg-white/5"
                  />
                  <Label htmlFor="autoReenter" className="text-white/60 text-xs cursor-pointer">Auto re-enter</Label>
                </div>

                {!isRunning ? (
                  <Button 
                    onClick={handleStart}
                    disabled={loading || !apiKeys.valiant_agent_key || !apiKeys.lighter_api_key}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-semibold"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                    {loading ? 'Starting...' : 'Start Bot'}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleStop}
                    variant="destructive"
                    disabled={isStopping}
                    className="w-full"
                  >
                    {isStopping ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Pause className="w-4 h-4 mr-2" />}
                    {isStopping ? 'Stopping...' : 'Stop Bot'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Positions */}
            {positions?.length > 0 && (
              <Card className="bg-black/40 backdrop-blur border-white/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center gap-2 text-base">
                    <TrendingUp className="w-4 h-4 text-orange-400" /> Active Positions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {positions?.map((pos, i) => {
                      // Safe render with error handling
                      try {
                        return (
                      <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
                              pos?.exchange === 'hyperliquid' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                            )}>
                              {pos?.exchange === 'hyperliquid' ? 'HL' : 'LT'}
                            </div>
                            <span className="text-white font-medium">{pos?.symbol || '-'}</span>
                          </div>
                          <Badge variant={pos?.side === 'long' ? 'default' : 'destructive'}
                                 className={pos?.side === 'long' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                            {pos?.side?.toUpperCase() || '-'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-white/40 text-xs">Size</div>
                            <div className="text-white">{(pos?.size || 0).toFixed(6)}</div>
                          </div>
                          <div>
                            <div className="text-white/40 text-xs">Entry</div>
                            <div className="text-white">${pos?.entry_price?.toLocaleString() || '0'}</div>
                          </div>
                          <div>
                            <div className="text-white/40 text-xs">Mark</div>
                            <div className="text-white">${pos?.mark_price?.toLocaleString() || '0'}</div>
                          </div>
                          <div>
                            <div className="text-white/40 text-xs">PnL</div>
                            <div className={(pos?.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}>
                              {(pos?.pnl || 0) >= 0 ? '+' : ''}${(pos?.pnl || 0).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                        );
                      } catch (e) {
                        console.error('Error rendering position:', e);
                        return <div key={i} className="p-4 text-red-400">Error loading position</div>;
                      }
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Logs */}
            <Card className="bg-black/40 backdrop-blur border-white/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2 text-base">
                    <Server className="w-4 h-4 text-orange-400" /> Live Logs
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setLogs([])} className="text-white/40 hover:text-white h-8">
                    Clear
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-80 overflow-y-auto rounded-lg bg-black/50 p-4 font-mono text-xs border border-white/5" id="log-container">
                  {logs.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-white/30">
                      <div className="text-center">
                        <Server className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Waiting for logs...</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {logs.slice(-30).map((log, i) => (
                        <div key={`${i}-${log.substring(0, 20)}`} className="text-green-400/90 mb-1 hover:bg-white/5 px-1 rounded whitespace-pre-wrap break-words">
                          {log}
                        </div>
                      ))}
                      {logs.length > 30 && (
                        <div className="text-white/30 text-center py-2">... {logs.length - 30} older logs hidden ...</div>
                      )}
                    </>
                  )}
                  <div ref={logsEndRef} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
