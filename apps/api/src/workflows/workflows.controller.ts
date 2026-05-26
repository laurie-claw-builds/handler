import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkflowsService } from './workflows.service';
import { IsString } from 'class-validator';

class AttachWorkflowDto {
  @IsString() workflowCode!: string;
}

@Controller('api')
@UseGuards(JwtAuthGuard)
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get('workflows')
  findAll() {
    return this.workflowsService.findAll();
  }

  @Post('tasks/:taskId/attach-workflow')
  attachWorkflow(
    @Param('taskId') taskId: string,
    @Body() dto: AttachWorkflowDto,
  ) {
    return this.workflowsService.attachWorkflow(taskId, dto.workflowCode);
  }
}
