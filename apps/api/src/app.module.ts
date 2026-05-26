import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { TasksModule } from './tasks/tasks.module';
import { AgentJobsModule } from './agent-jobs/agent-jobs.module';
import { EventsModule } from './events/events.module';
import { SeedModule } from './seed/seed.module';
import { PaModule } from './pa/pa.module';
import { FleetModule } from './fleet/fleet.module';
import { WorkflowsModule } from './workflows/workflows.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    HealthModule,
    TasksModule,
    AgentJobsModule,
    EventsModule,
    SeedModule,
    PaModule,
    FleetModule,
    WorkflowsModule,
  ],
})
export class AppModule {}
