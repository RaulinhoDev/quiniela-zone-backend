import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToMany, OneToOne,
  JoinColumn, CreateDateColumn, UpdateDateColumn
} from 'typeorm';
import { User } from '../users/user.entity';
import { Competition } from '../competitions/competition.entity';
import { QuinielaParticipante } from './quiniela-participante.entity';
import { QuinielaJornada } from './quiniela-jornada.entity';
import { ScoringRule } from './scoring-rule.entity';

export enum QuinielaStatus {
  ESPERANDO  = 'ESPERANDO',  // creada, aceptando participantes
  ACTIVA     = 'ACTIVA',     // primera jornada abierta
  FINALIZADA = 'FINALIZADA', // todas las jornadas terminadas
}

@Entity('quinielas')
export class Quiniela {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  owner_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column()
  competition_id: number;

  @ManyToOne(() => Competition)
  @JoinColumn({ name: 'competition_id' })
  competition: Competition;

  @Column()
  name: string; // "Clausura 2026 — Grupo del trabajo"

  @Column({ nullable: true })
  description: string;

  @Column({ unique: true })
  invite_code: string; // código para invitar amigos — ej: "OLIM26"

  @Column({ type: 'enum', enum: QuinielaStatus, default: QuinielaStatus.ESPERANDO })
  status: QuinielaStatus;

  @Column({ default: false })
  is_paid: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  entry_fee: number;

  @Column({ nullable: true })
  season: string; // "2024-2025"

  @Column({ default: false })
  is_active: boolean;

  @Column({ default: false })
  is_public: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => QuinielaParticipante, (p) => p.quiniela, { cascade: true })
  participantes: QuinielaParticipante[];

  @OneToMany(() => QuinielaJornada, (j) => j.quiniela, { cascade: true })
  jornadas: QuinielaJornada[];

  @OneToOne(() => ScoringRule, (s) => s.quiniela, { cascade: true })
  scoring_rule: ScoringRule;
}
