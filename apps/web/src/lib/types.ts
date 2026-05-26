// Shared frontend types — aligned with Prisma schema (no Prisma client import)

export type TaskStatus = 'PENDING' | 'ACTIVE' | 'DELEGATED' | 'DONE' | 'SNOOZED';

export type AgentJobStatus = 'QUEUED' | 'ACTIVE' | 'BLOCKED' | 'COMPLETE' | 'FAILED';

export type ChannelType = 'EMAIL' | 'TELEGRAM' | 'ASANA' | 'GITHUB' | 'SHOPIFY' | 'MANUAL';

export interface Task {
  id: string;
  source: string;
  summary: string;
  status: TaskStatus;
  priority: number;
  estimatedMinutes: number | null;
  decisionLog: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface AgentJob {
  id: string;
  agentName: string;
  description: string;
  status: AgentJobStatus;
  tokensUsed: number;
  output: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  taskId: string | null;
}

export interface Channel {
  id: string;
  type: ChannelType;
  label: string;
  config: Record<string, unknown>;
  active: boolean;
  lastPolledAt: string | null;
  createdAt: string;
}

export interface CreateTaskDto {
  source: string;
  summary: string;
  status?: TaskStatus;
  priority?: number;
  estimatedMinutes?: number;
}

export interface CreateAgentJobDto {
  agentName: string;
  description: string;
  taskId?: string;
  status?: AgentJobStatus;
}
