import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToMany, JoinColumn,
  CreateDateColumn, Unique
} from 'typeorm';
import { User } from '../users/user.entity';
import { Quiniela } from './quiniela.entity';
import { Prediccion } from './prediccion.entity';

@Entity('quiniela_participantes')
@Unique(['quiniela_id', 'user_id'])
export class QuinielaParticipante {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  quiniela_id: number;

  @ManyToOne(() => Quiniela, (q) => q.participantes)
  @JoinColumn({ name: 'quiniela_id' })
  quiniela: Quiniela;

  @Column()
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Puntos acumulados en ESTA quiniela — no son globales
  @Column({ default: 0 })
  total_points: number;

  @Column({ default: 0 })
  exact_scores: number; // cuántos resultados exactos acertó en total

  @Column({ default: 0 })
  correct_winners: number; // cuántos ganadores acertó en total

  @Column({ default: 0 })
  jornadas_jugadas: number; // en cuántas jornadas predijo

  @Column({ nullable: true, type: 'int' })
  rank: number; // posición en el ranking de esta quiniela

  @Column({ default: false })
  has_paid: boolean;

  @CreateDateColumn()
  joined_at: Date;

  @OneToMany(() => Prediccion, (p) => p.participante)
  predicciones: Prediccion[];
}
