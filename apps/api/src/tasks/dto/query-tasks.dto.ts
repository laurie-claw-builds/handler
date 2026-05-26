import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TaskState } from '@prisma/client';

export class QueryTasksDto {
  @IsEnum(TaskState) @IsOptional() state?: TaskState;
  @IsInt() @Min(0) @IsOptional() @Type(() => Number) limit?: number = 50;
  @IsInt() @Min(0) @IsOptional() @Type(() => Number) offset?: number = 0;
}
