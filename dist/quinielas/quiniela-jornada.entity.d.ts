import { Quiniela } from './quiniela.entity';
import { Matchday } from '../matchdays/matchday.entity';
import { Prediccion } from './prediccion.entity';
export declare enum JornadaStatus {
    PENDIENTE = "PENDIENTE",
    ABIERTA = "ABIERTA",
    CERRADA = "CERRADA",
    FINALIZADA = "FINALIZADA"
}
export declare class QuinielaJornada {
    id: number;
    quiniela_id: number;
    quiniela: Quiniela;
    matchday_id: number;
    matchday: Matchday;
    round_number: number;
    status: JornadaStatus;
    closes_at: Date;
    points_calculated: boolean;
    created_at: Date;
    predicciones: Prediccion[];
}
