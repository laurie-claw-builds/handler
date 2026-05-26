import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface AgentDefinition {
  agentName: string;
  title: string;
  summary: string;
  model: string;
  filePath: string;
}

export interface AgentWithStats extends AgentDefinition {
  lastUsed: string | null;
  runCount: number;
}

const SCAN_DIRS = [
  '/fleet/agents',
  '/fleet/shared',
];

const RESCAN_INTERVAL_MS = 5 * 60 * 1000;

@Injectable()
export class FleetService implements OnApplicationBootstrap {
  private readonly logger = new Logger(FleetService.name);
  private agents: AgentDefinition[] = [];
  private rescanTimer: NodeJS.Timeout | null = null;

  constructor(private readonly prisma: PrismaService) {}

  onApplicationBootstrap() {
    this.scanAgents();
    this.rescanTimer = setInterval(() => this.scanAgents(), RESCAN_INTERVAL_MS);
  }

  private scanAgents() {
    const found: AgentDefinition[] = [];

    for (const dir of SCAN_DIRS) {
      if (!fs.existsSync(dir)) {
        this.logger.warn(`Fleet directory not found (dev env?): ${dir}`);
        continue;
      }

      let entries: string[];
      try {
        entries = fs.readdirSync(dir);
      } catch (err) {
        this.logger.warn(`Could not read fleet dir ${dir}: ${(err as Error).message}`);
        continue;
      }

      for (const entry of entries) {
        const claudeMdPath = path.join(dir, entry, 'CLAUDE.md');
        if (!fs.existsSync(claudeMdPath)) continue;

        try {
          const content = fs.readFileSync(claudeMdPath, 'utf8');
          const def = this.parseClaudeMd(entry, claudeMdPath, content);
          found.push(def);
        } catch (err) {
          this.logger.warn(`Failed to parse ${claudeMdPath}: ${(err as Error).message}`);
        }
      }
    }

    this.agents = found;
    this.logger.log(`Fleet scan complete: ${found.length} agents found.`);
  }

  private parseClaudeMd(dirName: string, filePath: string, content: string): AgentDefinition {
    const lines = content.split('\n');

    // Extract title: first H1 line
    let title = dirName;
    for (const line of lines) {
      if (line.startsWith('# ')) {
        title = line.replace(/^# /, '').trim();
        break;
      }
    }

    // Extract summary: first non-empty paragraph after the H1
    let summary = '';
    let pastH1 = false;
    for (const line of lines) {
      if (!pastH1) {
        if (line.startsWith('# ')) pastH1 = true;
        continue;
      }
      const trimmed = line.trim();
      if (trimmed.length > 0) {
        summary = trimmed.slice(0, 200);
        break;
      }
    }

    // Extract model: first match of claude-* pattern
    const modelMatch = content.match(/claude-(opus|sonnet|haiku)-[\d][\d.\-]+[\w]*/);
    const model = modelMatch ? modelMatch[0] : 'claude-sonnet-4-6';

    return {
      agentName: dirName,
      title,
      summary,
      model,
      filePath,
    };
  }

  async getAgentsWithStats(): Promise<AgentWithStats[]> {
    if (this.agents.length === 0) {
      return [];
    }

    type UsageRow = { agentName: string; lastUsed: Date | null; runCount: bigint };

    let usageRows: UsageRow[] = [];
    try {
      usageRows = await this.prisma.$queryRaw<UsageRow[]>(
        Prisma.sql`
          SELECT "agentName", MAX("createdAt") as "lastUsed", COUNT(*) as "runCount"
          FROM "AgentJob"
          GROUP BY "agentName"
        `,
      );
    } catch (err) {
      this.logger.warn(`Fleet stats query failed: ${(err as Error).message}`);
    }

    const statsMap = new Map<string, { lastUsed: string | null; runCount: number }>();
    for (const row of usageRows) {
      statsMap.set(row.agentName, {
        lastUsed: row.lastUsed ? row.lastUsed.toISOString() : null,
        runCount: Number(row.runCount),
      });
    }

    return this.agents.map((agent) => {
      const stats = statsMap.get(agent.agentName);
      return {
        ...agent,
        lastUsed: stats?.lastUsed ?? null,
        runCount: stats?.runCount ?? 0,
      };
    });
  }
}
