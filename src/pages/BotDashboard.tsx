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
  total_fees?: number;
  start_time?: string;
}

interface CycleReport {
  cycle: number;
  entry_time: string;
  exit_time: string;
  hold_minutes: number;
  hl_side: string;
  lighter_side: string;
  size_usd: number;
  leverage: number;
  entry_price: number;
  exit_price: number;
  hl_entry: number;
  lighter_entry: number;
  hl_funding: number;
  lighter_funding: number;
  hl_pnl: number;
  lighter_pnl: number;
  net_pnl: number;
  fee_hl: number;
  close_reason: string;
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

import TokenIcon from '@/components/TokenIcon';

function PositionCard({ position }: { position: Position }) {
  const isLong = position.side === 'long';
  const isProfit = position.pnl >= 0;
  const isPnlPctPositive = position.pnl_percent >= 0;
  const exchangeColor = position.exchange === 'hyperliquid' 
    ? 'from-blue-500/20 to-blue-600/10 border-blue-500/30' 
    : 'from-purple-500/20 to-purple-600/10 border-purple-500/30';
  const exchangeName = position.exchange === 'hyperliquid' ? 'Hyperliquid' : 'Lighter';
  const symbol = position.symbol.replace('-USD', '').replace('-PERP', '');
  
  const formatPrice = (p: number) => {
    if (p >= 1000) return `$${p.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
    if (p >= 1) return `$${p.toFixed(3)}`;
    if (p >= 0.01) return `$${p.toFixed(5)}`;
    return `$${p.toFixed(8)}`;
  };
  
  const formatSize = (s: number) => {
    if (s >= 1000) return s.toFixed(1);
    if (s >= 1) return s.toFixed(3);
    return s.toFixed(6);
  };

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 transition-all duration-300 hover:scale-[1.02]', exchangeColor)}>
      <div className={cn('absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-30',
        position.exchange === 'hyperliquid' ? 'bg-blue-500' : 'bg-purple-500')} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <TokenIcon symbol={symbol} size={40} />
            <div>
              <div className="text-white font-semibold">{symbol}</div>
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
            {isProfit ? '+' : '-'}${Math.abs(position.pnl).toFixed(2)}
          </div>
          <div className={cn('text-sm font-medium', isPnlPctPositive ? 'text-green-400/70' : 'text-red-400/70')}>
            {isPnlPctPositive ? '+' : ''}{position.pnl_percent.toFixed(2)}%
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-black/30 rounded-lg p-2.5">
            <div className="text-white/40 text-xs mb-1">Size</div>
            <div className="text-white font-medium">{formatSize(position.size)} {symbol}</div>
          </div>
          <div className="bg-black/30 rounded-lg p-2.5">
            <div className="text-white/40 text-xs mb-1">Entry Price</div>
            <div className="text-white font-medium">{formatPrice(position.entry_price)}</div>
          </div>
          <div className="bg-black/30 rounded-lg p-2.5">
            <div className="text-white/40 text-xs mb-1">Mark Price</div>
            <div className="text-white font-medium">{formatPrice(position.mark_price)}</div>
          </div>
          {position.liquidation_price && position.liquidation_price > 0 && (
            <div className="bg-black/30 rounded-lg p-2.5">
              <div className="text-white/40 text-xs mb-1">Liq. Price</div>
              <div className="text-orange-400 font-medium">{formatPrice(position.liquidation_price)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, prefix = '', suffix = '', trend, trendValue, color = 'orange' }: { 
  icon: any; label: string; value: number; prefix?: string; suffix?: string; 
  trend?: 'up' | 'down' | 'neutral'; trendValue?: string; color?: 'orange' | 'green' | 'blue' | 'purple' | 'cyan' | 'pink';
}) {
  const colorClasses = {
    orange: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20',
    green: 'from-green-500/20 to-green-600/10 border-green-500/20',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/20',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/20',
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/20',
    pink: 'from-pink-500/20 to-pink-600/10 border-pink-500/20',
  };

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 transition-all duration-300 hover:scale-[1.02]', colorClasses[color])}>
      <div className={cn('absolute -top-10 -right-10 w-20 h-20 rounded-full blur-2xl opacity-30',
        color === 'orange' && 'bg-emerald-500', color === 'green' && 'bg-green-500',
        color === 'blue' && 'bg-blue-500', color === 'purple' && 'bg-purple-500',
        color === 'cyan' && 'bg-cyan-500', color === 'pink' && 'bg-pink-500')} />
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
          className="absolute bottom-4 right-4 h-8 text-xs bg-emerald-500/90 hover:bg-emerald-500">
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
  const [cycleHistory, setCycleHistory] = useState<CycleReport[]>([]);
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

  // Pick up selected pair from FundingScanner
  useEffect(() => {
    const selectedPair = localStorage.getItem('valiant_selected_pair');
    if (selectedPair) {
      try {
        const parsed = JSON.parse(selectedPair);
        if (parsed.symbol) {
          console.log('Applying selected pair:', parsed);
          setConfig(prev => {
            const updated = { ...prev, symbol: parsed.symbol, mode: 'hedge' as const };
            localStorage.setItem('valiant_config', JSON.stringify(updated));
            return updated;
          });
          // Switch to config tab so user sees the change
          setTimeout(() => setActiveTab('config'), 100);
          addLog(`Selected ${parsed.symbol} from Funding Scanner (Long ${parsed.longEx}, Short ${parsed.shortEx})`);
        }
      } catch (e) {
        console.error('Failed to parse selected pair:', e);
      }
      localStorage.removeItem('valiant_selected_pair');
    }
  }, []);

  const parseLogType = (message: string): 'info' | 'success' | 'error' | 'warning' => {
    const lower = message.toLowerCase();
    if (lower.includes('error') || lower.includes('failed') || lower.includes('G��')) return 'error';
    if (lower.includes('success') || lower.includes('G��') || lower.includes('filled')) return 'success';
    if (lower.includes('warning') || lower.includes('G��n+�') || lower.includes('caution')) return 'warning';
    return 'info';
  };

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const type = parseLogType(message);
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setLogs(prev => { const newLogs = [...prev, { id, timestamp, message, type }]; return newLogs.slice(-500); });
    
    // Auto-detect bot stopped from logs
    if (message.includes('Bot STOPPED') || message.includes('Hedge mode completed')) {
      setIsRunning(false);
    }
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
        if (!msg.data.is_running) setPositions([]);  // Clear cards when bot stops
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
      case 'cycle_history': if (msg.data) setCycleHistory(msg.data); break;
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

  const restoreSession = useCallback((sid: string, data: any) => {
    setSessionId(sid);
    setIsRunning(data.is_running || false);
    if (data.stats) setStats(data.stats);
    if (data.balances) setBalances(data.balances);
    if (data.positions) {
      const restored: Position[] = [];
      for (const [exchange, pos] of Object.entries(data.positions)) {
        if (pos && typeof pos === 'object') {
          const p = pos as any;
          restored.push({
            symbol: p.symbol || '', side: p.side || 'long', size: p.size || 0,
            entry_price: p.entry_price || 0, mark_price: p.mark_price || 0,
            pnl: p.pnl || 0, pnl_percent: p.pnl_percent || 0,
            exchange: p.exchange || exchange, leverage: p.leverage || 1,
            liquidation_price: p.liquidation_price || 0,
          });
        }
      }
      if (restored.length > 0) setPositions(restored);
    }
    if (data.logs && Array.isArray(data.logs)) {
      data.logs.forEach((log: string) => addLog(log));
    }
    setTimeout(() => connect(sid, handleWebSocketMessage, setWsStatus), 500);
  }, [connect, handleWebSocketMessage, addLog]);

  useEffect(() => {
    if (!backendReady || initialLoading) return;
    const savedSession = localStorage.getItem('valiant_session_id');
    if (savedSession) {
      fetch(`${API_URL}/api/status/${savedSession}`)
        .then(res => {
          if (res.ok) {
            return res.json().then(data => {
              addLog('Reconnected to existing session');
              restoreSession(savedSession, data);
            });
          } else {
            // Saved session gone — try finding active session for this wallet
            const savedKeys = localStorage.getItem('valiant_api_keys');
            const wallet = savedKeys ? (JSON.parse(savedKeys).valiant_master_address || '') : '';
            return fetch(`${API_URL}/api/active-session?wallet=${encodeURIComponent(wallet)}`)
              .then(r => r.json())
              .then(data => {
                if (data.session_id) {
                  addLog('Found active bot session, reconnecting...');
                  localStorage.setItem('valiant_session_id', data.session_id);
                  restoreSession(data.session_id, data);
                } else {
                  addLog('No active session found');
                  localStorage.removeItem('valiant_session_id');
                }
              });
          }
        })
        .catch(() => {
          localStorage.removeItem('valiant_session_id');
        });
    }
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
          
          // Auto-detect bot stopped from logs
          logs.forEach((log: string) => {
            if (log.includes('Bot STOPPED') || log.includes('Hedge mode completed')) {
              setIsRunning(false);
            }
          });
        }
        else if (msg.type === 'state') {
          setIsRunning(msg.data.is_running);
          setStats(msg.data.stats || { trades: 0, volume: 0, pnl: 0 });
          if (msg.data.cycle_history) setCycleHistory(msg.data.cycle_history);
        }
        else if (msg.type === 'position') {
          const pos = msg.data.position;
          if (pos) {
            setPositions(prev => {
              const filtered = prev.filter(p => p.exchange !== msg.data.exchange);
              return [...filtered, { ...pos, exchange: msg.data.exchange }];
            });
          } else {
            // Position closed — remove card
            setPositions(prev => prev.filter(p => p.exchange !== msg.data.exchange));
          }
        }
        else if (msg.type === 'stats') {
          if (msg.data) setStats(msg.data);
        }
        else if (msg.type === 'balances') {
          if (msg.data) setBalances(msg.data);
        }
        else if (msg.type === 'cycle_history') {
          if (msg.data) setCycleHistory(msg.data);
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
      } else if (res.status === 409) {
        // Bot already running for this wallet — find and reconnect
        addLog('Bot already running! Reconnecting...');
        const activeRes = await fetch(`${API_URL}/api/active-session?wallet=${encodeURIComponent(apiKeys.valiant_master_address || '')}`);
        const activeData = await activeRes.json();
        if (activeData.session_id) {
          setSessionId(activeData.session_id);
          localStorage.setItem('valiant_session_id', activeData.session_id);
          setIsRunning(true);
          if (activeData.logs) activeData.logs.forEach((l: string) => addLog(l));
          setTimeout(() => connect(activeData.session_id, handleWebSocketMessage, setWsStatus), 500);
        } else {
          addLog('Could not find running session');
        }
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
      setIsRunning(false);
      setPositions([]);
    } catch (e: any) {
      addLog(`Stop error: ${e.message}`);
      // Still reset state on error
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
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 animate-pulse opacity-50 blur-xl" />
            <img src="/valbot-logo.png" alt="ValBot" className="relative w-28 h-28 rounded-2xl shadow-2xl shadow-emerald-500/30 border border-emerald-400/30" />
            <div className="absolute -inset-3 rounded-3xl border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" style={{ animationDuration: '2s' }} />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">ValBot</h1>
          <div className="flex items-center justify-center gap-2 text-white/60">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Connecting to backend...</span>
          </div>
          <div className="flex items-center justify-center gap-2 mt-8">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
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
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-600/5 rounded-full blur-[100px]" />
        </div>

        {/* Status Bar */}
        <div className="relative border-b border-white/5 bg-black/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-white/40">
              <span className={cn('w-1.5 h-1.5 rounded-full', 
                wsStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 
                wsStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-white/20')} />
              {wsStatus === 'connected' ? 'Live' : wsStatus === 'connecting' ? 'Connecting...' : 'Offline'}
            </div>
            <div className="flex items-center gap-2">
              {sessionId && (
                <button onClick={copySession}
                  className="flex items-center gap-1.5 text-[10px] text-white/30 font-mono hover:text-white/60 transition-colors">
                  {sessionId} <Copy className="w-3 h-3" />
                </button>
              )}
              <button onClick={onLogout}
                className="text-white/30 hover:text-red-400 transition-colors p-1">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <StatCard icon={DollarSign} label="Session PnL" value={stats.total_pnl || 0} prefix="$" 
              trend={(stats.total_pnl || 0) >= 0 ? 'up' : 'down'} trendValue={(stats.total_pnl || 0) >= 0 ? '+Profit' : '-Loss'} 
              color={(stats.total_pnl || 0) >= 0 ? 'green' : 'orange'} />
            <StatCard icon={BarChart3} label="Total Trades" value={stats.total_trades || 0} color="blue" />
            <StatCard icon={Activity} label="Volume" value={stats.total_volume || 0} prefix="$" color="purple" />
            <StatCard icon={Shield} label="Status" value={isRunning ? 1 : 0} suffix={isRunning ? 'Active' : 'Idle'} 
              color={isRunning ? 'green' : 'orange'} />
            <StatCard icon={Wallet} label="HL Balance" value={balances.hyperliquid || 0} prefix="$" color="cyan" />
            <StatCard icon={Wallet} label="Lighter Balance" value={balances.lighter || 0} prefix="$" color="pink" />
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
              <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                <Activity className="w-4 h-4 mr-2" /> Overview
              </TabsTrigger>
              <TabsTrigger value="config" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                <Settings2 className="w-4 h-4 mr-2" /> Configuration
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Positions */}
              {positions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" /> Active Positions
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {positions.map((pos, i) => <PositionCard key={i} position={pos} />)}
                  </div>
                </div>
              )}

              {/* Affiliate CTA — shows when bot not running */}
              {!isRunning && (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600/20 via-teal-500/20 to-emerald-600/20 border border-emerald-500/30 p-5">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 animate-pulse" />
                  <div className="relative">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-base mb-1">Save 20% on Trading Fees</h3>
                        <p className="text-white/50 text-xs mb-3">
                          ValBot uses limit orders (maker) so your fees are already minimal. 
                          Sign up via our link to get an <span className="text-emerald-400 font-semibold">additional 20% discount</span> — 
                          your effective fee becomes almost zero.
                        </p>
                        <div className="flex items-center gap-3">
                          <a href="https://valiant.trade/trade?af=valbot" target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:translate-y-[-1px] transition-all relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                            <Zap className="w-4 h-4 relative" />
                            <span className="relative">Create Account — 20% Off</span>
                            <ExternalLink className="w-3.5 h-3.5 relative" />
                          </a>
                          <span className="text-[10px] text-white/30">Required for Hyperliquid trading</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {!isRunning ? (
                  <Button onClick={handleStart} disabled={loading || !apiKeys.valiant_agent_key || !apiKeys.lighter_api_key}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-lg shadow-emerald-500/20">
                    {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Play className="w-5 h-5 mr-2" />}
                    {loading ? 'Starting...' : 'Start Bot'}
                  </Button>
                ) : (
                  <Button onClick={handleStop} disabled={isStopping} 
                    className="px-8 py-6 text-lg rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-semibold shadow-lg shadow-red-500/20">
                    {isStopping ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Pause className="w-5 h-5 mr-2" />}
                    {isStopping ? 'Stopping...' : 'Stop Bot'}
                  </Button>
                )}
              </div>

              {/* Keep tab open warning */}
              {isRunning && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-yellow-300 text-xs font-medium">Keep this tab open while bot is running</p>
                    <p className="text-white/30 text-[10px] mt-0.5">Bot runs on our server, but this tab is needed for live updates. You can minimize the tab — don't close it.</p>
                  </div>
                </div>
              )}

              {/* Cycle History */}
              {cycleHistory.length > 0 && (
                <Card className="bg-black/40 backdrop-blur border-white/5">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-medium text-white">Cycle History</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/40">{cycleHistory.length}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-white/40">
                          Total Fee: <span className={`font-mono ${(stats.total_fees || 0) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            ${(stats.total_fees || cycleHistory.reduce((s, c) => s + c.fee_hl, 0)).toFixed(4)}
                          </span>
                        </span>
                        <span className="text-white/40">
                          Net P&L: <span className={`font-mono font-semibold ${
                            cycleHistory.reduce((s, c) => s + c.net_pnl - c.fee_hl, 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            ${cycleHistory.reduce((s, c) => s + c.net_pnl - c.fee_hl, 0).toFixed(4)}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-white/5 text-white/30">
                            <th className="text-left py-2 px-2 font-medium">#</th>
                            <th className="text-left py-2 px-2 font-medium">Time</th>
                            <th className="text-left py-2 px-2 font-medium">Side</th>
                            <th className="text-right py-2 px-2 font-medium">Size</th>
                            <th className="text-right py-2 px-2 font-medium">Entry</th>
                            <th className="text-right py-2 px-2 font-medium">Exit</th>
                            <th className="text-right py-2 px-2 font-medium">HL PnL</th>
                            <th className="text-right py-2 px-2 font-medium">LT PnL</th>
                            <th className="text-right py-2 px-2 font-medium">Fee</th>
                            <th className="text-right py-2 px-2 font-medium">Net</th>
                            <th className="text-right py-2 px-2 font-medium">Hold</th>
                            <th className="text-left py-2 px-2 font-medium">Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cycleHistory.map((c, i) => {
                            const netProfit = c.net_pnl - c.fee_hl;
                            return (
                              <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                                <td className="py-2.5 px-2 text-white/50 font-mono">{c.cycle}</td>
                                <td className="py-2.5 px-2 text-white/40">
                                  <div>{c.entry_time?.split(' ')[1] || c.entry_time}</div>
                                </td>
                                <td className="py-2.5 px-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                    c.hl_side === 'short' 
                                      ? 'bg-red-500/20 text-red-400' 
                                      : 'bg-emerald-500/20 text-emerald-400'
                                  }`}>
                                    HL {c.hl_side?.toUpperCase()}
                                  </span>
                                </td>
                                <td className="py-2.5 px-2 text-right text-white/60 font-mono">${c.size_usd}</td>
                                <td className="py-2.5 px-2 text-right text-white/50 font-mono">${c.entry_price}</td>
                                <td className="py-2.5 px-2 text-right text-white/50 font-mono">${c.exit_price}</td>
                                <td className={`py-2.5 px-2 text-right font-mono ${c.hl_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  ${c.hl_pnl?.toFixed(4)}
                                </td>
                                <td className={`py-2.5 px-2 text-right font-mono ${c.lighter_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  ${c.lighter_pnl?.toFixed(4)}
                                </td>
                                <td className="py-2.5 px-2 text-right font-mono text-orange-400/80">
                                  -${c.fee_hl?.toFixed(4)}
                                </td>
                                <td className={`py-2.5 px-2 text-right font-mono font-semibold ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {netProfit >= 0 ? '+' : ''}${netProfit.toFixed(4)}
                                </td>
                                <td className="py-2.5 px-2 text-right text-white/30 font-mono">
                                  {c.hold_minutes >= 60 ? `${(c.hold_minutes / 60).toFixed(1)}h` : `${c.hold_minutes}m`}
                                </td>
                                <td className="py-2.5 px-2 text-white/30 text-[10px]">{c.close_reason}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        {/* Summary row */}
                        <tfoot>
                          <tr className="border-t border-white/10 bg-white/[0.02]">
                            <td colSpan={6} className="py-2.5 px-2 text-white/50 font-medium">Total ({cycleHistory.length} cycles)</td>
                            <td className={`py-2.5 px-2 text-right font-mono font-semibold ${
                              cycleHistory.reduce((s, c) => s + c.hl_pnl, 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                              ${cycleHistory.reduce((s, c) => s + c.hl_pnl, 0).toFixed(4)}
                            </td>
                            <td className={`py-2.5 px-2 text-right font-mono font-semibold ${
                              cycleHistory.reduce((s, c) => s + c.lighter_pnl, 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                              ${cycleHistory.reduce((s, c) => s + c.lighter_pnl, 0).toFixed(4)}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono font-semibold text-orange-400">
                              -${cycleHistory.reduce((s, c) => s + c.fee_hl, 0).toFixed(4)}
                            </td>
                            <td className={`py-2.5 px-2 text-right font-mono font-bold ${
                              cycleHistory.reduce((s, c) => s + c.net_pnl - c.fee_hl, 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                              {cycleHistory.reduce((s, c) => s + c.net_pnl - c.fee_hl, 0) >= 0 ? '+' : ''}
                              ${cycleHistory.reduce((s, c) => s + c.net_pnl - c.fee_hl, 0).toFixed(4)}
                            </td>
                            <td className="py-2.5 px-2 text-right text-white/30 font-mono">
                              {(cycleHistory.reduce((s, c) => s + c.hold_minutes, 0) / 60).toFixed(1)}h
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

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
                        <Key className="w-4 h-4 text-emerald-400" /> API Keys
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setShowKeys(!showKeys)} className="text-white/40 hover:text-white">
                        {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div className="space-y-2">
                      <Label className="text-white/60 text-xs flex items-center gap-1">
                        Agent Key {!apiKeys.valiant_agent_key && <span className="text-red-400">*</span>}
                      </Label>
                      <Input type={showKeys ? 'text' : 'password'} value={apiKeys.valiant_agent_key}
                        onChange={e => setApiKeys({...apiKeys, valiant_agent_key: e.target.value})}
                        placeholder="0x..." className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/60 text-xs">Master Address</Label>
                      <Input type={showKeys ? 'text' : 'password'} value={apiKeys.valiant_master_address}
                        onChange={e => setApiKeys({...apiKeys, valiant_master_address: e.target.value})}
                        placeholder="0x..." className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/60 text-xs flex items-center gap-1">
                        Lighter API Key {!apiKeys.lighter_api_key && <span className="text-red-400">*</span>}
                      </Label>
                      <Input type={showKeys ? 'text' : 'password'} value={apiKeys.lighter_api_key}
                        onChange={e => setApiKeys({...apiKeys, lighter_api_key: e.target.value})}
                        placeholder='{"2": "..."}' className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-xs" />
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

                    {/* Agent Key Guide */}
                    <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Info className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-emerald-300 font-medium text-sm">How to Get Your Agent Key</h4>
                      </div>
                      
                      {/* Step 1: PROMINENT affiliate CTA */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">1</span>
                          <span className="text-xs text-white/70">Create your Valiant account & make 1 trade on Perps</span>
                        </div>
                        <a href="https://valiant.trade/trade?af=valbot" target="_blank" rel="noopener noreferrer"
                          className="block w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:translate-y-[-1px] text-center relative overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                          <span className="relative flex items-center justify-center gap-2">
                            <Zap className="w-4 h-4" />
                            Open Valiant Account — 20% Fee Discount
                            <ExternalLink className="w-3.5 h-3.5" />
                          </span>
                        </a>
                        <p className="text-[10px] text-emerald-400/60 text-center mt-1.5">Sign up via this link to get 20% off all trading fees</p>
                      </div>

                      <ol className="space-y-2 text-xs text-white/70">
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">2</span>
                          <span>On Valiant, click <strong>Perps</strong> tab → make at least 1 trade (this creates your agent key)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">3</span>
                          <span>Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">F12</kbd> → go to <strong>Console</strong> tab</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">4</span>
                          <span>Click the Copy button below, paste in Console, then press Enter:</span>
                        </li>
                      </ol>
                      <div className="mt-3 relative">
                        {/* Show actual code */}
                        <div className="p-3 rounded-lg bg-black/60 border border-white/10 font-mono text-[9px] text-white/40 leading-relaxed max-h-20 overflow-hidden relative">
                          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                          {`const r=indexedDB.open('valiant-agent-keys');r.onsuccess=async e=>{const db=e.target.result;try{const tx=db.transaction('encryption-keys','readonly');const s=tx.objectStore('encryption-keys');const g=s.getAll();g.onsuccess=async()=>{for(const entry of g.result){const keys=Object.keys(localStorage).filter(k=>k.startsWith('valiant:agent:'));for(const lsKey of keys){try{const addr=lsKey.replace('valiant:agent:','');const enc=localStorage.getItem(lsKey);...`}
                        </div>
                        <button
                          onClick={() => {
                            const code = `const r=indexedDB.open('valiant-agent-keys');r.onsuccess=async e=>{const db=e.target.result;try{const tx=db.transaction('encryption-keys','readonly');const s=tx.objectStore('encryption-keys');const g=s.getAll();g.onsuccess=async()=>{for(const entry of g.result){const keys=Object.keys(localStorage).filter(k=>k.startsWith('valiant:agent:'));for(const lsKey of keys){try{const addr=lsKey.replace('valiant:agent:','');const enc=localStorage.getItem(lsKey);const bytes=Uint8Array.from(atob(enc),c=>c.charCodeAt(0));const iv=bytes.slice(0,12);const ct=bytes.slice(12);const key=entry.key||entry;const dec=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,ct);console.log('WALLET:',addr);console.log('AGENT KEY:',new TextDecoder().decode(dec))}catch(e){}}}};}catch(e){console.log('No encryption-keys store, trying direct...');const keys=Object.keys(localStorage).filter(k=>k.startsWith('valiant:agent:'));keys.forEach(k=>console.log(k,localStorage.getItem(k)))}};`;
                            navigator.clipboard.writeText(code);
                            const btn = document.getElementById('copy-code-btn');
                            if (btn) { btn.textContent = '✓ Copied!'; setTimeout(() => { btn.textContent = '📋 Copy Code'; }, 2000); }
                          }}
                          id="copy-code-btn"
                          className="mt-2 w-full py-2.5 px-4 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          📋 Copy Code
                        </button>
                        <p className="mt-1.5 text-[9px] text-white/25 text-center">This script reads your agent key from Valiant's browser storage (IndexedDB + localStorage)</p>
                      </div>
                      <div className="mt-3 pt-3 border-t border-emerald-500/20">
                        {/* Console output example */}
                        <p className="text-[10px] text-white/50 mb-2">After running, you'll see this in Console:</p>
                        <div className="p-3 rounded-lg bg-black/60 border border-white/10 font-mono text-[11px] space-y-1">
                          <div><span className="text-blue-400">{'>'}</span> <span className="text-white/30">WALLET:</span> <span className="text-yellow-400">0x589637BcF76f6Ad9d0176ceccD4474F96f0cfC78</span></div>
                          <div><span className="text-blue-400">{'>'}</span> <span className="text-white/30">AGENT KEY:</span> <span className="text-emerald-400">0xabcdef1234567890abcdef1234567890...</span></div>
                        </div>
                        
                        {/* Arrow pointing to fields */}
                        <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <p className="text-[11px] text-emerald-300 font-medium mb-2">Then paste into ValBot:</p>
                          <div className="space-y-1.5 text-[10px] text-white/60">
                            <div className="flex items-center gap-2">
                              <ArrowUpRight className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                              <span><span className="text-yellow-400 font-mono">WALLET</span> → paste into <strong className="text-white">Master Wallet Address</strong> field above</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ArrowUpRight className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                              <span><span className="text-emerald-400 font-mono">AGENT KEY</span> → paste into <strong className="text-white">Agent Key</strong> field above</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-[10px] text-white/30 flex items-center gap-1 mt-3">
                          <Shield className="w-3 h-3" />
                          Keys are stored locally in your browser and never sent to our servers.
                        </p>
                      </div>
                    </div>

                    {/* Lighter Account ID Guide */}
                    <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Info className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-cyan-300 font-medium text-sm">How to Get Your Lighter API Key</h4>
                      </div>
                      
                      {/* Part A: Create API Key */}
                      <p className="text-[10px] text-cyan-400/70 uppercase tracking-wider font-semibold mb-2">Part A — Create API Key</p>
                      <ol className="space-y-2 text-xs text-white/70 mb-4">
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold">1</span>
                          <span>Go to <a href="https://lighter.xyz/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline inline-flex items-center gap-1">lighter.xyz <ExternalLink className="w-3 h-3" /></a> and connect your wallet</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold">2</span>
                          <span>Click your wallet address (top right) → select <strong>API Keys</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold">3</span>
                          <span>Click <strong>"Create API Key"</strong> → set permissions to <strong>Trade</strong> → confirm</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold">4</span>
                          <span>Copy the <strong>Private Key</strong> shown (save it — won't be shown again!)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold">5</span>
                          <span>Note the <strong>API Key Index</strong> number (usually 2) — enter it in the field above</span>
                        </li>
                      </ol>
                      <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 mb-4">
                        <p className="text-[10px] text-cyan-300">
                          <strong>Lighter API Key format:</strong> Paste the private key as JSON: <code className="bg-black/40 px-1 rounded">{'{"2": "your_private_key_hex"}'}</code> where <code className="bg-black/40 px-1 rounded">2</code> is your API Key Index.
                        </p>
                      </div>

                      {/* Part B: Find Account ID */}
                      <p className="text-[10px] text-cyan-400/70 uppercase tracking-wider font-semibold mb-2">Part B — Find Your Account ID</p>
                      <ol className="space-y-2 text-xs text-white/70">
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold">1</span>
                          <span>On lighter.xyz, press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">F12</kbd> → <strong>Network</strong> tab</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold">2</span>
                          <span>Refresh page (F5) and wait for it to load</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold">3</span>
                          <span>Filter by <code className="bg-white/10 px-1 rounded">account</code> in the Network search box</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold">4</span>
                          <span>Look for URL containing <code className="bg-white/10 px-1 rounded">account_index=</code></span>
                        </li>
                      </ol>
                      <div className="mt-3 p-2 rounded bg-black/40 border border-cyan-500/20">
                        <p className="text-[10px] text-white/60">Example URL:</p>
                        <code className="text-[9px] text-cyan-300 font-mono break-all">https://mainnet.zklighter.ai/api/v1/apikeys?account_index=<span className="text-green-400 font-bold">719083</span></code>
                      </div>
                      <p className="mt-2 text-[10px] text-white/50">
                        The Account ID is the number after <code className="bg-white/10 px-1 rounded">account_index=</code>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 backdrop-blur border-white/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center gap-2 text-base">
                      <Target className="w-4 h-4 text-emerald-400" /> Trading Config
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
                        <Input 
                          value={config.symbol}
                          onChange={e => setConfig({...config, symbol: e.target.value.toUpperCase()})}
                          placeholder="BTC, ETH, SOL, HYPE..."
                          className="bg-black border-white/10 text-white text-sm"
                          list="symbol-list"
                        />
                        <datalist id="symbol-list">
                          {['BTC','ETH','SOL','HYPE','XRP','DOGE','LINK','AVAX','SUI','PEPE',
                            'APT','ADA','WIF','ONDO','PENGU','KAITO','BERA','TIA','TRUMP',
                            'BNB','ARB','UNI','JUP','ENA','WLD','DOT','FARTCOIN',
                            'NVDA','HOOD','AAPL','COIN','GOLD'].map(s => (
                            <option key={s} value={s} />
                          ))}
                        </datalist>
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
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500" />
                      <Label htmlFor="autoReenter" className="text-white/80 text-sm cursor-pointer flex-1">
                        Auto re-enter after cycle
                      </Label>
                    </div>
                    <Separator className="bg-white/10" />
                    {!isRunning ? (
                      <Button onClick={handleStart} disabled={loading || !apiKeys.valiant_agent_key || !apiKeys.lighter_api_key}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold py-6 rounded-xl shadow-lg shadow-emerald-500/20">
                        {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Play className="w-5 h-5 mr-2" />}
                        {loading ? 'Starting...' : 'Start Bot'}
                      </Button>
                    ) : (
                      <Button onClick={handleStop} disabled={isStopping} 
                        className="w-full py-6 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-semibold shadow-lg shadow-red-500/20">
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
