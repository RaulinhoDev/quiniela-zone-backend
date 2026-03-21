import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { CompetitionsService } from './competitions.service';
import { CompetitionsController } from './competitions.controller';
import { Competition } from './competition.entity';
import { Matchday } from '../matchdays/matchday.entity';
import { Match } from '../matches/match.entity';
import { QuinielasModule } from '../quinielas/quinielas.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Competition, Matchday, Match]),
    HttpModule,
    QuinielasModule,
  ],
  providers:   [CompetitionsService],
  controllers: [CompetitionsController],
  exports:     [CompetitionsService],
})
export class CompetitionsModule {}
