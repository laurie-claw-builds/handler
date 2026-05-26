import { IsString, IsOptional, IsEnum, MaxLength, IsInt } from 'class-validator';
import { TaskUrgency, TaskState } from '@prisma/client';

export class CreateTaskDto {
  @IsString() @MaxLength(200) title!: string;
  @IsString() body!: string;
  @IsString() @IsOptional() channelId?: string;
  @IsString() @IsOptional() sourceRef?: string;
  @IsString() @IsOptional() sourceUrl?: string;
  @IsString() @IsOptional() summary?: string;
  @IsString() @IsOptional() senderName?: string;
  @IsString() @IsOptional() senderHandle?: string;
  @IsEnum(TaskUrgency) @IsOptional() urgency?: TaskUrgency;
  @IsString() @IsOptional() domain?: string;
  @IsEnum(TaskState) @IsOptional() state?: TaskState;
  @IsInt() @IsOptional() estimatedMinutes?: number;
}
