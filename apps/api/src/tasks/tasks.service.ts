import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: QueryTasksDto) {
    const { status, limit = 50, offset = 0 } = query;
    const where = status ? { status } : {};

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.task.count({ where }),
    ]);

    return { tasks, total };
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  async create(dto: CreateTaskDto) {
    const task = await this.prisma.task.create({
      data: {
        source: dto.source,
        summary: dto.summary,
        status: dto.status ?? TaskStatus.PENDING,
        priority: dto.priority ?? 5,
        estimatedMinutes: dto.estimatedMinutes,
      },
    });
    this.eventEmitter.emit('task.created', task);
    return task;
  }

  async update(id: string, dto: UpdateTaskDto) {
    await this.findOne(id);
    const task = await this.prisma.task.update({
      where: { id },
      data: dto,
    });
    this.eventEmitter.emit('task.updated', task);
    return task;
  }

  async dismiss(id: string) {
    await this.findOne(id);
    const task = await this.prisma.task.update({
      where: { id },
      data: { status: TaskStatus.DONE, resolvedAt: new Date() },
    });
    this.eventEmitter.emit('task.removed', task);
    return { ok: true };
  }
}
