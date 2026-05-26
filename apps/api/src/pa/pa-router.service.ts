import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import Anthropic from '@anthropic-ai/sdk';

interface ClassificationResult {
  summary: string;
  urgency: 'low' | 'normal' | 'high' | 'blocker';
  domain: string;
  estimatedMinutes: number;
  action: 'auto_dispatch' | 'lane' | 'dismiss';
  agentName: string | null;
  agentModel: string | null;
  brief: string | null;
}

@Injectable()
export class PaRouterService {
  private readonly logger = new Logger(PaRouterService.name);
  private readonly anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron('*/5 * * * * *')
  async processIntakeTasks() {
    try {
      const tasks = await this.prisma.task.findMany({
        where: { state: 'intake' },
        orderBy: { createdAt: 'asc' },
        take: 5,
        include: { channel: true },
      });

      for (const task of tasks) {
        await this.classifyTask(task);
      }
    } catch (err) {
      this.logger.error('PaRouter processIntakeTasks error', err);
    }
  }

  private async classifyTask(task: {
    id: string;
    title: string;
    body: string;
    senderName: string | null;
    channel?: { displayName: string } | null;
  }) {
    try {
      const userMessage = [
        `Title: ${task.title}`,
        ``,
        `Body: ${task.body}`,
        ``,
        `Source: ${task.channel?.displayName ?? 'unknown'}`,
        `Sender: ${task.senderName ?? 'unknown'}`,
      ].join('\n');

      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: `You are a task classifier for Lachlan Russell, Head of Product at PBT (dance education company).
Your job is to classify incoming tasks and decide how to route them.

Agent roster (agents Lachlan can dispatch):
- Debugger: on-call for bugs and blockers in any app
- Coder: builds new features
- Architect: writes technical specs from briefs
- QA: tests builds and signs off
- Deploy: ships to production
- PA: general research, drafting responses, analysis
- L&S: standards and governance for the agent fleet
- Data Analytics Specialist: PostHog, Sentry, analytics

Return ONLY a JSON object with no markdown:
{
  "summary": "<one sentence, max 100 chars, capturing what the task is>",
  "urgency": "low" | "normal" | "high" | "blocker",
  "domain": "<one of: merch, china, agent-build, cx, finance, ops, personal>",
  "estimatedMinutes": <integer, realistic estimate>,
  "action": "auto_dispatch" | "lane" | "dismiss",
  "agentName": "<agent name if action=auto_dispatch, else null>",
  "agentModel": "<model if auto_dispatch, else null>",
  "brief": "<brief for the agent if auto_dispatch, else null>"
}

Rules:
- auto_dispatch ONLY for: failed CI (route to Debugger), CodeRabbit review requests (route to Coder), clearly agent-actionable tasks with full context
- lane for: tasks needing Lachlan's decision, tasks with missing context, all Telegram messages from Lachlan
- dismiss for: spam, notifications with no action required, automated status emails
- Never auto_dispatch Telegram messages from lochness91 (Lachlan) — always lane them`,
        messages: [{ role: 'user', content: userMessage }],
      });

      const text =
        response.content[0].type === 'text' ? response.content[0].text : '';
      let result: ClassificationResult;

      try {
        result = JSON.parse(text) as ClassificationResult;
      } catch {
        this.logger.warn(`Failed to parse classification for task ${task.id}: ${text}`);
        await this.prisma.task.update({
          where: { id: task.id },
          data: { state: 'lane', urgency: 'normal', summary: task.title },
        });
        const updated = await this.prisma.task.findUnique({
          where: { id: task.id },
          include: { channel: true },
        });
        this.eventEmitter.emit('task.updated', updated);
        return;
      }

      let newState: string;
      if (result.action === 'auto_dispatch') {
        newState = 'auto_dispatched';
      } else if (result.action === 'dismiss') {
        newState = 'dismissed';
      } else {
        newState = 'lane';
      }

      const updatedTask = await this.prisma.task.update({
        where: { id: task.id },
        data: {
          summary: result.summary,
          urgency: result.urgency,
          domain: result.domain,
          estimatedMinutes: result.estimatedMinutes,
          state: newState as 'auto_dispatched' | 'dismissed' | 'lane',
          ...(newState === 'resolved' || newState === 'dismissed'
            ? { resolvedAt: new Date() }
            : {}),
        },
        include: { channel: true },
      });

      if (result.action === 'auto_dispatch' && result.agentName) {
        const job = await this.prisma.agentJob.create({
          data: {
            taskId: task.id,
            agentName: result.agentName,
            model: result.agentModel ?? 'claude-sonnet-4-6',
            brief: result.brief ?? task.title,
            status: 'queued',
          },
        });
        this.eventEmitter.emit('agentJob.created', job);
      }

      this.eventEmitter.emit('task.updated', updatedTask);
    } catch (err) {
      this.logger.error(`Classification failed for task ${task.id}`, err);
      await this.prisma.task.update({
        where: { id: task.id },
        data: { state: 'lane' },
      });
      const updated = await this.prisma.task.findUnique({
        where: { id: task.id },
        include: { channel: true },
      });
      this.eventEmitter.emit('task.updated', updated);
    }
  }
}
