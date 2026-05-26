import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { TaskState } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: QueryTasksDto) {
    const { state, limit = 50, offset = 0 } = query;
    const where = state ? { state } : {};

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: { channel: true },
      }),
      this.prisma.task.count({ where }),
    ]);

    return { tasks, total };
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { channel: true },
    });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  async create(dto: CreateTaskDto) {
    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        body: dto.body,
        channelId: dto.channelId,
        sourceRef: dto.sourceRef,
        sourceUrl: dto.sourceUrl,
        summary: dto.summary,
        senderName: dto.senderName,
        senderHandle: dto.senderHandle,
        urgency: dto.urgency,
        domain: dto.domain,
        state: dto.state,
        estimatedMinutes: dto.estimatedMinutes,
      },
      include: { channel: true },
    });
    this.eventEmitter.emit('task.created', task);
    return task;
  }

  async update(id: string, dto: UpdateTaskDto) {
    await this.findOne(id);

    const resolvedAt =
      dto.state === 'resolved' || dto.state === 'dismissed'
        ? new Date()
        : dto.state !== undefined
          ? null
          : undefined;

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        summary: dto.summary,
        urgency: dto.urgency,
        domain: dto.domain,
        state: dto.state,
        estimatedMinutes: dto.estimatedMinutes,
        ...(resolvedAt !== undefined ? { resolvedAt } : {}),
      },
      include: { channel: true },
    });
    this.eventEmitter.emit('task.updated', task);
    return task;
  }

  async dismiss(id: string) {
    await this.findOne(id);
    const task = await this.prisma.task.update({
      where: { id },
      data: { state: 'dismissed' as TaskState, resolvedAt: new Date() },
    });
    this.eventEmitter.emit('task.removed', { id: task.id });
    return { ok: true };
  }
}
