'use client';

import { useEffect } from 'react';
import { useEventStream } from '@/hooks/useEventStream';
import { useTasksStore } from '@/stores/tasks';
import { useAgentJobsStore } from '@/stores/agentJobs';
import { api } from '@/lib/api';

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const setTasks = useTasksStore((s) => s.setTasks);
  const setTasksLoading = useTasksStore((s) => s.setLoading);
  const setJobs = useAgentJobsStore((s) => s.setJobs);
  const setJobsLoading = useAgentJobsStore((s) => s.setLoading);

  // Wire SSE — runs once at shell level
  useEventStream();

  // Initial data load
  useEffect(() => {
    setTasksLoading(true);
    api.tasks
      .list()
      .then((res) => setTasks(res.tasks))
      .catch(console.error)
      .finally(() => setTasksLoading(false));

    setJobsLoading(true);
    api.agentJobs
      .list()
      .then((res) => setJobs(res.jobs))
      .catch(console.error)
      .finally(() => setJobsLoading(false));
  }, [setTasks, setTasksLoading, setJobs, setJobsLoading]);

  return <>{children}</>;
}
