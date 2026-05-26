import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    try {
      await this.seedChannels();
      await this.seedWorkflows();
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

  private async seedWorkflows() {
    const count = await this.prisma.workflow.count();
    if (count > 0) return;

    const workflows = [
      {
        code: 'A',
        name: 'New Build',
        description:
          'Full 18-step pipeline: Brief Owner → Architect → UX Designer → Coder → CodeRabbit fix → Reviewer → QA → Deploy.',
        stages: JSON.stringify([
          {
            agentName: 'Brief Owner',
            model: 'claude-sonnet-4-6',
            briefTemplate:
              'Produce a Brief Owner doc for: {{task.title}}\n\n{{task.body}}',
            dependsOnPrev: false,
          },
          {
            agentName: 'Architect',
            model: 'claude-opus-4-7',
            briefTemplate:
              'Read the Brief Owner output:\n{{prevOutput}}\n\nProduce a technical spec.',
            dependsOnPrev: true,
          },
          {
            agentName: 'UX Designer',
            model: 'claude-sonnet-4-6',
            briefTemplate:
              'Read the spec:\n{{prevOutput}}\n\nProduce a UI brief.',
            dependsOnPrev: true,
          },
          {
            agentName: 'Coder',
            model: 'claude-sonnet-4-6',
            briefTemplate:
              'Read the spec and UI brief:\n{{prevOutput}}\n\nBuild the app.',
            dependsOnPrev: true,
          },
          {
            agentName: 'QA',
            model: 'claude-sonnet-4-6',
            briefTemplate: 'Test the build. Report pass/fail.',
            dependsOnPrev: true,
          },
          {
            agentName: 'Deploy',
            model: 'claude-sonnet-4-6',
            briefTemplate: 'Deploy to production.',
            dependsOnPrev: true,
          },
        ]),
      },
      {
        code: 'B',
        name: 'Complex Feature',
        description:
          'Feature addition to existing app: Architect → Coder → QA → Deploy.',
        stages: JSON.stringify([
          {
            agentName: 'Architect',
            model: 'claude-opus-4-7',
            briefTemplate:
              'Feature request:\n{{task.title}}\n\n{{task.body}}\n\nProduce a technical spec.',
            dependsOnPrev: false,
          },
          {
            agentName: 'Coder',
            model: 'claude-sonnet-4-6',
            briefTemplate: 'Spec:\n{{prevOutput}}\n\nBuild the feature.',
            dependsOnPrev: true,
          },
          {
            agentName: 'QA',
            model: 'claude-sonnet-4-6',
            briefTemplate: 'Test the feature.',
            dependsOnPrev: true,
          },
          {
            agentName: 'Deploy',
            model: 'claude-sonnet-4-6',
            briefTemplate: 'Deploy.',
            dependsOnPrev: true,
          },
        ]),
      },
      {
        code: 'C',
        name: 'Hot Fix',
        description: 'Workflow C: 7-gate hot fix for apps in production.',
        stages: JSON.stringify([
          {
            agentName: 'Debugger',
            model: 'claude-sonnet-4-6',
            briefTemplate:
              'Bug: {{task.title}}\n\n{{task.body}}\n\nReproduce and diagnose.',
            dependsOnPrev: false,
          },
          {
            agentName: 'Coder',
            model: 'claude-sonnet-4-6',
            briefTemplate: 'Diagnosis:\n{{prevOutput}}\n\nApply the fix.',
            dependsOnPrev: true,
          },
          {
            agentName: 'QA',
            model: 'claude-sonnet-4-6',
            briefTemplate: 'Verify the fix.',
            dependsOnPrev: true,
          },
          {
            agentName: 'Deploy',
            model: 'claude-sonnet-4-6',
            briefTemplate: 'Deploy the fix.',
            dependsOnPrev: true,
          },
        ]),
      },
      {
        code: 'F',
        name: 'Reverse Engineer',
        description:
          'Full reverse-engineering of an existing codebase. Produces ARCHITECTURE.md.',
        stages: JSON.stringify([
          {
            agentName: 'Architect',
            model: 'claude-opus-4-7',
            briefTemplate:
              'Reverse-engineer this codebase:\n{{task.body}}\n\nProduce a full ARCHITECTURE.md.',
            dependsOnPrev: false,
          },
        ]),
      },
    ];

    await this.prisma.workflow.createMany({ data: workflows, skipDuplicates: true });
    this.logger.log('Default workflows seeded (A, B, C, F).');
  }
}
