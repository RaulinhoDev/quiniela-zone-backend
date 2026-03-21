import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToOne, JoinColumn
} from 'typeorm';
import { Quiniela } from './quiniela.entity';

@Entity('scoring_rules')
export class ScoringRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  quiniela_id: number;

  @OneToOne(() => Quiniela, (q) => q.scoring_rule)
  @JoinColumn({ name: 'quiniela_id' })
  quiniela: Quiniela;

  @Column({ default: 3 })
  exact_score_pts: number;

  @Column({ default: 1 })
  correct_winner_pts: number;

  @Column({ default: 0 })
  wrong_pts: number;

  @Column({ default: false })
  double_points_final: boolean;
}
