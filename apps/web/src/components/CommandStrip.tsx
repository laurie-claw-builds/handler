import { LiveClock } from './LiveClock';

export function CommandStrip() {
  return (
    <header
      className="flex items-center justify-between px-6 py-3 border-b border-border"
      style={{ backgroundColor: '#0D1017' }}
    >
      {/* Wordmark */}
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <h1 className="font-mono text-xl font-bold text-accent tracking-[0.3em]">
          HANDLER
        </h1>
        <span className="font-mono text-xs text-text-dim tracking-widest border border-border rounded px-2 py-0.5">
          v0.1
        </span>
      </div>

      {/* Clock */}
      <LiveClock />

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          className="font-mono text-xs font-semibold tracking-widest px-4 py-2 rounded border border-accent text-accent hover:bg-accent hover:text-white transition-colors uppercase"
          title="Items requiring immediate attention (placeholder)"
        >
          NEEDS ME
          <span className="ml-2 bg-accent text-white rounded-full w-4 h-4 inline-flex items-center justify-center text-xs">
            3
          </span>
        </button>
      </div>
    </header>
  );
}
