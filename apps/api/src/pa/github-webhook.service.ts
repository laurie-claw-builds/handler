import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

interface GitHubCheckRunPayload {
  action: string;
  check_run: {
    id: number;
    name: string;
    conclusion: string | null;
    html_url: string;
  };
  repository: {
    name: string;
    full_name: string;
  };
}

interface GitHubPullRequestPayload {
  action: string;
  pull_request: {
    id: number;
    number: number;
    title: string;
    body: string | null;
    html_url: string;
    merged?: boolean;
    user: {
      login: string;
    };
  };
  repository: {
    name: string;
    full_name: string;
  };
}

interface GitHubPullRequestReviewPayload {
  action: string;
  review: {
    id: number;
    state: string;
    body: string | null;
    html_url: string;
    user: {
      login: string;
    };
  };
  pull_request: {
    number: number;
    title: string;
    id: number;
  };
  repository: {
    name: string;
    full_name: string;
  };
}

type GitHubPayload =
  | GitHubCheckRunPayload
  | GitHubPullRequestPayload
  | GitHubPullRequestReviewPayload
  | Record<string, unknown>;

export interface HandleWebhookResult {
  ok: boolean;
  skipped?: boolean;
}

@Injectable()
export class GitHubWebhookService {
  private readonly logger = new Logger(GitHubWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  verifySignature(rawBody: Buffer, signature: string | undefined): boolean {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) {
      return true;
    }
    if (!signature) {
      return false;
    }
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBody);
    const expected = `sha256=${hmac.digest('hex')}`;
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  }

  async handle(event: string, payload: GitHubPayload): Promise<HandleWebhookResult> {
    const githubChannel = await this.prisma.channel.findFirst({
      where: { kind: 'github', enabled: true },
    });

    if (!githubChannel) {
      this.logger.warn('No enabled GitHub channel found in DB');
      return { ok: true, skipped: true };
    }

    try {
      if (event === 'check_run') {
        return this.handleCheckRun(payload as GitHubCheckRunPayload, githubChannel.id);
      }
      if (event === 'pull_request') {
        return this.handlePullRequest(payload as GitHubPullRequestPayload, githubChannel.id);
      }
      if (event === 'pull_request_review') {
        return this.handlePullRequestReview(
          payload as GitHubPullRequestReviewPayload,
          githubChannel.id,
        );
      }
      return { ok: true, skipped: true };
    } catch (err) {
      this.logger.error(`GitHub webhook handler error for event ${event}`, err);
      return { ok: true, skipped: true };
    }
  }

  private async handleCheckRun(
    payload: GitHubCheckRunPayload,
    channelId: string,
  ): Promise<HandleWebhookResult> {
    if (
      payload.action !== 'completed' ||
      !['failure', 'timed_out'].includes(payload.check_run.conclusion ?? '')
    ) {
      return { ok: true, skipped: true };
    }

    const sourceRef = `check_run:${payload.check_run.id}`;
    const existing = await this.prisma.task.findFirst({ where: { sourceRef, channelId } });
    if (existing) return { ok: true };

    const task = await this.prisma.task.create({
      data: {
        channelId,
        sourceRef,
        sourceUrl: payload.check_run.html_url,
        title: `CI failed: ${payload.repository.name} — ${payload.check_run.name}`,
        body: `Check run failed.\nRepo: ${payload.repository.full_name}\nURL: ${payload.check_run.html_url}`,
        state: 'intake',
        urgency: 'high',
        domain: 'agent-build',
      },
      include: { channel: true },
    });
    this.eventEmitter.emit('task.created', task);
    return { ok: true };
  }

  private async handlePullRequest(
    payload: GitHubPullRequestPayload,
    channelId: string,
  ): Promise<HandleWebhookResult> {
    if (payload.action === 'closed' && payload.pull_request.merged === true) {
      const sourceRef = `pr:${payload.pull_request.id}`;
      const existing = await this.prisma.task.findFirst({ where: { sourceRef, channelId } });
      if (existing) {
        const task = await this.prisma.task.update({
          where: { id: existing.id },
          data: { state: 'resolved', resolvedAt: new Date() },
          include: { channel: true },
        });
        this.eventEmitter.emit('task.updated', task);
      }
      return { ok: true };
    }

    if (!['opened', 'ready_for_review'].includes(payload.action)) {
      return { ok: true, skipped: true };
    }

    const sourceRef = `pr:${payload.pull_request.id}`;
    const existing = await this.prisma.task.findFirst({ where: { sourceRef, channelId } });
    if (existing) return { ok: true };

    const task = await this.prisma.task.create({
      data: {
        channelId,
        sourceRef,
        sourceUrl: payload.pull_request.html_url,
        title: `PR opened: ${payload.repository.name} #${payload.pull_request.number} — ${payload.pull_request.title}`,
        body: payload.pull_request.body ?? '',
        state: 'lane',
        urgency: 'normal',
        senderName: payload.pull_request.user.login,
        senderHandle: payload.pull_request.user.login,
      },
      include: { channel: true },
    });
    this.eventEmitter.emit('task.created', task);
    return { ok: true };
  }

  private async handlePullRequestReview(
    payload: GitHubPullRequestReviewPayload,
    channelId: string,
  ): Promise<HandleWebhookResult> {
    if (
      payload.action !== 'submitted' ||
      payload.review.state !== 'changes_requested' ||
      payload.review.user.login !== 'coderabbitai[bot]'
    ) {
      return { ok: true, skipped: true };
    }

    const sourceRef = `review:${payload.review.id}`;
    const existing = await this.prisma.task.findFirst({ where: { sourceRef, channelId } });
    if (existing) return { ok: true };

    const task = await this.prisma.task.create({
      data: {
        channelId,
        sourceRef,
        sourceUrl: payload.review.html_url,
        title: `CodeRabbit: changes requested on ${payload.repository.name} #${payload.pull_request.number}`,
        body: payload.review.body ?? '',
        state: 'intake',
        urgency: 'high',
        domain: 'agent-build',
      },
      include: { channel: true },
    });
    this.eventEmitter.emit('task.created', task);
    return { ok: true };
  }
}
