import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    try {
      await this.seedChannels();
    } catch (err) {
      console.warn('Seed skipped (DB not ready):', (err as Error).message);
    }
  }

  private async seedChannels() {
    const count = await this.prisma.channel.count();
    if (count > 0) return;

    await this.prisma.channel.createMany({
      data: [
        {
          kind: 'telegram',
          displayName: 'Telegram (Lochness Bot)',
          pollIntervalSec: 30,
          enabled: true,
        },
        {
          kind: 'github',
          displayName: 'GitHub (laurie-claw-builds)',
          pollIntervalSec: 0,
          enabled: true,
        },
      ],
      skipDuplicates: true,
    });

    this.logger.log('Default channels seeded.');
  }
}
