import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';

interface TrackerMessage {
  id: string | number;
  from?: string;
  to?: string;
  subject?: string;
  body?: string;
}

@Injectable()
export class TelegramPollerService {
  private readonly logger = new Logger(TelegramPollerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron('*/30 * * * * *')
  async poll() {
    try {
      const trackerUrl = process.env.TRACKER_API_URL ?? 'http://172.19.0.19:5000';
      const trackerSecret = process.env.TRACKER_SECRET ?? '';

      const telegramChannel = await this.prisma.channel.findFirst({
        where: { kind: 'telegram', enabled: true },
      });

      if (!telegramChannel) {
        this.logger.warn('No enabled Telegram channel found in DB — skipping poll');
        return;
      }

      const url = `${trackerUrl}/api/messages?to=lochness2`;
      const response = await fetch(url, {
        headers: { 'x-tracker-secret': trackerSecret },
      });

      if (!response.ok) {
        this.logger.warn(`Tracker API returned ${response.status}`);
        return;
      }

      const messages = (await response.json()) as TrackerMessage[];

      const lachlanMessages = messages.filter((m) => m.from === 'lochness91');

      for (const msg of lachlanMessages) {
        const sourceRef = String(msg.id);
        const existing = await this.prisma.task.findFirst({
          where: {
            sourceRef,
            channelId: telegramChannel.id,
          },
        });

        if (!existing) {
          const task = await this.prisma.task.create({
            data: {
              channelId: telegramChannel.id,
              sourceRef,
              title: msg.subject ?? msg.body?.slice(0, 200) ?? 'Telegram message',
              body: msg.body ?? '',
              state: 'intake',
              urgency: 'normal',
              senderName: 'Lachlan',
              senderHandle: 'lochness91',
            },
            include: { channel: true },
          });
          this.eventEmitter.emit('task.created', task);
        }
      }

      await this.prisma.channel.update({
        where: { id: telegramChannel.id },
        data: { lastPolledAt: new Date() },
      });
    } catch (err) {
      this.logger.error('Telegram poller error', err);
    }
  }
}
