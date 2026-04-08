import { useState, useEffect } from 'react';
import { Brain, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const API_URL = 'https://valiant-bot-be-01.fly.dev';

interface Decision {
  id: string;
  timestamp: string;
  symbol: string;
  action: string;
  confidence: number;
  reasoning: string;
  executed: number;
  blocked_reason?: string;
}

interface AIDecisionLogProps {
  sessionId: string;
  realtimeDecisions?: Decision[];
}

const ACTION_COLORS: Record<string, string> = {
  open_long: 'text-green-400 bg-green-500/10 border-green-500/20',
  open_short: 'text-red-400 bg-red-500/10 border-red-500/20',
  close_long: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  close_short: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  hold: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  wait: 'text-white/40 bg-white/5 border-white/10',
  hedge_long_short: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  funding_arb: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
};

export default function AIDecisionLog({ sessionId, realtimeDecisions }: AIDecisionLogProps) {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadDecisions();
  }, [sessionId]);

  // Merge realtime decisions
  useEffect(() => {
    if (realtimeDecisions && realtimeDecisions.length > 0) {
      setDecisions(prev => {
        const ids = new Set(prev.map(d => d.id));
        const newOnes = realtimeDecisions.filter(d => !ids.has(d.id));
        return [...newOnes, ...prev].slice(0, 100);
      });
    }
  }, [realtimeDecisions]);

  const loadDecisions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/autotrade/decisions/${sessionId}`);
      const data = await res.json();
      setDecisions(data.decisions || []);
    } catch (e) {
      console.error('Failed to load decisions:', e);
    }
    setLoading(false);
  };

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleTimeString();
    } catch {
      return ts;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/60 flex items-center gap-2">
          <Brain size={14} /> AI Decisions ({decisions.length})
        </h3>
        <button onClick={loadDecisions} className="text-white/30 hover:text-white/60 transition-colors">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {decisions.length === 0 ? (
        <div className="text-center py-8 text-white/20 text-sm">No decisions yet</div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {decisions.map(d => (
            <Card key={d.id} className={cn(
              "bg-white/[0.02] border-white/[0.06] cursor-pointer hover:border-white/10 transition-all",
              expandedId === d.id && "border-emerald-500/20"
            )} onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {d.executed ? (
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    ) : (
                      <XCircle size={14} className="text-red-400/60" />
                    )}
                    <Badge className={cn("text-[10px] px-2 py-0 border", ACTION_COLORS[d.action] || 'text-white/50')}>
                      {d.action?.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <span className="text-xs font-medium text-white/80">{d.symbol}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xs font-mono",
                      d.confidence >= 0.75 ? "text-emerald-400" : d.confidence >= 0.5 ? "text-yellow-400" : "text-red-400/60"
                    )}>
                      {(d.confidence * 100).toFixed(0)}%
                    </span>
                    <span className="text-[10px] text-white/30 flex items-center gap-1">
                      <Clock size={10} /> {formatTime(d.timestamp)}
                    </span>
                  </div>
                </div>

                {!d.executed && d.blocked_reason && (
                  <div className="mt-1.5 text-[10px] text-red-400/60 bg-red-500/5 rounded px-2 py-1">
                    Blocked: {d.blocked_reason}
                  </div>
                )}

                {expandedId === d.id && d.reasoning && (
                  <div className="mt-2 pt-2 border-t border-white/[0.04] text-xs text-white/50 leading-relaxed">
                    {d.reasoning}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
