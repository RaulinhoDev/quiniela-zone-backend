import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface ResultadoEvent {
  type:       'resultado';
  matchId:    number;
  homeTeam:   string;
  awayTeam:   string;
  homeScore:  number;
  awayScore:  number;
  quinielaId: number;
}

@Injectable()
export class SseService {
  // Map quinielaId → Subject de eventos
  private channels = new Map<number, Subject<ResultadoEvent>>();

  getChannel(quinielaId: number): Subject<ResultadoEvent> {
    if (!this.channels.has(quinielaId)) {
      this.channels.set(quinielaId, new Subject<ResultadoEvent>());
    }
    return this.channels.get(quinielaId)!;
  }

  emit(event: ResultadoEvent): void {
    const channel = this.channels.get(event.quinielaId);
    if (channel) channel.next(event);
  }

  emitToAll(
    quinielaIds: number[],
    matchId: number,
    homeTeam: string,
    awayTeam: string,
    homeScore: number,
    awayScore: number,
  ): void {
    for (const quinielaId of quinielaIds) {
      this.emit({ type: 'resultado', matchId, homeTeam, awayTeam, homeScore, awayScore, quinielaId });
    }
  }
}
