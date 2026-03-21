import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToMany, JoinColumn, CreateDateColumn
} from 'typeorm';
import { Competition } from '../competitions/competition.entity';
import { Match } from '../matches/match.entity';

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

  @Column({ nullable: true })
  round_number: number; // número de jornada: 1, 2, 3...

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
