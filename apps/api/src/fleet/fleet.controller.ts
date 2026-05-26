import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FleetService } from './fleet.service';

@Controller('api/fleet')
@UseGuards(JwtAuthGuard)
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  @Get()
  async getFleet() {
    const agents = await this.fleetService.getAgentsWithStats();
    return { agents };
  }
}
