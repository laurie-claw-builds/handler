'use client';

import { useState } from 'react';
import { useTasksStore } from '@/stores/tasks';
import { api } from '@/lib/api';
import type { Task, TaskStatus } from '@/lib/types';

// --- Helpers ---

function formatAge(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

const STATUS_DOT: Record<TaskStatus, string> = {
  PENDING: 'bg-yellow-400',
  ACTIVE: 'bg-green-400',
  DELEGATED: 'bg-blue-400',
  DONE: 'bg-accent',
  SNOOZED: 'bg-gray-400',
};

const PRIORITY_LABEL: Record<number, { label: string; cls: string }> = {
  1: { label: 'BLOCKER', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
  2: { label: 'HIGH', cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  3: { label: 'MED', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
};

function getPriorityStyle(priority: number) {
  return PRIORITY_LABEL[priority] ?? { label: `P${priority}`, cls: 'bg-border text-text-dim border-border' };
}

// --- Task Card ---

interface TaskCardProps {
  task: Task;
  onDismiss: (id: string) => void;
  onDelegate: (task: Task) => void;
}

function TaskCard({ task, onDismiss, onDelegate }: TaskCardProps) {
  const { label: priorityLabel, cls: priorityCls } = getPriorityStyle(task.priority);

  return (
    <div
      className="rounded-lg border border-border p-4 space-y-3 hover:border-accent/40 transition-colors"
      style={{ backgroundColor: '#242B35' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-accent/20 text-accent border border-accent/30 tracking-widest uppercase">
            {task.source}
          </span>
          <span className={`font-mono text-xs px-2 py-0.5 rounded border tracking-widest ${priorityCls}`}>
            {priorityLabel}
          </span>
        </div>
        {task.estimatedMinutes != null && (
          <span className="font-mono text-xs text-muted tabular-nums whitespace-nowrap">
            ~{task.estimatedMinutes} min
          </span>
        )}
      </div>

      <p className="text-text text-sm leading-relaxed">
        {task.summary.length > 80 ? `${task.summary.slice(0, 80)}…` : task.summary}
      </p>

      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[task.status]}`} />
        <span className="font-mono text-xs text-text-dim tracking-widest">{task.status}</span>
        <span className="font-mono text-xs text-muted">&middot; {formatAge(task.createdAt)}</span>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          onClick={() => onDelegate(task)}
          className="font-mono text-xs px-3 py-1 rounded-full border border-border text-text-dim hover:border-accent hover:text-accent transition-colors tracking-widest"
        >
          DELEGATE
        </button>
        <button
          onClick={() => onDismiss(task.id)}
          className="font-mono text-xs px-3 py-1 rounded-full border border-border text-text-dim hover:border-red-400 hover:text-red-400 transition-colors tracking-widest"
        >
          DISMISS
        </button>
        <button
          className="font-mono text-xs px-3 py-1 rounded-full border border-border text-text-dim opacity-40 cursor-not-allowed tracking-widest"
          title="Draft (Wave 3)"
          disabled
        >
          DRAFT
        </button>
      </div>
    </div>
  );
}

// --- TaskInbox ---

export function TaskInbox() {
  const tasks = useTasksStore((s) => s.tasks);
  const isLoading = useTasksStore((s) => s.isLoading);
  const removeTask = useTasksStore((s) => s.removeTask);
  const upsertTask = useTasksStore((s) => s.upsertTask);
  const [needsMe, setNeedsMe] = useState(false);

  const filtered = needsMe
    ? tasks.filter((t) => t.status === 'ACTIVE' || t.priority <= 2)
    : tasks;

  async function handleDismiss(id: string) {
    try {
      await api.tasks.dismiss(id);
      removeTask(id);
    } catch (err) {
      console.error('Dismiss failed:', err);
    }
  }

  async function handleDelegate(task: Task) {
    try {
      await api.agentJobs.create({
        agentName: 'CODER',
        description: task.summary.slice(0, 200),
        taskId: task.id,
      });
      const updated = await api.tasks.update(task.id, { status: 'DELEGATED' });
      upsertTask(updated);
    } catch (err) {
      console.error('Delegate failed:', err);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="font-mono text-xs font-semibold tracking-widest text-text-dim uppercase">
            Task Inbox
          </h2>
          <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-border text-text-dim">
            {filtered.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setNeedsMe((v) => !v)}
            className={`font-mono text-xs px-2 py-0.5 rounded border tracking-widest transition-colors ${
              needsMe
                ? 'border-accent text-accent bg-accent/10'
                : 'border-border text-text-dim hover:border-accent/50'
            }`}
          >
            NEEDS ME
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="font-mono text-xs text-muted tracking-widest">LIVE</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && (
          <p className="font-mono text-xs text-muted text-center py-8 tracking-widest">
            LOADING...
          </p>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="flex items-center justify-center h-32">
            <p className="font-mono text-xs text-muted tracking-widest opacity-60">
              All clear. PA is watching.
            </p>
          </div>
        )}

        {filtered.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDismiss={handleDismiss}
            onDelegate={handleDelegate}
          />
        ))}
      </div>
    </div>
  );
}
