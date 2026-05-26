import { Controller, Get, Sse, UseGuards } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EventsService, SseMessageEvent } from './events.service';

@Controller('api/events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Sse()
  stream(): Observable<SseMessageEvent> {
    return this.eventsService.createStream();
  }
}
