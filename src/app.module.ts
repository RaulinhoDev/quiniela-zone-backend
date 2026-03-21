import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { EmailModule } from './email/email.module';
import { CompetitionsModule } from './competitions/competitions.module';
import { QuinielasModule } from './quinielas/quinielas.module';

import { User } from './users/user.entity';
import { Competition } from './competitions/competition.entity';
import { Matchday } from './matchdays/matchday.entity';
import { Match } from './matches/match.entity';
import { Quiniela } from './quinielas/quiniela.entity';
import { QuinielaJornada } from './quinielas/quiniela-jornada.entity';
import { QuinielaParticipante } from './quinielas/quiniela-participante.entity';
import { Prediccion } from './quinielas/prediccion.entity';
import { ScoringRule } from './quinielas/scoring-rule.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host:     config.get('DB_HOST', 'localhost'),
        port:     config.get<number>('DB_PORT', 3306),
        username: config.get('DB_USERNAME', 'root'),
        password: config.get('DB_PASSWORD', ''),
        database: config.get('DB_DATABASE', 'quiniela_ca_v2'),
        entities: [
          User, Competition, Matchday, Match,
          Quiniela, QuinielaJornada, QuinielaParticipante,
          Prediccion, ScoringRule,
        ],
        synchronize: config.get('NODE_ENV') === 'development',
        logging:     config.get('NODE_ENV') === 'development',
        timezone:    'America/Tegucigalpa',
      }),
    }),

    ScheduleModule.forRoot(),

    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),

    AuthModule,
    UsersModule,
    AdminModule,
    EmailModule,
    CompetitionsModule,
    QuinielasModule,
  ],
})
export class AppModule {}