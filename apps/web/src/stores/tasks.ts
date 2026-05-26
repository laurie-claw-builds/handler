'use client';

import { create } from 'zustand';
import type { Task } from '@/lib/types';

interface TasksStore {
  tasks: Task[];
  isLoading: boolean;
  setTasks: (tasks: Task[]) => void;
  upsertTask: (task: Task) => void;
  removeTask: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useTasksStore = create<TasksStore>((set) => ({
  tasks: [],
  isLoading: false,

  setTasks: (tasks) => set({ tasks }),

  upsertTask: (task) =>
    set((state) => {
      const idx = state.tasks.findIndex((t) => t.id === task.id);
      if (idx === -1) {
        return { tasks: [task, ...state.tasks] };
      }
      const next = [...state.tasks];
      next[idx] = task;
      return { tasks: next };
    }),

  removeTask: (id) =>
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),

  setLoading: (loading) => set({ isLoading: loading }),
}));
