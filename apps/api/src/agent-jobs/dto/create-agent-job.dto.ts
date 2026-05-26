import { IsString, IsOptional } from 'class-validator';

export class CreateAgentJobDto {
  @IsString() agentName!: string;
  @IsString() model!: string;
  @IsString() brief!: string;
  @IsString() @IsOptional() taskId?: string;
  @IsString() @IsOptional() workflowRunId?: string;
  @IsOptional() stageIndex?: number;
}
