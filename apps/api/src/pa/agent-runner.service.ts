import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import Anthropic from '@anthropic-ai/sdk';

const COST_PER_TOKEN: Record<string, { in: number; out: number }> = {
  'claude-haiku-4-5-20251001': { in: 0.0000008, out: 0.0000024 },
  'claude-haiku-4-5': { in: 0.0000008, out: 0.0000024 },
  'claude-sonnet-4-6': { in: 0.000003, out: 0.000015 },
  'claude-opus-4-7': { in: 0.000015, out: 0.000075 },
};

@Injectable()
export class AgentRunnerService {
  private readonly logger = new Logger(AgentRunnerService.name);
  private readonly anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  // In-memory concurrency cap. Works correctly for single-instance deployment (which this always is).
  // For multi-instance, replace with a DB advisory lock or Redis semaphore.
  private readonly runningJobs = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron('*/5 * * * * *')
  async processQueuedJobs() {
    if (this.runningJobs.size >= 2) {
      return;
    }

    try {
      const available = 2 - this.runningJobs.size;
      const jobs = await this.prisma.agentJob.findMany({
        where: { status: 'queued' },
        orderBy: { createdAt: 'asc' },
        take: available,
      });

      for (const job of jobs) {
        if (this.runningJobs.size >= 2) break;
        this.runningJobs.add(job.id);
        this.runJob(job).catch((err) => {
          this.logger.error(`Unhandled error in runJob for ${job.id}`, err);
          this.runningJobs.delete(job.id);
        });
      }
    } catch (err) {
      this.logger.error('AgentRunner processQueuedJobs error', err);
    }
  }

  private async runJob(job: { id: string; model: string; brief: string }) {
    try {
      await this.prisma.agentJob.update({
        where: { id: job.id },
        data: { status: 'running', startedAt: new Date() },
      });
      this.eventEmitter.emit('agentJob.updated', { id: job.id, status: 'running' });

      let accumulatedText = '';
      let chunkCount = 0;

      const stream = this.anthropic.messages.stream({
        model: job.model,
        max_tokens: 8192,
        system:
          'You are a specialist agent. Complete the task described. Write all deliverables to files. Return a 3-5 line summary only.',
        messages: [{ role: 'user', content: job.brief }],
      });

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          const delta = event.delta.text;
          accumulatedText += delta;
          chunkCount++;

          await this.prisma.agentJobLog.create({
            data: {
              agentJobId: job.id,
              kind: 'message',
              content: delta,
            },
          });

          if (chunkCount % 10 === 0) {
            const lastActionTail = accumulatedText.slice(-200);
            await this.prisma.agentJob.update({
              where: { id: job.id },
              data: { lastActionTail },
            });
            this.eventEmitter.emit('agentJob.updated', {
              id: job.id,
              lastActionTail,
              status: 'running',
            });
          }
        }
      }

      const finalMessage = await stream.finalMessage();
      const tokensIn = finalMessage.usage.input_tokens;
      const tokensOut = finalMessage.usage.output_tokens;
      const rates = COST_PER_TOKEN[job.model] ?? COST_PER_TOKEN['claude-sonnet-4-6'];
      const costUsd = (tokensIn * rates.in + tokensOut * rates.out).toFixed(4);

      let finalStatus: 'completed' | 'waiting_on_lachlan' = 'completed';
      if (accumulatedText.includes('<NEEDS_LACHLAN>')) {
        finalStatus = 'waiting_on_lachlan';
      }

      await this.prisma.agentJob.update({
        where: { id: job.id },
        data: {
          status: finalStatus,
          completedAt: new Date(),
          output: accumulatedText,
          tokensIn,
          tokensOut,
          costUsd,
        },
      });

      await this.prisma.agentJobLog.create({
        data: {
          agentJobId: job.id,
          kind: 'status',
          content: `Job ${finalStatus}. Tokens in: ${tokensIn}, out: ${tokensOut}`,
        },
      });

      const updatedJob = await this.prisma.agentJob.findUnique({ where: { id: job.id } });
      this.eventEmitter.emit('agentJob.updated', updatedJob);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(`AgentRunner job ${job.id} failed: ${errorMessage}`);

      try {
        await this.prisma.agentJob.update({
          where: { id: job.id },
          data: {
            status: 'failed',
            error: errorMessage,
            completedAt: new Date(),
          },
        });

        await this.prisma.agentJobLog.create({
          data: {
            agentJobId: job.id,
            kind: 'error',
            content: errorMessage,
          },
        });

        this.eventEmitter.emit('agentJob.updated', { id: job.id, status: 'failed', error: errorMessage });
      } catch (updateErr) {
        this.logger.error(`Failed to update job ${job.id} after error`, updateErr);
      }
    } finally {
      this.runningJobs.delete(job.id);
    }
  }
}
