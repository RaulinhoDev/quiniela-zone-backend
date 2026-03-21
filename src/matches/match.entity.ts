import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToMany, JoinColumn,
  CreateDateColumn, UpdateDateColumn
} from 'typeorm';
import { Matchday } from '../matchdays/matchday.entity';

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  LIVE      = 'LIVE',
  FINISHED  = 'FINISHED',
  POSTPONED = 'POSTPONED',
  CANCELLED = 'CANCELLED',
}

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  matchday_id: number;

  @ManyToOne(() => Matchday, (m) => m.matches)
  @JoinColumn({ name: 'matchday_id' })
  matchday: Matchday;

  @Column()
  home_team: string;

  @Column()
  away_team: string;

  @Column({ nullable: true })
  home_logo_url: string;

  @Column({ nullable: true })
  away_logo_url: string;

  @Column({ type: 'datetime' })
  match_date: Date;

  @Column({ type: 'enum', enum: MatchStatus, default: MatchStatus.SCHEDULED })
  status: MatchStatus;

  @Column({ nullable: true, type: 'int' })
  home_score: number;

  @Column({ nullable: true, type: 'int' })
  away_score: number;

  @Column({ nullable: true })
  api_football_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
