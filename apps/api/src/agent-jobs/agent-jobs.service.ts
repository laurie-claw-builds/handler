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
        include: {
          logs: { orderBy: { ts: 'desc' }, take: 1 },
        },
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
        model: dto.model,
        brief: dto.brief,
        taskId: dto.taskId,
        workflowRunId: dto.workflowRunId,
        stageIndex: dto.stageIndex,
        status: 'queued' as AgentJobStatus,
      },
    });
    this.eventEmitter.emit('agentJob.created', job);
    return job;
  }

  async update(id: string, dto: UpdateAgentJobDto) {
    await this.findOne(id);

    const data: Record<string, unknown> = {};
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.costUsd !== undefined) data.costUsd = dto.costUsd;
    if (dto.tokensIn !== undefined) data.tokensIn = dto.tokensIn;
    if (dto.tokensOut !== undefined) data.tokensOut = dto.tokensOut;
    if (dto.lastActionTail !== undefined) data.lastActionTail = dto.lastActionTail;
    if (dto.output !== undefined) data.output = dto.output;
    if (dto.error !== undefined) data.error = dto.error;

    if (dto.status === 'running') {
      data.startedAt = new Date();
    }
    if (dto.status === 'completed' || dto.status === 'failed' || dto.status === 'cancelled') {
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
