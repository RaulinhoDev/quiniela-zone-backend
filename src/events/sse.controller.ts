import { Controller, Get, Param, ParseIntPipe, Sse, MessageEvent } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { SseService } from './sse.service';

@Controller('events')
export class SseController {
  constructor(private sseService: SseService) {}

  /**
   * GET /api/v1/events/quinielas/:id
   * Suscribirse a actualizaciones en tiempo real de una quiniela.
   * No requiere auth — el id de la quiniela es público (para resultados en QuinielaPublicaView también).
   */
  @Sse('quinielas/:id')
  stream(@Param('id', ParseIntPipe) id: number): Observable<MessageEvent> {
    return this.sseService.getChannel(id).pipe(
      map(event => ({
        data: event,
      } as MessageEvent)),
    );
  }
}
