import { User } from '../users/user.entity';
import { Quiniela } from './quiniela.entity';
import { Prediccion } from './prediccion.entity';
export declare class QuinielaParticipante {
    id: number;
    quiniela_id: number;
    quiniela: Quiniela;
    user_id: number;
    user: User;
    total_points: number;
    exact_scores: number;
    correct_winners: number;
    jornadas_jugadas: number;
    rank: number;
    has_paid: boolean;
    joined_at: Date;
    predicciones: Prediccion[];
}
