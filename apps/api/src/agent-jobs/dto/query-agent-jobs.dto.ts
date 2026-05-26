import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AgentJobStatus } from '@prisma/client';

export class QueryAgentJobsDto {
  @IsEnum(AgentJobStatus) @IsOptional() status?: AgentJobStatus;
  @IsInt() @Min(0) @IsOptional() @Type(() => Number) limit?: number = 20;
  @IsInt() @Min(0) @IsOptional() @Type(() => Number) offset?: number = 0;
}
