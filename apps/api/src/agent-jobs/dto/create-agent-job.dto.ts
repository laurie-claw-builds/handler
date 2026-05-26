import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AgentJobStatus } from '@prisma/client';

export class CreateAgentJobDto {
  @IsString()
  agentName!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  taskId?: string;

  @IsOptional()
  @IsEnum(AgentJobStatus)
  status?: AgentJobStatus;
}
