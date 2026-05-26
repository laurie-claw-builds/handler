import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../prisma/prisma.module';
import { TasksModule } from '../tasks/tasks.module';
import { AgentJobsModule } from '../agent-jobs/agent-jobs.module';
import { MissivePollerService } from './missive-poller.service';
import { TelegramPollerService } from './telegram-poller.service';
import { GitHubWebhookController } from './github-webhook.controller';
import { GitHubWebhookService } from './github-webhook.service';
import { PaRouterService } from './pa-router.service';
import { AgentRunnerService } from './agent-runner.service';

@Module({
  imports: [
    HttpModule,
    PrismaModule,
    TasksModule,
    AgentJobsModule,
  ],
  controllers: [GitHubWebhookController],
  providers: [
    MissivePollerService,
    TelegramPollerService,
    GitHubWebhookService,
    PaRouterService,
    AgentRunnerService,
  ],
})
export class PaModule {}
