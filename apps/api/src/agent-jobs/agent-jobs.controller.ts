import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AgentJobsService } from './agent-jobs.service';
import { CreateAgentJobDto } from './dto/create-agent-job.dto';
import { UpdateAgentJobDto } from './dto/update-agent-job.dto';
import { QueryAgentJobsDto } from './dto/query-agent-jobs.dto';

@Controller('api/agent-jobs')
@UseGuards(JwtAuthGuard)
export class AgentJobsController {
  constructor(private readonly agentJobsService: AgentJobsService) {}

  @Get()
  findAll(@Query() query: QueryAgentJobsDto) {
    return this.agentJobsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.agentJobsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateAgentJobDto) {
    return this.agentJobsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAgentJobDto) {
    return this.agentJobsService.update(id, dto);
  }
}
