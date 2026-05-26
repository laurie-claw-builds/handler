import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface SseMessageEvent {
  data: { type: string; payload: unknown };
}

@Injectable()
export class EventsService implements OnModuleDestroy {
  private readonly events$ = new Subject<SseMessageEvent>();
  private readonly destroy$ = new Subject<void>();

  private emit(type: string, payload: unknown) {
    this.events$.next({ data: { type, payload } });
  }

  @OnEvent('task.created')
  onTaskCreated(payload: unknown) {
    this.emit('task.created', payload);
  }

  @OnEvent('task.updated')
  onTaskUpdated(payload: unknown) {
    this.emit('task.updated', payload);
  }

  @OnEvent('task.removed')
  onTaskRemoved(payload: unknown) {
    this.emit('task.removed', payload);
  }

  @OnEvent('agentJob.created')
  onAgentJobCreated(payload: unknown) {
    this.emit('agentJob.created', payload);
  }

  @OnEvent('agentJob.updated')
  onAgentJobUpdated(payload: unknown) {
    this.emit('agentJob.updated', payload);
  }

  createStream(): Observable<SseMessageEvent> {
    return this.events$.pipe(takeUntil(this.destroy$));
  }

  onModuleDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.events$.complete();
  }
}
