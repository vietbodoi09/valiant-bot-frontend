import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Play, Pause, Key, Activity, RefreshCw, 
  TrendingUp, Server, Copy,
  BarChart3, DollarSign, Shield, Zap, Loader2,
  Wallet, Clock, Target, Radio, TrendingDown,
  ArrowUpRight, ArrowDownRight, Circle, AlertCircle,
  CheckCircle2, XCircle, Terminal, Settings2, Eye, EyeOff,
  LogOut, Info, ExternalLink, RotateCcw
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const API_URL = 'https://valiant-bot-be-01.fly.dev';

interface Position {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entry_price: number;
  mark_price: number;
  pnl: number;
  pnl_percent: number;
  exchange: string;
  liquidation_price?: number;
  leverage?: number;
}

interface Stats {
  total_trades: number;
  total_volume: number;
  total_pnl: number;
  start_time?: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

function useWebSocketManager() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageQueueRef = useRef<any[]>([]);
  const isConnectingRef = useRef(false);

  const connect = useCallback((sessionId: string, onMessage: (data: any) => void, onStatusChange: (status: 'connected' | 'connecting' | 'disconnected') => void) => {
    if (isConnectingRef.current) return;
    if (wsRef.current) wsRef.current.close(1000, 'Reconnecting');
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

    isConnectingRef.current = true;
    onStatusChange('connecting');

    const wsUrl = API_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    const ws = new WebSocket(`${wsUrl}/ws/${sessionId}`);
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      isConnectingRef.current = false;
      onStatusChange('connected');
      while (messageQueueRef.current.length > 0) {
        ws.send(JSON.stringify(messageQueueRef.current.shift()));
      }
    };

    ws.onmessage = (e) => {
      try { onMessage(JSON.parse(e.data)); } catch (err) { console.error('WS parse error:', err); }
    };

    ws.onclose = (e) => {
      isConnectingRef.current = false;
      onStatusChange('disconnected');
      if (e.code !== 1000 && e.code !== 1001) {
        reconnectTimeoutRef.current = setTimeout(() => connect(sessionId, onMessage, onStatusChange), 2000);
      }
    };

    ws.onerror = () => { isConnectingRef.current = false; };
    wsRef.current = ws;
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) { clearTimeout(reconnectTimeoutRef.current); reconnectTimeoutRef.current = null; }
    if (wsRef.current) { wsRef.current.close(1000, 'Manual disconnect'); wsRef.current = null; }
    isConnectingRef.current = false;
  }, []);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify(data));
    else messageQueueRef.current.push(data);
  }, []);

  return { connect, disconnect, send };
}

function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 2, className }: { 
  value: number; prefix?: string; suffix?: string; decimals?: number; className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const start = prevValueRef.current, end = value, duration = 300, startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime, progress = Math.min(elapsed / duration, 1);
      setDisplayValue(start + (end - start) * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    prevValueRef.current = value;
  }, [value]);

  return <span className={className}>{prefix}{displayValue.toFixed(decimals)}{suffix ? ' ' + suffix : ''}</span>;
}

