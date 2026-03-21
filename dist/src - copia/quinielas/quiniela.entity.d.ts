import { User } from '../users/user.entity';
import { Competition } from '../competitions/competition.entity';
import { QuinielaParticipante } from './quiniela-participante.entity';
import { QuinielaJornada } from './quiniela-jornada.entity';
import { ScoringRule } from './scoring-rule.entity';
export declare enum QuinielaStatus {
    ESPERANDO = "ESPERANDO",
    ACTIVA = "ACTIVA",
    FINALIZADA = "FINALIZADA"
}
export declare class Quiniela {
    id: number;
    owner_id: number;
    owner: User;
    competition_id: number;
    competition: Competition;
    name: string;
    description: string;
    invite_code: string;
    status: QuinielaStatus;
    is_paid: boolean;
    entry_fee: number;
    season: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    participantes: QuinielaParticipante[];
    jornadas: QuinielaJornada[];
    scoring_rule: ScoringRule;
}
