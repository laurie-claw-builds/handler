import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentJobDto } from './dto/create-agent-job.dto';
import { UpdateAgentJobDto } from './dto/update-agent-job.dto';
import { QueryAgentJobsDto } from './dto/query-agent-jobs.dto';
import { AgentJobStatus } from '@prisma/client';

@Injectable()
export class AgentJobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: QueryAgentJobsDto) {
    const { status, limit = 20, offset = 0 } = query;
    const where = status ? { status } : {};

    const [jobs, total] = await Promise.all([
      this.prisma.agentJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.agentJob.count({ where }),
    ]);

    return { jobs, total };
  }

  async findOne(id: string) {
    const job = await this.prisma.agentJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException(`AgentJob ${id} not found`);
    return job;
  }

  async create(dto: CreateAgentJobDto) {
    const job = await this.prisma.agentJob.create({
      data: {
        agentName: dto.agentName,
        description: dto.description,
        status: dto.status ?? AgentJobStatus.QUEUED,
        taskId: dto.taskId,
      },
    });
    this.eventEmitter.emit('agentJob.created', job);
    return job;
  }

  async update(id: string, dto: UpdateAgentJobDto) {
    await this.findOne(id);

    const data: Record<string, unknown> = { ...dto };
    if (dto.status === AgentJobStatus.ACTIVE) {
      data.startedAt = new Date();
    }
    if (
      dto.status === AgentJobStatus.COMPLETE ||
      dto.status === AgentJobStatus.FAILED
    ) {
      data.completedAt = new Date();
    }

    const job = await this.prisma.agentJob.update({
      where: { id },
      data,
    });
    this.eventEmitter.emit('agentJob.updated', job);
    return job;
  }
}
