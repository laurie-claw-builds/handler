'use client';

import { useEffect } from 'react';
import { useTasksStore } from '@/stores/tasks';
import { useAgentJobsStore } from '@/stores/agentJobs';
import type { Task, AgentJob } from '@/lib/types';

export function useEventStream() {
  const upsertTask = useTasksStore((s) => s.upsertTask);
  const removeTask = useTasksStore((s) => s.removeTask);
  const upsertJob = useAgentJobsStore((s) => s.upsertJob);

  useEffect(() => {
    const es = new EventSource('/api/events', { withCredentials: true });

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

    return () => es.close();
  }, [upsertTask, removeTask, upsertJob]);
}
