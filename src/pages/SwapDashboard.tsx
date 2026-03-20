import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Pause, Loader2, Wallet, Clock, Target, 
  Zap, BarChart3, DollarSign, AlertCircle, ExternalLink,
  Plus, Trash2, Copy, Check, RefreshCw, Settings2, Terminal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const SWAP_API_URL = 'https://valbot-swap-be.fly.dev';

interface WalletStatus {
  index: number;
  address: string;
  status: 'waiting' | 'running' | 'done' | 'error';
  cycle: number;
  totalCycles: number;
  swaps: number;
  success: number;
  failed: number;
  volume: { sell: number; buy: number };
  pnl?: number;
}

interface SwapStats {
  totalSwaps: number;
  successSwaps: number;
  failedSwaps: number;
  cyclesCompleted: number;
  totalCycles: number;
}

export default function SwapDashboard() {
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState<SwapStats>({ totalSwaps: 0, successSwaps: 0, failedSwaps: 0, cyclesCompleted: 0, totalCycles: 0 });
  const [walletStatuses, setWalletStatuses] = useState<WalletStatus[]>([]);
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  // Config
  const [walletKeys, setWalletKeys] = useState<string[]>(['']);
  const [config, setConfig] = useState({
    pair: 'IFOGO',
    cycles: 25,
    parallel: true,
    batchSize: 5,
    swapDelay: 2000,
    cycleDelay: 20000,
    batchDelayMin: 3000,
    batchDelayMax: 10000,
    gasReserve: '10000000',
    randomSellMin: '10',
    randomSellMax: '20',
    slippageBps: 50,
    dryRun: false,
    rpcUrl: 'https://mainnet.fogo.io/',
    network: 'fogoMainnet',
  });

  const wsRef = useRef<WebSocket | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState('');

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // WebSocket
  const connectWs = useCallback((sid: string) => {
    if (wsRef.current) wsRef.current.close();
    setWsStatus('connecting');
    
    const wsUrl = SWAP_API_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    const ws = new WebSocket(`${wsUrl}/ws?session=${sid}`);
    
    ws.onopen = () => setWsStatus('connected');
    ws.onclose = () => {
      setWsStatus('disconnected');
      // Auto-reconnect if still running
      if (isRunning) setTimeout(() => connectWs(sid), 3000);
    };
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'log') {
          setLogs(prev => [...prev.slice(-499), msg.data]);
        } else if (msg.type === 'stats') {
          setStats(msg.data);
        } else if (msg.type === 'wallets') {
          setWalletStatuses(msg.data || []);
        } else if (msg.type === 'state') {
          setIsRunning(msg.data.is_running);
          if (msg.data.stats) setStats(msg.data.stats);
          if (msg.data.wallets) setWalletStatuses(msg.data.wallets);
          if (msg.data.logs) setLogs(msg.data.logs);
        }
      } catch {}
    };
    wsRef.current = ws;
  }, [isRunning]);

  // Start
  const handleStart = async () => {
    const validWallets = walletKeys.filter(k => k.trim().length > 30);
    if (validWallets.length === 0) { alert('Add at least 1 wallet private key'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${SWAP_API_URL}/api/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: { ...config, wallets: validWallets }
        }),
      });
      const data = await res.json();
      if (res.ok && data.session_id) {
        setSessionId(data.session_id);
        setIsRunning(true);
        setLogs([]);
        setWalletStatuses([]);
        setStats({ totalSwaps: 0, successSwaps: 0, failedSwaps: 0, cyclesCompleted: 0, totalCycles: config.cycles });
        setTimeout(() => connectWs(data.session_id), 500);
      } else {
        alert(data.error || 'Failed to start');
      }
    } catch (e: any) { alert(`Error: ${e.message}`); }
    setLoading(false);
  };

  // Stop
  const handleStop = async () => {
    if (!sessionId) return;
    try {
      await fetch(`${SWAP_API_URL}/api/stop/${sessionId}`, { method: 'POST' });
      setIsRunning(false);
    } catch {}
  };

  // Wallet key management
  const addWallet = () => setWalletKeys([...walletKeys, '']);
  const removeWallet = (i: number) => setWalletKeys(walletKeys.filter((_, idx) => idx !== i));
  const updateWallet = (i: number, val: string) => {
    const updated = [...walletKeys];
    updated[i] = val;
    setWalletKeys(updated);
  };

  const validWalletCount = walletKeys.filter(k => k.trim().length > 30).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0d0d0d] to-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-orange-400" />
              Fogo Swap Bot
            </h1>
            <p className="text-white/40 text-sm mt-1">Multi-wallet DEX volume bot on Fogo blockchain</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={cn('w-2 h-2 rounded-full',
              wsStatus === 'connected' ? 'bg-emerald-400 animate-pulse' :
              wsStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-white/20'
            )} />
            <span className="text-white/40">{wsStatus === 'connected' ? 'Live' : wsStatus === 'connecting' ? 'Connecting...' : 'Offline'}</span>
          </div>
        </div>

        {/* Stats Grid */}
        {isRunning && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {[
              { label: 'Total Swaps', value: stats.totalSwaps, icon: BarChart3 },
              { label: 'Success', value: stats.successSwaps, icon: Check, color: 'text-emerald-400' },
              { label: 'Failed', value: stats.failedSwaps, icon: AlertCircle, color: 'text-red-400' },
              { label: 'Cycles', value: `${stats.cyclesCompleted}/${stats.totalCycles}`, icon: RefreshCw },
              { label: 'Wallets', value: `${walletStatuses.filter(w => w.status === 'done').length}/${walletStatuses.length}`, icon: Wallet },
            ].map((s, i) => (
              <Card key={i} className="bg-black/40 border-white/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <s.icon className={cn("w-5 h-5", s.color || 'text-white/40')} />
                  <div>
                    <div className={cn("text-lg font-bold", s.color || 'text-white')}>{s.value}</div>
                    <div className="text-[10px] text-white/30">{s.label}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Config */}
          <div className="space-y-6">
            {/* Wallet Keys */}
            <Card className="bg-black/40 border-white/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2"><Wallet className="w-4 h-4 text-orange-400" /> Wallets ({validWalletCount})</span>
                  <Button size="sm" variant="ghost" onClick={addWallet} className="text-orange-400 hover:text-orange-300 h-7 text-xs">
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {walletKeys.map((key, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      type="password"
                      value={key}
                      onChange={e => updateWallet(i, e.target.value)}
                      placeholder={`Wallet ${i + 1} private key (base58)`}
                      className="bg-white/5 border-white/10 text-white text-xs font-mono"
                    />
                    {walletKeys.length > 1 && (
                      <Button size="sm" variant="ghost" onClick={() => removeWallet(i)} className="text-red-400 hover:text-red-300 px-2">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
                <p className="text-[10px] text-white/30">Solana/Fogo private keys in base58 format.</p>
                
                {/* Security Warning */}
                <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-yellow-300 text-[11px] font-medium mb-1">Security Notice</p>
                      <ul className="text-[10px] text-white/40 space-y-1">
                        <li>• Your private keys are sent to our server via HTTPS (encrypted in transit)</li>
                        <li>• Keys are held in server memory ONLY while the bot is running</li>
                        <li>• Keys are NOT saved to disk and are deleted when the session ends</li>
                        <li>• Use dedicated swap wallets with limited funds — never use your main wallet</li>
                        <li>• For maximum security, run the bot locally instead of using this web interface</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trading Config */}
            <Card className="bg-black/40 border-white/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-orange-400" /> Config
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-white/60 text-[10px]">Pool</Label>
                    <select value={config.pair} onChange={e => setConfig({...config, pair: e.target.value})}
                      className="w-full rounded-md bg-white/5 border border-white/10 text-white text-xs px-3 py-2">
                      <option value="IFOGO">FOGO ↔ iFOGO</option>
                      <option value="USDC">FOGO ↔ USDC</option>
                      <option value="STFOGO">FOGO ↔ stFOGO</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white/60 text-[10px]">Cycles per wallet</Label>
                    <Input type="number" value={config.cycles} onChange={e => setConfig({...config, cycles: Number(e.target.value)})}
                      className="bg-white/5 border-white/10 text-white text-xs" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-white/60 text-[10px]">Sell Min (FOGO)</Label>
                    <Input value={config.randomSellMin} onChange={e => setConfig({...config, randomSellMin: e.target.value})}
                      className="bg-white/5 border-white/10 text-white text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white/60 text-[10px]">Sell Max (FOGO)</Label>
                    <Input value={config.randomSellMax} onChange={e => setConfig({...config, randomSellMax: e.target.value})}
                      className="bg-white/5 border-white/10 text-white text-xs" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-white/60 text-[10px]">Swap Delay (ms)</Label>
                    <Input type="number" value={config.swapDelay} onChange={e => setConfig({...config, swapDelay: Number(e.target.value)})}
                      className="bg-white/5 border-white/10 text-white text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white/60 text-[10px]">Cycle Delay (ms)</Label>
                    <Input type="number" value={config.cycleDelay} onChange={e => setConfig({...config, cycleDelay: Number(e.target.value)})}
                      className="bg-white/5 border-white/10 text-white text-xs" />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                  <input type="checkbox" checked={config.parallel} onChange={e => setConfig({...config, parallel: e.target.checked})}
                    className="w-4 h-4 rounded bg-white/5 text-orange-500" />
                  <Label className="text-white/60 text-xs">Parallel mode</Label>
                  {config.parallel && (
                    <Input type="number" value={config.batchSize} onChange={e => setConfig({...config, batchSize: Number(e.target.value)})}
                      className="w-20 bg-white/5 border-white/10 text-white text-xs ml-auto" placeholder="Batch" />
                  )}
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <input type="checkbox" checked={config.dryRun} onChange={e => setConfig({...config, dryRun: e.target.checked})}
                    className="w-4 h-4 rounded bg-white/5 text-yellow-500" />
                  <Label className="text-yellow-400 text-xs">Dry Run (simulate, no real swaps)</Label>
                </div>
              </CardContent>
            </Card>

            {/* Start/Stop */}
            <div className="flex gap-3">
              {!isRunning ? (
                <Button onClick={handleStart} disabled={loading || validWalletCount === 0}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-semibold py-6 text-lg rounded-xl">
                  {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Play className="w-5 h-5 mr-2" />}
                  {loading ? 'Starting...' : `Start Swap (${validWalletCount} wallets)`}
                </Button>
              ) : (
                <Button onClick={handleStop}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-6 text-lg rounded-xl">
                  <Pause className="w-5 h-5 mr-2" /> Stop
                </Button>
              )}
            </div>
          </div>

          {/* Right: Logs + Wallets */}
          <div className="space-y-6">
            {/* Wallet Status Table */}
            {walletStatuses.length > 0 && (
              <Card className="bg-black/40 border-white/5">
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-orange-400" /> Wallet Status
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/5 text-white/30">
                          <th className="text-left py-2 px-1">#</th>
                          <th className="text-left py-2 px-1">Address</th>
                          <th className="text-center py-2 px-1">Status</th>
                          <th className="text-center py-2 px-1">Cycle</th>
                          <th className="text-center py-2 px-1">Swaps</th>
                          <th className="text-right py-2 px-1">PnL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {walletStatuses.map((w, i) => (
                          <tr key={i} className="border-b border-white/[0.03]">
                            <td className="py-2 px-1 text-white/40">{w.index}</td>
                            <td className="py-2 px-1 text-white/50 font-mono">{w.address?.slice(0, 8)}...</td>
                            <td className="py-2 px-1 text-center">
                              <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium",
                                w.status === 'running' ? 'bg-emerald-500/20 text-emerald-400' :
                                w.status === 'done' ? 'bg-blue-500/20 text-blue-400' :
                                w.status === 'error' ? 'bg-red-500/20 text-red-400' :
                                'bg-white/10 text-white/40'
                              )}>{w.status}</span>
                            </td>
                            <td className="py-2 px-1 text-center text-white/50">{w.cycle}/{w.totalCycles}</td>
                            <td className="py-2 px-1 text-center text-white/50">{w.success}/{w.swaps}</td>
                            <td className={cn("py-2 px-1 text-right font-mono",
                              w.pnl !== undefined ? (w.pnl >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-white/30'
                            )}>
                              {w.pnl !== undefined ? `${w.pnl >= 0 ? '+' : ''}${w.pnl.toFixed(4)}` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Live Logs */}
            <Card className="bg-black/40 border-white/5">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-orange-400" /> Live Logs
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/40">{logs.length}</span>
                </h3>
                <div className="h-[400px] overflow-y-auto rounded-lg bg-black/60 border border-white/5 p-3 font-mono text-[11px]">
                  {logs.length === 0 ? (
                    <p className="text-white/20 text-center mt-20">Logs will appear here when bot starts...</p>
                  ) : (
                    logs.map((log, i) => (
                      <div key={i} className={cn("py-0.5 leading-relaxed",
                        log.includes('✅') ? 'text-emerald-400/80' :
                        log.includes('❌') ? 'text-red-400/80' :
                        log.includes('⚠') ? 'text-yellow-400/80' :
                        'text-white/50'
                      )}>{log}</div>
                    ))
                  )}
                  <div ref={logsEndRef} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
