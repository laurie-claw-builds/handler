import { IsString, IsOptional, IsEnum, IsInt } from 'class-validator';
import { TaskUrgency, TaskState } from '@prisma/client';

export class UpdateTaskDto {
  @IsString() @IsOptional() summary?: string;
  @IsEnum(TaskUrgency) @IsOptional() urgency?: TaskUrgency;
  @IsString() @IsOptional() domain?: string;
  @IsEnum(TaskState) @IsOptional() state?: TaskState;
  @IsInt() @IsOptional() estimatedMinutes?: number;
}
