'use client';

import { create } from 'zustand';
import type { AgentJob } from '@/lib/types';

interface AgentJobsStore {
  jobs: AgentJob[];
  isLoading: boolean;
  setJobs: (jobs: AgentJob[]) => void;
  upsertJob: (job: AgentJob) => void;
  setLoading: (loading: boolean) => void;
}

export const useAgentJobsStore = create<AgentJobsStore>((set) => ({
  jobs: [],
  isLoading: false,

  setJobs: (jobs) => set({ jobs }),

  upsertJob: (job) =>
    set((state) => {
      const idx = state.jobs.findIndex((j) => j.id === job.id);
      if (idx === -1) {
        return { jobs: [job, ...state.jobs] };
      }
      const next = [...state.jobs];
      next[idx] = job;
      return { jobs: next };
    }),

  setLoading: (loading) => set({ isLoading: loading }),
}));
