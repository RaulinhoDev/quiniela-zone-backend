import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuinielasService } from './quinielas.service';
import { QuinielasController } from './quinielas.controller';
import { Quiniela } from './quiniela.entity';
import { QuinielaJornada } from './quiniela-jornada.entity';
import { QuinielaParticipante } from './quiniela-participante.entity';
import { Prediccion } from './prediccion.entity';
import { ScoringRule } from './scoring-rule.entity';
import { Match } from '../matches/match.entity';
import { Matchday } from '../matchdays/matchday.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Quiniela, QuinielaJornada, QuinielaParticipante,
      Prediccion, ScoringRule, Match, Matchday, User,
    ]),
  ],
  providers:   [QuinielasService],
  controllers: [QuinielasController],
  exports:     [QuinielasService],
})
export class QuinielasModule {}
