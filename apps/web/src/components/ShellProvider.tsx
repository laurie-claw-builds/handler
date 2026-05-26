'use client';

import { useEffect } from 'react';
import { useTasksStore } from '@/stores/tasks';
import { useAgentJobsStore } from '@/stores/agentJobs';
import type { Task, AgentJob } from '@/lib/types';

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const setTasks = useTasksStore((s) => s.setTasks);
  const setTasksLoading = useTasksStore((s) => s.setLoading);
  const upsertTask = useTasksStore((s) => s.upsertTask);
  const removeTask = useTasksStore((s) => s.removeTask);
  const setJobs = useAgentJobsStore((s) => s.setJobs);
  const setJobsLoading = useAgentJobsStore((s) => s.setLoading);
  const upsertJob = useAgentJobsStore((s) => s.upsertJob);

  useEffect(() => {
    let es: EventSource | null = null;

    async function bootstrap() {
      // 1. Fetch snapshot first
      setTasksLoading(true);
      setJobsLoading(true);
      try {
        const [tasksRes, jobsRes] = await Promise.all([
          fetch('/api/tasks?limit=50', { credentials: 'include' }),
          fetch('/api/agent-jobs?limit=20', { credentials: 'include' }),
        ]);
        if (tasksRes.ok) {
          const data = await tasksRes.json();
          setTasks(data.tasks ?? []);
        }
        if (jobsRes.ok) {
          const data = await jobsRes.json();
          setJobs(data.jobs ?? []);
        }
      } catch (err) {
        console.error('Failed to load initial snapshot:', err);
      } finally {
        setTasksLoading(false);
        setJobsLoading(false);
      }

      // 2. Then open SSE
      es = new EventSource('/api/events', { withCredentials: true });
      es.onmessage = (e: MessageEvent<string>) => {
        try {
          const { type, payload } = JSON.parse(e.data) as {
            type: string;
            payload: unknown;
          };
          if (type === 'task.created' || type === 'task.updated') {
            upsertTask(payload as Task);
          } else if (type === 'task.removed') {
            removeTask((payload as { id: string }).id);
          } else if (type === 'agentJob.created' || type === 'agentJob.updated') {
            upsertJob(payload as AgentJob);
          }
        } catch {
          // Malformed SSE message — ignore
        }
      };
      es.onerror = () => {
        // Browser will auto-reconnect on SSE error
      };
    }

    bootstrap();
    return () => es?.close();
  }, [setTasks, setTasksLoading, upsertTask, removeTask, setJobs, setJobsLoading, upsertJob]);

  return <>{children}</>;
}
