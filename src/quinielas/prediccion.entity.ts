import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, Unique
} from 'typeorm';
import { QuinielaParticipante } from './quiniela-participante.entity';
import { QuinielaJornada } from './quiniela-jornada.entity';
import { Match } from '../matches/match.entity';

@Entity('predicciones')
@Unique(['participante_id', 'match_id'])
export class Prediccion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  participante_id: number;

  @ManyToOne(() => QuinielaParticipante, (p) => p.predicciones)
  @JoinColumn({ name: 'participante_id' })
  participante: QuinielaParticipante;

  @Column()
  quiniela_jornada_id: number;

  @ManyToOne(() => QuinielaJornada, (j) => j.predicciones)
  @JoinColumn({ name: 'quiniela_jornada_id' })
  quiniela_jornada: QuinielaJornada;

  @Column()
  match_id: number;

  @ManyToOne(() => Match)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Column({ type: 'int' })
  home_pred: number;

  @Column({ type: 'int' })
  away_pred: number;

  @Column({ default: 0 })
  points_earned: number;

  @Column({ default: false })
  is_calculated: boolean;

  @CreateDateColumn()
  created_at: Date;
}
