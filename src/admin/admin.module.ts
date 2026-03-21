import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User } from '../users/user.entity';
import { Quiniela } from '../quinielas/quiniela.entity';
import { QuinielaParticipante } from '../quinielas/quiniela-participante.entity';
import { Prediccion } from '../quinielas/prediccion.entity';
import { Match } from '../matches/match.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, Quiniela, QuinielaParticipante, Prediccion, Match
    ]),
  ],
  providers:   [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
