import { Module } from '@nestjs/common';
import { AgentJobsController } from './agent-jobs.controller';
import { AgentJobsService } from './agent-jobs.service';

@Module({
  controllers: [AgentJobsController],
  providers: [AgentJobsService],
  exports: [AgentJobsService],
})
export class AgentJobsModule {}
