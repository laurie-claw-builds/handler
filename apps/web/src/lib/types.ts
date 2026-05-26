export type ChannelKind = 'missive' | 'telegram' | 'github' | 'manual';
export type TaskUrgency = 'low' | 'normal' | 'high' | 'blocker';
export type TaskState = 'intake' | 'auto_dispatched' | 'lane' | 'in_progress' | 'awaiting_lachlan' | 'resolved' | 'dismissed';
export type AgentJobStatus = 'queued' | 'running' | 'waiting_on_lachlan' | 'completed' | 'failed' | 'cancelled';

export interface Channel {
  id: string;
  kind: ChannelKind;
  displayName: string;
  config: Record<string, unknown>;
  pollIntervalSec: number;
  lastPolledAt: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  channelId: string | null;
  channel?: Channel;
  sourceRef: string | null;
  sourceUrl: string | null;
  title: string;
  body: string;
  summary: string | null;
  senderName: string | null;
  senderHandle: string | null;
  urgency: TaskUrgency;
  domain: string | null;
  state: TaskState;
  estimatedMinutes: number | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface AgentJob {
  id: string;
  taskId: string | null;
  workflowRunId: string | null;
  stageIndex: number | null;
  agentName: string;
  model: string;
  brief: string;
  status: AgentJobStatus;
  startedAt: string | null;
  completedAt: string | null;
  costUsd: string;
  tokensIn: number;
  tokensOut: number;
  lastActionTail: string | null;
  output: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  body: string;
  channelId?: string;
  sourceRef?: string;
  sourceUrl?: string;
  summary?: string;
  urgency?: TaskUrgency;
  domain?: string;
  state?: TaskState;
}

export interface CreateAgentJobDto {
  agentName: string;
  model: string;
  brief: string;
  taskId?: string;
}

export interface FleetAgent {
  agentName: string;
  title: string;
  summary: string;
  model: string;
  filePath: string;
  lastUsed: string | null;
  runCount: number;
}

export interface Workflow {
  id: string;
  code: string;
  name: string;
  description: string;
  stages: unknown;
}
