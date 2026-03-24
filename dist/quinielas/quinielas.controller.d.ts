import { QuinielasService, CreateQuinielaDto, SubmitPrediccionesDto } from './quinielas.service';
import { User } from '../users/user.entity';
type AuthReq = {
    user: User;
};
export declare class QuinielasController {
    private quinielasService;
    constructor(quinielasService: QuinielasService);
    create(req: AuthReq, dto: CreateQuinielaDto): Promise<import("./quiniela.entity").Quiniela>;
    findOne(id: number): Promise<import("./quiniela.entity").Quiniela | null>;
    getRanking(id: number, page?: string, limit?: string): Promise<{
        quiniela: {
            id: number;
            name: string;
            competition: string;
            season: string;
            status: import("./quiniela.entity").QuinielaStatus;
            invite_code: string;
            is_paid: boolean;
            entry_fee: number;
            owner: string;
            scoring_rule: import("./scoring-rule.entity").ScoringRule;
            jornadas_jugadas: number;
            jornada_activa: import("./quiniela-jornada.entity").QuinielaJornada | null;
        };
        ranking: {
            rank: number;
            user: {
                id: number;
                username: string;
                country: string;
                avatar_url: string;
            };
            total_points: number;
            exact_scores: number;
            correct_winners: number;
            jornadas_jugadas: number;
        }[];
        total_participantes: number;
        pagination: {
            page: number;
            limit: number;
            total_pages: number;
        };
    }>;
    misQuinielas(req: AuthReq): Promise<import("./quiniela-participante.entity").QuinielaParticipante[]>;
    perfilPublico(username: string): Promise<{
        trofeos: {
            quiniela_id: number;
            name: string;
            competition: string;
            season: string;
            total_points: number;
        }[];
        mejor_rank: number | null;
        total_acertados: number;
        porcentaje_aciertos: number;
        username: string;
        full_name: string;
        country: string;
        member_since: Date;
    }>;
    misEstadisticas(req: AuthReq): Promise<{
        mejor_rank: number | null;
        total_acertados: number;
        porcentaje_aciertos: number;
    }>;
    misTrofeos(req: AuthReq): Promise<{
        quiniela_id: number;
        name: string;
        competition: string;
        season: string;
        total_points: number;
    }[]>;
    misLimites(req: AuthReq): Promise<{
        is_premium: boolean;
        quinielas: {
            creadas: number;
            limite: number | null;
            ilimitado: boolean;
        };
        participantes: {
            limite_por_quiniela: number;
        };
    }>;
    unirse(req: AuthReq, id: number): Promise<import("./quiniela-participante.entity").QuinielaParticipante>;
    unirseByCode(req: AuthReq, body: {
        invite_code: string;
    }): Promise<import("./quiniela-participante.entity").QuinielaParticipante>;
    abrirQuiniela(req: AuthReq, id: number): Promise<void>;
    enviarPredicciones(req: AuthReq, id: number, jornadaId: number, dto: SubmitPrediccionesDto): Promise<import("./prediccion.entity").Prediccion[]>;
    historial(req: AuthReq, id: number): Promise<{
        participante: {
            total_points: number;
            exact_scores: number;
            correct_winners: number;
            rank: number;
        };
        stats: {
            partidos_jugados: number;
            aciertos: number;
            exactos: number;
            ganador_correcto: number;
            porcentaje: number;
        };
        jornadas: {
            jornada_id: number;
            round_number: number;
            nombre: string;
            status: import("./quiniela-jornada.entity").JornadaStatus;
            partidos: {
                match_id: number;
                home_team: string;
                away_team: string;
                match_date: Date;
                status: import("../matches/match.entity").MatchStatus;
                resultado: string | null;
                prediccion: {
                    home: number;
                    away: number;
                    puntos: number;
                } | null;
                acierto: "exacto" | "ganador" | "fallo" | null;
            }[];
            stats: {
                jugados: number;
                aciertos: number;
                porcentaje: number | null;
            };
        }[];
    }>;
    todasPredicciones(req: AuthReq, id: number, jornadaId: number): Promise<{
        partidos: {
            match_id: number;
            home_team: string;
            away_team: string;
            resultado: string;
            predicciones: {
                username: string;
                user_id: number;
                prediccion: string | null;
                puntos: number;
            }[];
        }[];
    }>;
    puntosPorJornada(req: AuthReq, id: number, jornadaId: number): Promise<{
        user_id: number;
        username: string;
        puntos_jornada: number;
        diff_conmigo: number;
    }[]>;
    misPredicciones(req: AuthReq, id: number, jornadaId: number): Promise<{
        jornada: {
            id: number;
            round_number: number;
            status: import("./quiniela-jornada.entity").JornadaStatus;
            closes_at: Date;
            matchday: string;
        };
        partidos: {
            match_id: number;
            home_team: string;
            away_team: string;
            match_date: Date;
            status: import("../matches/match.entity").MatchStatus;
            resultado: string | null;
            prediccion: {
                home: number;
                away: number;
                puntos: number;
            } | null;
        }[];
    }>;
}
export {};
