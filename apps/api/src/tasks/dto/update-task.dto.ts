import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class UpdateTaskDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  priority?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedMinutes?: number;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  decisionLog?: string;
}
