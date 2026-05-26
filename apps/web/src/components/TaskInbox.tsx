const ACTION_PILLS = [
  'PERSPECTIVE',
  'ANALYSE',
  'RESEARCH',
  'DRAFT',
  'DELEGATE',
  'GET CONTEXT',
] as const;

function PlaceholderTaskCard() {
  return (
    <div
      className="rounded-lg border border-border p-4 space-y-3 hover:border-accent/40 transition-colors"
      style={{ backgroundColor: '#242B35' }}
    >
      {/* Card header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-accent/20 text-accent border border-accent/30 tracking-widest">
            TELEGRAM
          </span>
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 tracking-widest">
            HIGH
          </span>
        </div>
        <span className="font-mono text-xs text-muted tabular-nums">
          ~15 min
        </span>
      </div>

      {/* Summary */}
      <p className="text-text text-sm leading-relaxed">
        Review Q2 merchandise margin report and confirm reorder quantities for
        the Singapore workshop batch before Friday cutoff.
      </p>

      {/* Status badge */}
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
        <span className="font-mono text-xs text-text-dim tracking-widest">
          PENDING
        </span>
        <span className="font-mono text-xs text-muted">
          &middot; 2 hours ago
        </span>
      </div>

      {/* Action pills */}
      <div className="flex flex-wrap gap-2 pt-1">
        {ACTION_PILLS.map((pill) => (
          <button
            key={pill}
            className="font-mono text-xs px-3 py-1 rounded-full border border-border text-text-dim hover:border-accent hover:text-accent transition-colors tracking-widest"
            title={`${pill} (Wave 3)`}
          >
            {pill}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TaskInbox() {
  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="font-mono text-xs font-semibold tracking-widest text-text-dim uppercase">
            Task Inbox
          </h2>
          <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-border text-text-dim">
            1
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="font-mono text-xs text-muted tracking-widest">
            LIVE
          </span>
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <PlaceholderTaskCard />

        {/* Empty state hint */}
        <div className="border border-dashed border-border/50 rounded-lg p-4 text-center">
          <p className="font-mono text-xs text-muted tracking-widest">
            CHANNEL POLLING ACTIVE IN WAVE 3
          </p>
        </div>
      </div>
    </div>
  );
}
