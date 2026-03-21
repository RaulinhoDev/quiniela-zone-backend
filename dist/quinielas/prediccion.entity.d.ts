import { QuinielaParticipante } from './quiniela-participante.entity';
import { QuinielaJornada } from './quiniela-jornada.entity';
import { Match } from '../matches/match.entity';
export declare class Prediccion {
    id: number;
    participante_id: number;
    participante: QuinielaParticipante;
    quiniela_jornada_id: number;
    quiniela_jornada: QuinielaJornada;
    match_id: number;
    match: Match;
    home_pred: number;
    away_pred: number;
    points_earned: number;
    is_calculated: boolean;
    created_at: Date;
}
