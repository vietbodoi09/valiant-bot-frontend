import { Loader2, CheckCircle2, XCircle, MinusCircle, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StageInfo {
  stage: string;
  status: string;
  duration_ms?: number;
  report_preview?: string;
}

interface AIPipelineProgressProps {
  stages: Record<string, StageInfo>;
  isActive: boolean;
}

const PIPELINE_STAGES = [
  { key: 'indicator', label: 'Indicator', desc: 'RSI, MACD, EMA analysis' },
  { key: 'pattern', label: 'Pattern', desc: 'Chart pattern recognition' },
  { key: 'trend', label: 'Trend', desc: 'Support/Resistance analysis' },
  { key: 'decision', label: 'Decision', desc: 'Final trading decision' },
];

function StatusIcon({ status }: { status?: string }) {
  switch (status) {
    case 'running':
      return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
    case 'done':
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    case 'error':
      return <XCircle className="w-4 h-4 text-red-400" />;
    case 'skipped':
      return <MinusCircle className="w-4 h-4 text-orange-400" />;
    default:
      return <div className="w-4 h-4 rounded-full border border-white/20" />;
  }
}

export default function AIPipelineProgress({ stages, isActive }: AIPipelineProgressProps) {
  if (!isActive && Object.keys(stages).length === 0) return null;

  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Brain className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-medium text-white/80">Multi-Agent Pipeline</span>
        {isActive && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 animate-pulse">
            RUNNING
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        {PIPELINE_STAGES.map((stage, idx) => {
          const info = stages[stage.key];
          const status = info?.status;
          const isLast = idx === PIPELINE_STAGES.length - 1;

          return (
            <div key={stage.key} className="flex items-center flex-1">
              <div className={cn(
                "flex flex-col items-center gap-1 flex-1 p-2 rounded-lg transition-colors",
                status === 'running' && "bg-blue-500/10 border border-blue-500/20",
                status === 'done' && "bg-emerald-500/5",
                status === 'error' && "bg-red-500/5",
              )}>
                <StatusIcon status={status} />
                <span className="text-[10px] text-white/60 font-medium">{stage.label}</span>
                {info?.duration_ms && (
                  <span className="text-[9px] text-white/30">{(info.duration_ms / 1000).toFixed(1)}s</span>
                )}
              </div>
              {!isLast && (
                <div className={cn(
                  "w-4 h-px mx-0.5",
                  status === 'done' ? "bg-emerald-500/40" : "bg-white/10"
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Show latest report preview */}
      {Object.entries(stages).map(([key, info]) => (
        info?.report_preview && info.status === 'done' && (
          <details key={key} className="text-[11px] text-white/40">
            <summary className="cursor-pointer hover:text-white/60 capitalize">
              {key} report preview
            </summary>
            <p className="mt-1 pl-2 border-l border-white/10 text-white/30 whitespace-pre-wrap">
              {info.report_preview}
            </p>
          </details>
        )
      ))}
    </div>
  );
}