function PositionCard({ position }: { position: Position }) {
  const isLong = position.side === 'long';
  const isProfit = position.pnl >= 0;
  const exchangeColor = position.exchange === 'hyperliquid' 
    ? 'from-blue-500/20 to-blue-600/10 border-blue-500/30' 
    : 'from-purple-500/20 to-purple-600/10 border-purple-500/30';
  const exchangeIcon = position.exchange === 'hyperliquid' ? 'HL' : 'LT';
  const exchangeName = position.exchange === 'hyperliquid' ? 'Hyperliquid' : 'Lighter';

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 transition-all duration-300 hover:scale-[1.02]', exchangeColor)}>
      <div className={cn('absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-30',
        position.exchange === 'hyperliquid' ? 'bg-blue-500' : 'bg-purple-500')} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold',
              position.exchange === 'hyperliquid' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400')}>
              {exchangeIcon}
            </div>
            <div>
              <div className="text-white font-semibold">{position.symbol}</div>
              <div className="text-white/50 text-xs">{exchangeName}</div>
            </div>
          </div>
          <Badge variant={isLong ? 'default' : 'destructive'}
            className={cn(isLong ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30')}>
            {isLong ? 'LONG' : 'SHORT'}
          </Badge>
        </div>
        <div className="mb-4">
          <div className={cn('text-3xl font-bold flex items-center gap-2', isProfit ? 'text-green-400' : 'text-red-400')}>
            {isProfit ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
            {isProfit ? '+' : ''}${position.pnl.toFixed(2)}
          </div>
          <div className={cn('text-sm font-medium', isProfit ? 'text-green-400/70' : 'text-red-400/70')}>
            {isProfit ? '+' : ''}{position.pnl_percent.toFixed(2)}%
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-black/30 rounded-lg p-2.5">
            <div className="text-white/40 text-xs mb-1">Size</div>
            <div className="text-white font-medium">{position.size.toFixed(6)} BTC</div>
          </div>
          <div className="bg-black/30 rounded-lg p-2.5">
            <div className="text-white/40 text-xs mb-1">Entry Price</div>
            <div className="text-white font-medium">${position.entry_price.toLocaleString()}</div>
          </div>
          <div className="bg-black/30 rounded-lg p-2.5">
            <div className="text-white/40 text-xs mb-1">Mark Price</div>
            <div className="text-white font-medium">${position.mark_price.toLocaleString()}</div>
          </div>
          {position.liquidation_price && (
            <div className="bg-black/30 rounded-lg p-2.5">
              <div className="text-white/40 text-xs mb-1">Liq. Price</div>
              <div className="text-orange-400 font-medium">${position.liquidation_price.toLocaleString()}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, prefix = '', suffix = '', trend, trendValue, color = 'orange' }: { 
  icon: any; label: string; value: number; prefix?: string; suffix?: string; 
  trend?: 'up' | 'down' | 'neutral'; trendValue?: string; color?: 'orange' | 'green' | 'blue' | 'purple';
}) {
  const colorClasses = {
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/20',
    green: 'from-green-500/20 to-green-600/10 border-green-500/20',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/20',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/20',
  };

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 transition-all duration-300 hover:scale-[1.02]', colorClasses[color])}>
      <div className={cn('absolute -top-10 -right-10 w-20 h-20 rounded-full blur-2xl opacity-30',
        color === 'orange' && 'bg-orange-500', color === 'green' && 'bg-green-500',
        color === 'blue' && 'bg-blue-500', color === 'purple' && 'bg-purple-500')} />
      <div className="relative z-10">
        <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
          <Icon className="w-4 h-4" /> {label}
        </div>
        <div className="text-2xl font-bold text-white">
          <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
        </div>
        {trend && trendValue && (
          <div className={cn('text-xs mt-1 flex items-center gap-1',
            trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-white/50')}>
            {trend === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3" />}
            {trendValue}
          </div>
        )}
      </div>
    </div>
  );
}

function LiveLog({ logs }: { logs: LogEntry[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [wasAtBottom, setWasAtBottom] = useState(true);

  const checkScrollPosition = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setWasAtBottom(scrollHeight - scrollTop - clientHeight < 50);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !isAutoScroll) return;
    if (wasAtBottom || isAutoScroll) {
      containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [logs, isAutoScroll, wasAtBottom]);

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />;
      case 'error': return <XCircle className="w-3.5 h-3.5 text-red-400" />;
      case 'warning': return <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />;
      default: return <Circle className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-400/90';
      case 'error': return 'text-red-400/90';
      case 'warning': return 'text-yellow-400/90';
      default: return 'text-blue-400/90';
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-white/60">
          <Terminal className="w-4 h-4" />
          <span className="text-sm font-medium">Live Logs</span>
          <Badge variant="outline" className="text-xs border-white/10 text-white/40">{logs.length}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsAutoScroll(!isAutoScroll)}
          className={cn('h-7 px-2 text-xs', isAutoScroll ? 'text-green-400' : 'text-white/40')}>
          {isAutoScroll ? <Radio className="w-3 h-3 mr-1 animate-pulse" /> : <Circle className="w-3 h-3 mr-1" />}
          Auto-scroll
        </Button>
      </div>
      <div ref={containerRef} onScroll={checkScrollPosition}
        className="h-80 overflow-y-auto rounded-xl bg-black/60 border border-white/5 p-4 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/30">
            <div className="text-center">
              <Server className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Waiting for logs...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {logs.map((log) => (
              <div key={log.id} className={cn('flex items-start gap-2 py-1 px-2 rounded hover:bg-white/5 transition-colors', getLogColor(log.type))}>
                <span className="mt-0.5 flex-shrink-0">{getLogIcon(log.type)}</span>
                <span className="text-white/40 flex-shrink-0">{log.timestamp}</span>
                <span className="break-all">{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {!wasAtBottom && (
        <Button variant="secondary" size="sm"
          onClick={() => containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' })}
          className="absolute bottom-4 right-4 h-8 text-xs bg-orange-500/90 hover:bg-orange-500">
          Scroll to bottom
        </Button>
      )}
    </div>
  );
}

interface BotDashboardProps {
  onLogout: () => void;
  authToken?: string | null;
  keyName?: string;
}

export default function BotDashboard({ onLogout, authToken: _authToken, keyName: _keyName }: BotDashboardProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [loading, setLoading] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [stats, setStats] = useState<Stats>({ total_trades: 0, total_volume: 0, total_pnl: 0 });
  const [balances, setBalances] = useState({ hyperliquid: 0, lighter: 0 });
  const [initialLoading, setInitialLoading] = useState(true);
  const [backendReady, setBackendReady] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const { connect, disconnect, send } = useWebSocketManager();

  const [apiKeys, setApiKeys] = useState(() => {
    const saved = localStorage.getItem('valiant_api_keys');
    if (saved) { try { return JSON.parse(saved); } catch (e) {} }
    return { valiant_agent_key: '', valiant_master_address: '', lighter_api_key: '', lighter_account_index: '0', lighter_api_key_index: '2' };
  });

  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('valiant_config');
    if (saved) { try { return JSON.parse(saved); } catch (e) {} }
    return { mode: 'hedge', symbol: 'BTC', size_usd: 150, leverage: 10, hedge_hold_hours: 8, auto_reenter: true, spam_rounds: 10, spam_interval: 10, cycles: 1 };
  });

  useEffect(() => { localStorage.setItem('valiant_api_keys', JSON.stringify(apiKeys)); }, [apiKeys]);
  useEffect(() => { localStorage.setItem('valiant_config', JSON.stringify(config)); }, [config]);

  const parseLogType = (message: string): 'info' | 'success' | 'error' | 'warning' => {
    const lower = message.toLowerCase();
    if (lower.includes('error') || lower.includes('failed') || lower.includes('❌')) return 'error';
    if (lower.includes('success') || lower.includes('✅') || lower.includes('filled')) return 'success';
    if (lower.includes('warning') || lower.includes('⚠️') || lower.includes('caution')) return 'warning';
    return 'info';
  };

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const type = parseLogType(message);
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setLogs(prev => { const newLogs = [...prev, { id, timestamp, message, type }]; return newLogs.slice(-500); });
  }, []);

  const handleWebSocketMessage = useCallback((msg: any) => {
    switch (msg.type) {
      case 'log':
        if (Array.isArray(msg.data)) msg.data.forEach((log: string) => addLog(log));
        else addLog(msg.data);
        break;
      case 'state':
        setIsRunning(msg.data.is_running);
        if (msg.data.stats) setStats(msg.data.stats);
        break;
      case 'position':
        if (msg.data.position) {
          setPositions(prev => {
            const filtered = prev.filter(p => p.exchange !== msg.data.exchange);
            const newPosition: Position = {
              ...msg.data.position, exchange: msg.data.exchange,
              pnl_percent: msg.data.position.entry_price 
                ? ((msg.data.position.mark_price - msg.data.position.entry_price) / msg.data.position.entry_price * 100) * (msg.data.position.side === 'long' ? 1 : -1)
                : 0
            };
            return [...filtered, newPosition];
          });
        } else {
          setPositions(prev => prev.filter(p => p.exchange !== msg.data.exchange));
        }
        break;
      case 'stats': if (msg.data) setStats(msg.data); break;
      case 'balances': if (msg.data) setBalances(msg.data); break;
      case 'ping': send({ type: 'pong' }); break;
    }
  }, [addLog, send]);

  useEffect(() => {
    const checkBackend = async () => {
      const startTime = Date.now();
      try {
        const res = await fetch(`${API_URL}/health`, { method: 'GET', signal: AbortSignal.timeout(10000) });
        setBackendReady(res.ok);
      } catch (e) { setBackendReady(false); }
      finally {
        const elapsed = Date.now() - startTime;
        const minDelay = 1500;
        if (elapsed < minDelay) setTimeout(() => setInitialLoading(false), minDelay - elapsed);
        else setInitialLoading(false);
      }
    };
    checkBackend();
  }, []);

  useEffect(() => { return () => { disconnect(); }; }, [disconnect]);

  useEffect(() => {
    if (!backendReady || initialLoading) return;
    const savedSession = localStorage.getItem('valiant_session_id');
    if (savedSession) {
      addLog('Found saved session, reconnecting...');
      setSessionId(savedSession);
      setTimeout(() => connect(savedSession, handleWebSocketMessage, setWsStatus), 500);
    }
<<<<<<< HEAD
  }, [backendReady, initialLoading]);

  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const connectWS = (sid: string) => {
    if (wsRef.current) wsRef.current.close();
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    
    setWsStatus('connecting');
    addLog('Connecting to live feed...');
    
    const wsUrl = API_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    const ws = new WebSocket(`${wsUrl}/ws/${sid}`);
    
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
=======
  }, [backendReady, initialLoading, connect, handleWebSocketMessage, addLog]);
>>>>>>> 63e8f6bb28f058b549e617930a98c176fd2e5fc1

  const handleStart = async () => {
    setLoading(true);
    disconnect();
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
            lighter_api_key_index: parseInt(apiKeys.lighter_api_key_index) || 2,
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
        setTimeout(() => connect(data.session_id, handleWebSocketMessage, setWsStatus), 800);
      } else {
        addLog(`Error: ${data.detail || 'Failed to start'}`);
      }
    } catch (e: any) { addLog(`Error: ${e.message}`); }
    setLoading(false);
  };

  const handleStop = async () => {
    if (!sessionId || isStopping) return;
    setIsStopping(true);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/stop/${sessionId}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
<<<<<<< HEAD
        if (data.status === 'already_stopping') {
          addLog('Stop already in progress...');
        } else {
          addLog('Bot stopped successfully');
        }
      } else if (res.status === 404) {
        // Session not found = server restarted, bot already gone
        addLog('Session expired (server restarted). Cleaning up...');
      } else {
        addLog('Stop request failed');
      }
      // Always reset state regardless of response
=======
        if (data.status === 'already_stopping') addLog('Stop already in progress...');
        else addLog('Bot stopped successfully');
      } else if (res.status === 404) addLog('Session expired (server restarted). Cleaning up...');
      else addLog('Stop request failed');
>>>>>>> 63e8f6bb28f058b549e617930a98c176fd2e5fc1
      setIsRunning(false);
      setPositions([]);
    } catch (e: any) {
      addLog(`Stop error: ${e.message}`);
<<<<<<< HEAD
      // Still reset state on error
=======
>>>>>>> 63e8f6bb28f058b549e617930a98c176fd2e5fc1
      setIsRunning(false);
      setPositions([]);
    }
    disconnect();
    setWsStatus('disconnected');
    setIsStopping(false);
    localStorage.removeItem('valiant_session_id');
    setSessionId(null);
    setLoading(false);
  };

  const copySession = () => {
    if (sessionId) { navigator.clipboard.writeText(sessionId); addLog('Session ID copied to clipboard'); }
  };

  const netPnl = useMemo(() => positions.reduce((acc, p) => acc + (p?.pnl || 0), 0), [positions]);
  const totalBalance = useMemo(() => balances.hyperliquid + balances.lighter, [balances]);

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0d0d0d] to-[#0a0a0a] flex items-center justify-center">
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <div className="relative w-28 h-28 mx-auto mb-8">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 animate-pulse opacity-50 blur-xl" />
            <div className="relative w-28 h-28 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center border border-orange-400/30 shadow-2xl shadow-orange-500/30">
              <Zap className="w-14 h-14 text-white animate-pulse" />
            </div>
            <div className="absolute -inset-3 rounded-3xl border-2 border-orange-500/30 border-t-orange-500 animate-spin" style={{ animationDuration: '2s' }} />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Valiant Bot</h1>
          <div className="flex items-center justify-center gap-2 text-white/60">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Connecting to backend...</span>
          </div>
          <div className="flex items-center justify-center gap-2 mt-8">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!backendReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0d0d0d] to-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/60 backdrop-blur-xl border-white/10">
          <CardContent className="pt-10 pb-10 text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 animate-pulse">
              <Server className="w-12 h-12 text-red-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Backend Offline</h1>
            <p className="text-white/50 mb-8">Unable to connect to the backend server. It may be waking up from sleep.</p>
            <Button onClick={() => window.location.reload()} variant="outline" className="border-white/20 text-white hover:bg-white/10 px-6">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0d0d0d] to-[#0a0a0a]">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-orange-600/5 rounded-full blur-[100px]" />
        </div>

        {/* Status Bar - Only status/session/logout, no duplicate title */}
        <div className="relative border-b border-white/5 bg-black/40 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-end gap-3">
            <Badge variant={wsStatus === 'connected' ? 'default' : 'secondary'} 
              className={cn('px-3 py-1',
                wsStatus === 'connected' && 'bg-green-500/20 text-green-400 border-green-500/30',
                wsStatus === 'connecting' && 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                wsStatus === 'disconnected' && 'bg-gray-500/20 text-gray-400')}>
              <span className={cn('w-2 h-2 rounded-full mr-2', 
                wsStatus === 'connected' ? 'bg-green-400 animate-pulse' : 
                wsStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-gray-400')} />
              {wsStatus === 'connected' ? 'Live' : wsStatus === 'connecting' ? 'Connecting' : 'Offline'}
            </Badge>
            {sessionId && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" onClick={copySession}
                    className="border-white/10 text-white/60 font-mono text-xs cursor-pointer hover:border-orange-500/50 transition-colors">
                    {sessionId} <Copy className="w-3 h-3 ml-2" />
                  </Badge>
                </TooltipTrigger>
                <TooltipContent><p>Click to copy session ID</p></TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onLogout}
                  className="text-white/40 hover:text-red-400 hover:bg-red-500/10"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Logout</p></TooltipContent>
            </Tooltip>
          </div>
        </div>

        <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard icon={DollarSign} label="Net PnL" value={netPnl} prefix="$" 
              trend={netPnl >= 0 ? 'up' : 'down'} trendValue={netPnl >= 0 ? '+Profitable' : '-Loss'} 
              color={netPnl >= 0 ? 'green' : 'orange'} />
            <StatCard icon={BarChart3} label="Total Trades" value={stats.total_trades || 0} color="blue" />
            <StatCard icon={Activity} label="Volume" value={stats.total_volume || 0} prefix="$" color="purple" />
            <StatCard icon={Shield} label="Status" value={isRunning ? 1 : 0} suffix={isRunning ? 'Active' : 'Idle'} 
              color={isRunning ? 'green' : 'orange'} />
          </div>

          {totalBalance > 0 && (
            <div className="mb-8 p-4 rounded-2xl bg-black/40 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-white/60">
                  <Wallet className="w-4 h-4" />
                  <span className="text-sm">Total Balance</span>
                </div>
                <span className="text-white font-semibold">${totalBalance.toFixed(2)}</span>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-blue-400">Hyperliquid</span>
                    <span className="text-white/60">${balances.hyperliquid.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                      style={{ width: `${totalBalance > 0 ? (balances.hyperliquid / totalBalance) * 100 : 0}%` }} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-purple-400">Lighter</span>
                    <span className="text-white/60">${balances.lighter.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-500"
                      style={{ width: `${totalBalance > 0 ? (balances.lighter / totalBalance) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-black/40 border border-white/10 p-1">
              <TabsTrigger value="overview" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                <Activity className="w-4 h-4 mr-2" /> Overview
              </TabsTrigger>
              <TabsTrigger value="config" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                <Settings2 className="w-4 h-4 mr-2" /> Configuration
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Positions */}
              {positions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-400" /> Active Positions
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {positions.map((pos, i) => <PositionCard key={i} position={pos} />)}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {!isRunning ? (
                  <Button onClick={handleStart} disabled={loading || !apiKeys.valiant_agent_key || !apiKeys.lighter_api_key}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-lg shadow-orange-500/20">
                    {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Play className="w-5 h-5 mr-2" />}
                    {loading ? 'Starting...' : 'Start Bot'}
                  </Button>
                ) : (
                  <Button onClick={handleStop} variant="destructive" disabled={isStopping} className="px-8 py-6 text-lg rounded-xl">
                    {isStopping ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Pause className="w-5 h-5 mr-2" />}
                    {isStopping ? 'Stopping...' : 'Stop Bot'}
                  </Button>
                )}
              </div>

              {/* Live Logs - Always visible */}
              <Card className="bg-black/40 backdrop-blur border-white/5">
                <CardContent className="p-6">
                  <LiveLog logs={logs} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="config" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="bg-black/40 backdrop-blur border-white/5 overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center gap-2 text-base">
                        <Key className="w-4 h-4 text-orange-400" /> API Keys
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setShowKeys(!showKeys)} className="text-white/40 hover:text-white">
                        {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div className="space-y-2">
                      <Label className="text-white/60 text-xs flex items-center gap-1">
                        Valiant Agent Key {!apiKeys.valiant_agent_key && <span className="text-red-400">*</span>}
                      </Label>
                      <Input type={showKeys ? 'text' : 'password'} value={apiKeys.valiant_agent_key}
                        onChange={e => setApiKeys({...apiKeys, valiant_agent_key: e.target.value})}
                        placeholder="0x..." 
                        autoComplete="new-password"
                        data-lpignore="true"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/60 text-xs">Master Address</Label>
                      <Input type={showKeys ? 'text' : 'password'} value={apiKeys.valiant_master_address}
                        onChange={e => setApiKeys({...apiKeys, valiant_master_address: e.target.value})}
                        placeholder="0x..." 
                        autoComplete="new-password"
                        data-lpignore="true"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/60 text-xs flex items-center gap-1">
                        Lighter API Key {!apiKeys.lighter_api_key && <span className="text-red-400">*</span>}
                      </Label>
                      <Input type={showKeys ? 'text' : 'password'} value={apiKeys.lighter_api_key}
                        onChange={e => setApiKeys({...apiKeys, lighter_api_key: e.target.value})}
                        placeholder='{"2": "..."}' 
                        autoComplete="new-password"
                        data-lpignore="true"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-xs" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-white/60 text-xs">Account ID</Label>
                        <Input type="number" value={apiKeys.lighter_account_index}
                          onChange={e => setApiKeys({...apiKeys, lighter_account_index: e.target.value})}
                          className="bg-white/5 border-white/10 text-white" placeholder="e.g., 719083" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/60 text-xs">API Key Index</Label>
                        <Input type="number" value={apiKeys.lighter_api_key_index}
                          onChange={e => setApiKeys({...apiKeys, lighter_api_key_index: e.target.value})}
                          className="bg-white/5 border-white/10 text-white" placeholder="2-254" />
                      </div>
                    </div>

                    {/* Valiant Agent Key Guide - Always Visible */}
                    <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Info className="w-4 h-4 text-orange-400" />
                        <h4 className="text-orange-300 font-medium text-sm">How to Get Your Valiant Agent Key</h4>
                      </div>
                      <ol className="space-y-2 text-xs text-white/70">
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-[10px] font-bold">1</span>
                          <span>Go to <a href="https://app.valiant.fund/" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 underline inline-flex items-center gap-1">app.valiant.fund <ExternalLink className="w-3 h-3" /></a> and connect your wallet</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-[10px] font-bold">2</span>
                          <span>Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">F12</kbd> to open Developer Tools</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-[10px] font-bold">3</span>
                          <span>Go to the <strong>Console</strong> tab</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-[10px] font-bold">4</span>
                          <span>Copy & paste the code below, then press Enter:</span>
                        </li>
                      </ol>
                      <div className="mt-3 p-3 rounded-lg bg-black/60 border border-white/10 overflow-x-auto">
                        <code className="text-[10px] text-green-400 font-mono whitespace-pre">{`const request = indexedDB.open('valiant-agent-keys');
request.onsuccess = async (e) => {
  const db = e.target.result;
  const tx = db.transaction('encryption-keys', 'readonly');
  const store = tx.objectStore('encryption-keys');
  const walletAddress = 'YOUR_WALLET_ADDRESS';
  const getKey = store.get(walletAddress);
  getKey.onsuccess = async () => {
    const cryptoKey = getKey.result;
    const encryptedB64 = localStorage.getItem('valiant:agent:' + walletAddress);
    const encryptedBytes = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));
    const iv = encryptedBytes.slice(0, 12);
    const ciphertext = encryptedBytes.slice(12);
    try {
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv }, cryptoKey, ciphertext
      );
      console.log('KEY:', new TextDecoder().decode(decrypted));
    } catch(err) { console.log('Error:', err); }
  };
};`}</code>
                      </div>
                      <p className="mt-2 text-[10px] text-white/50">
                        Replace <code className="text-orange-400">YOUR_WALLET_ADDRESS</code> with your actual wallet address
                      </p>
                      <div className="mt-3 pt-3 border-t border-orange-500/20">
                        <p className="text-[10px] text-white/50 flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Your keys are stored locally in your browser and never sent to our servers.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 backdrop-blur border-white/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center gap-2 text-base">
                      <Target className="w-4 h-4 text-orange-400" /> Trading Config
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-white/60 text-xs">Mode</Label>
                        <select value={config.mode}
                          onChange={e => setConfig({...config, mode: e.target.value as 'spam' | 'hedge'})}
                          className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm appearance-none cursor-pointer">
                          <option value="hedge" className="bg-black text-white">Hedge (Delta-Neutral)</option>
                          <option value="spam" className="bg-black text-white">Spam (Volume)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/60 text-xs">Symbol</Label>
                        <select value={config.symbol}
                          onChange={e => setConfig({...config, symbol: e.target.value})}
                          className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm appearance-none cursor-pointer">
                          <option value="BTC" className="bg-black text-white">BTC</option>
                          <option value="ETH" className="bg-black text-white">ETH</option>
                          <option value="SOL" className="bg-black text-white">SOL</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-white/60 text-xs">Size (USD)</Label>
                        <Input type="number" value={config.size_usd}
                          onChange={e => setConfig({...config, size_usd: Number(e.target.value)})}
                          className="bg-white/5 border-white/10 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/60 text-xs">Leverage</Label>
                        <Input type="number" value={config.leverage}
                          onChange={e => setConfig({...config, leverage: Number(e.target.value)})}
                          className="bg-white/5 border-white/10 text-white" />
                      </div>
                    </div>
                    {config.mode === 'hedge' && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-white/60 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Hold Time (hours)
                          </Label>
                          <Input type="number" step={0.1} value={config.hedge_hold_hours}
                            onChange={e => setConfig({...config, hedge_hold_hours: Number(e.target.value)})}
                            className="bg-white/5 border-white/10 text-white" />
                        </div>
                        {/* Number of Cycles - Only in Hedge mode */}
                        <div className="space-y-2">
                          <Label className="text-white/60 text-xs flex items-center gap-1">
                            <RotateCcw className="w-3 h-3" /> Number of Cycles
                          </Label>
                          <Input 
                            type="number" 
                            min={1}
                            value={config.cycles || 1}
                            onChange={e => setConfig({...config, cycles: Number(e.target.value)})}
                            className="bg-white/5 border-white/10 text-white" 
                            placeholder="Number of cycles to run"
                          />
                          <p className="text-[10px] text-white/40">Bot will stop after completing this many cycles</p>
                        </div>
                      </>
                    )}
                    {config.mode === 'spam' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-white/60 text-xs">Spam Rounds</Label>
                          <Input type="number" value={config.spam_rounds}
                            onChange={e => setConfig({...config, spam_rounds: Number(e.target.value)})}
                            className="bg-white/5 border-white/10 text-white" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white/60 text-xs">Interval (sec)</Label>
                          <Input type="number" value={config.spam_interval}
                            onChange={e => setConfig({...config, spam_interval: Number(e.target.value)})}
                            className="bg-white/5 border-white/10 text-white" />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                      <input type="checkbox" id="autoReenter" checked={config.auto_reenter}
                        onChange={e => setConfig({...config, auto_reenter: e.target.checked})}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-orange-500" />
                      <Label htmlFor="autoReenter" className="text-white/80 text-sm cursor-pointer flex-1">
                        Auto re-enter after cycle
                      </Label>
                    </div>
                    <Separator className="bg-white/10" />
                    {!isRunning ? (
                      <Button onClick={handleStart} disabled={loading || !apiKeys.valiant_agent_key || !apiKeys.lighter_api_key}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-semibold py-6 rounded-xl shadow-lg shadow-orange-500/20">
                        {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Play className="w-5 h-5 mr-2" />}
                        {loading ? 'Starting...' : 'Start Bot'}
                      </Button>
                    ) : (
                      <Button onClick={handleStop} variant="destructive" disabled={isStopping} className="w-full py-6 rounded-xl">
                        {isStopping ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Pause className="w-5 h-5 mr-2" />}
                        {isStopping ? 'Stopping...' : 'Stop Bot'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </TooltipProvider>
  );
}