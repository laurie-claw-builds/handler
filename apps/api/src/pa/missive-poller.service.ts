import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';

interface MissiveMessage {
  body?: string;
}

interface MissiveConversation {
  id: string;
  subject?: string;
  latest_message?: MissiveMessage;
  assignees?: Array<{ name?: string }>;
}

interface MissiveResponse {
  conversations?: MissiveConversation[];
}

@Injectable()
export class MissivePollerService {
  private readonly logger = new Logger(MissivePollerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron('*/60 * * * * *')
  async poll() {
    const token = process.env.MISSIVE_API_TOKEN;
    if (!token) {
      return;
    }

    try {
      let missiveChannel = await this.prisma.channel.findFirst({
        where: { kind: 'missive', enabled: true },
      });

      if (!missiveChannel) {
        missiveChannel = await this.prisma.channel.create({
          data: {
            kind: 'missive',
            displayName: 'Missive',
            pollIntervalSec: 60,
            enabled: true,
          },
        });
      }

      const since = missiveChannel.lastPolledAt
        ? Math.floor(missiveChannel.lastPolledAt.getTime() / 1000)
        : Math.floor(Date.now() / 1000) - 3600;

      const url = `https://public.missiveapp.com/v1/conversations?limit=25&since=${since}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        this.logger.warn(`Missive API returned ${response.status}`);
        return;
      }

      const data = (await response.json()) as MissiveResponse;
      const conversations = data.conversations ?? [];

      for (const conv of conversations) {
        const existing = await this.prisma.task.findFirst({
          where: {
            sourceRef: conv.id,
            channelId: missiveChannel.id,
          },
        });

        if (!existing) {
          try {
            // DB unique constraint on (channelId, sourceRef) handles concurrent duplicate inserts
            const task = await this.prisma.task.create({
              data: {
                channelId: missiveChannel.id,
                sourceRef: conv.id,
                sourceUrl: `https://mail.missiveapp.com/#${conv.id}`,
                title: conv.subject ?? '(no subject)',
                body: conv.latest_message?.body ?? '',
                senderName: conv.assignees?.[0]?.name,
                state: 'intake',
                urgency: 'normal',
              },
              include: { channel: true },
            });
            this.eventEmitter.emit('task.created', task);
          } catch (err) {
            if ((err as { code?: string })?.code === 'P2002') return; // duplicate — already created
            throw err;
          }
        }
      }

      await this.prisma.channel.update({
        where: { id: missiveChannel.id },
        data: { lastPolledAt: new Date() },
      });
    } catch (err) {
      this.logger.error('Missive poller error', err);
    }
  }
}
