import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToMany, JoinColumn, CreateDateColumn
} from 'typeorm';
import { Competition } from '../competitions/competition.entity';
import { Match } from '../matches/match.entity';

export enum TorneoType {
  APERTURA = 'Apertura',
  CLAUSURA = 'Clausura',
  UNICO    = 'Único',
  OTRO     = 'Otro',
}

@Entity('matchdays')
export class Matchday {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  competition_id: number;

  @ManyToOne(() => Competition)
  @JoinColumn({ name: 'competition_id' })
  competition: Competition;

  @Column()
  name: string;

  @Column()
  season: string;

  // Torneo al que pertenece la jornada
  @Column({ nullable: true })
  torneo: string; // 'Apertura', 'Clausura', 'Único', 'Otro'

  @Column({ nullable: true })
  round_number: number;

  @Column({ type: 'date', nullable: true })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @Column({ default: false })
  is_finished: boolean;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Match, (m) => m.matchday)
  matches: Match[];
}
