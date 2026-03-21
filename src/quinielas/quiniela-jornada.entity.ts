import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToMany, JoinColumn, CreateDateColumn
} from 'typeorm';
import { Quiniela } from './quiniela.entity';
import { Matchday } from '../matchdays/matchday.entity';
import { Prediccion } from './prediccion.entity';

export enum JornadaStatus {
  PENDIENTE  = 'PENDIENTE',  // aún no abierta
  ABIERTA    = 'ABIERTA',    // acepta predicciones
  CERRADA    = 'CERRADA',    // no acepta predicciones, partidos en curso
  FINALIZADA = 'FINALIZADA', // puntos calculados y sumados
}

@Entity('quiniela_jornadas')
export class QuinielaJornada {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  quiniela_id: number;

  @ManyToOne(() => Quiniela, (q) => q.jornadas)
  @JoinColumn({ name: 'quiniela_id' })
  quiniela: Quiniela;

  @Column()
  matchday_id: number;

  @ManyToOne(() => Matchday)
  @JoinColumn({ name: 'matchday_id' })
  matchday: Matchday;

  @Column()
  round_number: number; // 1, 2, 3... 18

  @Column({ type: 'enum', enum: JornadaStatus, default: JornadaStatus.PENDIENTE })
  status: JornadaStatus;

  @Column({ nullable: true, type: 'datetime' })
  closes_at: Date; // el owner define hasta cuándo aceptar predicciones

  @Column({ default: false })
  points_calculated: boolean; // true cuando ya se sumaron al ranking

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Prediccion, (p) => p.quiniela_jornada)
  predicciones: Prediccion[];
}
