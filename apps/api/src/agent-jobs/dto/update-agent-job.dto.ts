import { IsString, IsOptional, IsEnum, IsNumber, IsInt } from 'class-validator';
import { AgentJobStatus } from '@prisma/client';

export class UpdateAgentJobDto {
  @IsEnum(AgentJobStatus) @IsOptional() status?: AgentJobStatus;
  @IsNumber() @IsOptional() costUsd?: number;
  @IsInt() @IsOptional() tokensIn?: number;
  @IsInt() @IsOptional() tokensOut?: number;
  @IsString() @IsOptional() lastActionTail?: string;
  @IsString() @IsOptional() output?: string;
  @IsString() @IsOptional() error?: string;
}
