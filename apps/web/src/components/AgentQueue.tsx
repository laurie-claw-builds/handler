'use client';

import { useEffect, useRef } from 'react';
import { useAgentJobsStore } from '@/stores/agentJobs';
import type { AgentJob, AgentJobStatus } from '@/lib/types';

// --- Helpers ---

function formatElapsed(startedAt: string | null): string {
  if (!startedAt) return 'pending';
  const diffMs = Date.now() - new Date(startedAt).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just started';
  if (diffMin < 60) return `${diffMin}m`;
  return `${Math.floor(diffMin / 60)}h ${diffMin % 60}m`;
}

const STATUS_STYLES: Record<
  AgentJobStatus,
  { dot: string; label: string; border: string; pulse?: boolean }
> = {
  ACTIVE: {
    dot: 'bg-green-400 animate-pulse',
    label: 'text-green-400',
    border: 'border-green-400/30',
    pulse: true,
  },
  QUEUED: {
    dot: 'bg-yellow-400',
    label: 'text-yellow-400',
    border: 'border-yellow-400/30',
  },
  BLOCKED: {
    dot: 'bg-red-400',
    label: 'text-red-400',
    border: 'border-red-400/30',
  },
  COMPLETE: {
    dot: 'bg-accent',
    label: 'text-accent',
    border: 'border-accent/30',
  },
  FAILED: {
    dot: 'bg-red-500',
    label: 'text-red-500',
    border: 'border-red-500/30',
  },
};

// --- Agent Card ---

interface AgentCardProps {
  job: AgentJob;
}

function AgentCard({ job }: AgentCardProps) {
  const style = STATUS_STYLES[job.status] ?? STATUS_STYLES.QUEUED;
  const isDone = job.status === 'COMPLETE' || job.status === 'FAILED';
  const description = job.output
    ? job.output.slice(0, 100)
    : job.description.slice(0, 100);

  // Auto-collapse done jobs after 30s
  const collapseRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isDone || !collapseRef.current) return;
    const timer = setTimeout(() => {
      if (collapseRef.current) {
        collapseRef.current.style.opacity = '0';
        collapseRef.current.style.maxHeight = '0';
        collapseRef.current.style.overflow = 'hidden';
      }
    }, 30_000);
    return () => clearTimeout(timer);
  }, [isDone]);

  return (
    <div
      ref={collapseRef}
      className={`rounded-lg border p-4 space-y-2 transition-all duration-700 ${
        isDone ? 'opacity-60' : ''
      } ${style.border}`}
      style={{ backgroundColor: '#242B35' }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-semibold text-text tracking-widest">
          {job.agentName}
        </span>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
          <span className={`font-mono text-xs tracking-widest ${style.label}`}>
            {job.status}
          </span>
        </div>
      </div>

      <p className="text-text-dim text-xs leading-relaxed">
        {description.length >= 100 ? `${description}…` : description}
      </p>

      <div className="flex items-center justify-between pt-1">
        <span className="font-mono text-xs text-muted">
          {job.tokensUsed.toLocaleString()} tokens
        </span>
        <span className="font-mono text-xs text-muted">
          {formatElapsed(job.startedAt)}
        </span>
      </div>
    </div>
  );
}

// --- AgentQueue ---

export function AgentQueue() {
  const jobs = useAgentJobsStore((s) => s.jobs);
  const isLoading = useAgentJobsStore((s) => s.isLoading);

  const activeCount = jobs.filter((j) => j.status === 'ACTIVE').length;
  const queuedCount = jobs.filter((j) => j.status === 'QUEUED').length;

  // Show active/queued/blocked first, then done
  const sorted = [...jobs].sort((a, b) => {
    const order: Record<AgentJobStatus, number> = {
      ACTIVE: 0,
      QUEUED: 1,
      BLOCKED: 2,
      COMPLETE: 3,
      FAILED: 4,
    };
    return (order[a.status] ?? 5) - (order[b.status] ?? 5);
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="font-mono text-xs font-semibold tracking-widest text-text-dim uppercase">
            Agent Queue
          </h2>
          <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-border text-text-dim">
            {jobs.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted">
            <span className="text-green-400">{activeCount}</span> active
          </span>
          <span className="font-mono text-xs text-muted">
            <span className="text-yellow-400">{queuedCount}</span> queued
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && (
          <p className="font-mono text-xs text-muted text-center py-8 tracking-widest">
            LOADING...
          </p>
        )}

        {!isLoading && jobs.length === 0 && (
          <div className="flex items-center justify-center h-32">
            <p className="font-mono text-xs text-muted tracking-widest opacity-60">
              No active dispatches.
            </p>
          </div>
        )}

        {sorted.map((job) => (
          <AgentCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}
