import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { AgentJobStatus } from '@prisma/client';

export class UpdateAgentJobDto {
  @IsOptional()
  @IsEnum(AgentJobStatus)
  status?: AgentJobStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  tokensUsed?: number;

  @IsOptional()
  @IsString()
  output?: string;
}
