const STATUS_STYLES: Record<string, { dot: string; label: string; border: string }> = {
  ACTIVE: { dot: 'bg-green-400', label: 'text-green-400', border: 'border-green-400/30' },
  QUEUED: { dot: 'bg-yellow-400', label: 'text-yellow-400', border: 'border-yellow-400/30' },
  BLOCKED: { dot: 'bg-red-400', label: 'text-red-400', border: 'border-red-400/30' },
  COMPLETE: { dot: 'bg-accent', label: 'text-accent', border: 'border-accent/30' },
  FAILED: { dot: 'bg-red-500', label: 'text-red-500', border: 'border-red-500/30' },
};

interface AgentCardProps {
  agentName: string;
  description: string;
  status: keyof typeof STATUS_STYLES;
  tokensUsed: number;
  startedRelative: string;
}

function AgentCard({
  agentName,
  description,
  status,
  tokensUsed,
  startedRelative,
}: AgentCardProps) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.QUEUED;

  return (
    <div
      className={`rounded-lg border p-4 space-y-2 hover:border-accent/40 transition-colors ${style.border}`}
      style={{ backgroundColor: '#242B35' }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-semibold text-text tracking-widest">
          {agentName}
        </span>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
          <span className={`font-mono text-xs tracking-widest ${style.label}`}>
            {status}
          </span>
        </div>
      </div>

      <p className="text-text-dim text-xs leading-relaxed">{description}</p>

      <div className="flex items-center justify-between pt-1">
        <span className="font-mono text-xs text-muted">
          {tokensUsed.toLocaleString()} tokens
        </span>
        <span className="font-mono text-xs text-muted">{startedRelative}</span>
      </div>
    </div>
  );
}

const PLACEHOLDER_JOBS = [
  {
    agentName: 'CODER',
    description:
      'Wave 1 scaffold: monorepo, Docker, Prisma schema, auth, shell UI.',
    status: 'COMPLETE' as const,
    tokensUsed: 84200,
    startedRelative: '~2 hours ago',
  },
  {
    agentName: 'ARCHITECT',
    description:
      'Wave 2 spec: WebSocket feed, task persistence layer, routing rules engine.',
    status: 'QUEUED' as const,
    tokensUsed: 0,
    startedRelative: 'pending',
  },
] satisfies AgentCardProps[];

export function AgentQueue() {
  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="font-mono text-xs font-semibold tracking-widest text-text-dim uppercase">
            Agent Queue
          </h2>
          <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-border text-text-dim">
            {PLACEHOLDER_JOBS.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted">
            <span className="text-green-400">1</span> active
          </span>
          <span className="font-mono text-xs text-muted">
            <span className="text-yellow-400">1</span> queued
          </span>
        </div>
      </div>

      {/* Job list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {PLACEHOLDER_JOBS.map((job) => (
          <AgentCard key={job.agentName} {...job} />
        ))}

        {/* Wave 2 hint */}
        <div className="border border-dashed border-border/50 rounded-lg p-4 text-center">
          <p className="font-mono text-xs text-muted tracking-widest">
            LIVE UPDATES VIA WEBSOCKET IN WAVE 2
          </p>
        </div>
      </div>
    </div>
  );
}
