import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { Task } from '@prisma/client';

interface WorkflowStage {
  agentName: string;
  model: string;
  briefTemplate: string;
  dependsOnPrev: boolean;
}

function interpolate(template: string, task: Task): string {
  return template
    .replace('{{task.title}}', task.title)
    .replace('{{task.body}}', task.body)
    .replace('{{task.summary}}', task.summary ?? '')
    .replace('{{prevOutput}}', '');
}

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll() {
    const workflows = await this.prisma.workflow.findMany({
      orderBy: { code: 'asc' },
    });
    return { workflows };
  }

  async attachWorkflow(taskId: string, workflowCode: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { code: workflowCode },
    });
    if (!workflow) throw new NotFoundException(`Workflow ${workflowCode} not found`);

    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);

    const stages = workflow.stages as unknown as WorkflowStage[];
    const stage0 = stages[0];

    const workflowRun = await this.prisma.workflowRun.create({
      data: {
        workflowId: workflow.id,
        taskId: task.id,
        state: 'running',
        currentStageIndex: 0,
      },
    });

    const firstJob = await this.prisma.agentJob.create({
      data: {
        taskId: task.id,
        workflowRunId: workflowRun.id,
        stageIndex: 0,
        agentName: stage0.agentName,
        model: stage0.model,
        brief: interpolate(stage0.briefTemplate, task),
        status: 'queued',
      },
    });

    await this.prisma.task.update({
      where: { id: taskId },
      data: { state: 'in_progress' },
    });

    this.eventEmitter.emit('agentJob.created', firstJob);
    this.eventEmitter.emit('task.updated', { ...task, state: 'in_progress' });

    return { workflowRun, firstJobId: firstJob.id };
  }
}
