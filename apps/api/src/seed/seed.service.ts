import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ChannelType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    await this.seedChannels();
  }

  private async seedChannels() {
    const count = await this.prisma.channel.count();
    if (count > 0) return;

    const defaults = [
      {
        type: ChannelType.TELEGRAM,
        label: 'Telegram (Lochness Bot)',
        config: { pollIntervalSec: 30 },
        active: true,
      },
      {
        type: ChannelType.GITHUB,
        label: 'GitHub (laurie-claw-builds)',
        config: { pollIntervalSec: 0 },
        active: true,
      },
    ];

    for (const channel of defaults) {
      await this.prisma.channel.upsert({
        where: { type_label: { type: channel.type, label: channel.label } },
        create: channel,
        update: {},
      });
    }

    this.logger.log('Default channels seeded.');
  }
}
