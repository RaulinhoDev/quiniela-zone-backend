import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, OneToMany
} from 'typeorm';

export enum CompetitionRegion {
  HONDURAS    = 'HN',
  COSTA_RICA  = 'CR',
  GUATEMALA   = 'GT',
  EL_SALVADOR = 'SV',
  NICARAGUA   = 'NI',
  PANAMA      = 'PA',
  BELIZE      = 'BZ',
  CONCACAF    = 'CONCACAF',
  MUNDIAL     = 'MUNDIAL',
}

@Entity('competitions')
export class Competition {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  short_name: string;

  @Column({ type: 'enum', enum: CompetitionRegion, default: CompetitionRegion.HONDURAS })
  region: CompetitionRegion;

  @Column({ nullable: true })
  logo_url: string;

  @Column({ nullable: true })
  api_football_id: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_manual: boolean;

  @CreateDateColumn()
  created_at: Date;
}
