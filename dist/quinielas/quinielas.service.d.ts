import { Repository } from 'typeorm';
import { Quiniela, QuinielaStatus } from './quiniela.entity';
import { QuinielaJornada, JornadaStatus } from './quiniela-jornada.entity';
import { QuinielaParticipante } from './quiniela-participante.entity';
import { Prediccion } from './prediccion.entity';
import { ScoringRule } from './scoring-rule.entity';
import { Match, MatchStatus } from '../matches/match.entity';
import { Matchday } from '../matchdays/matchday.entity';
import { User } from '../users/user.entity';
export declare const PREMIUM_LIMITS: {
    MAX_QUINIELAS_FREE: number;
    MAX_PARTICIPANTES_FREE: number;
    MAX_PARTICIPANTES_PREMIUM: number;
};
export interface CreateQuinielaDto {
    name: string;
    description?: string;
    competition_id: number;
    season: string;
    torneo: string;
    is_paid?: boolean;
    entry_fee?: number;
    scoring?: {
        exact_score_pts?: number;
        correct_winner_pts?: number;
        double_points_final?: boolean;
    };
}
export interface AbrirJornadaDto {
    matchday_id: number;
    closes_at: string;
}
export interface SubmitPrediccionesDto {
    predicciones: {
        match_id: number;
        home_pred: number;
        away_pred: number;
    }[];
}
export declare class QuinielasService {
    private quinielaRepo;
    private jornadaRepo;
    private participanteRepo;
    private prediccionRepo;
    private scoringRepo;
    private matchRepo;
    private matchdayRepo;
    private userRepo;
    private readonly logger;
    constructor(quinielaRepo: Repository<Quiniela>, jornadaRepo: Repository<QuinielaJornada>, participanteRepo: Repository<QuinielaParticipante>, prediccionRepo: Repository<Prediccion>, scoringRepo: Repository<ScoringRule>, matchRepo: Repository<Match>, matchdayRepo: Repository<Matchday>, userRepo: Repository<User>);
    create(owner: User, dto: CreateQuinielaDto): Promise<Quiniela>;
    abrirQuiniela(owner: User, quinielaId: number): Promise<void>;
    unirse(user: User, quinielaId: number): Promise<QuinielaParticipante>;
    private unirseInterno;
    unirseByCode(user: User, invite_code: string): Promise<QuinielaParticipante>;
    abrirJornada(owner: User, quinielaId: number, dto: AbrirJornadaDto): Promise<QuinielaJornada>;
    enviarPredicciones(user: User, quinielaId: number, jornadaId: number, dto: SubmitPrediccionesDto): Promise<Prediccion[]>;
    calcularPuntos(matchId: number): Promise<void>;
    private verificarYAvanzarJornada;
    getRanking(quinielaId: number, page?: number, limit?: number): Promise<{
        quiniela: {
            id: number;
            name: string;
            competition: string;
            season: string;
            status: QuinielaStatus;
            invite_code: string;
            is_paid: boolean;
            entry_fee: number;
            owner: string;
            scoring_rule: ScoringRule;
            jornadas_jugadas: number;
            jornada_activa: QuinielaJornada | null;
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
    getMisPredicciones(user: User, quinielaId: number, jornadaId: number): Promise<{
        jornada: {
            id: number;
            round_number: number;
            status: JornadaStatus;
            closes_at: Date;
            matchday: string;
        };
        partidos: {
            match_id: number;
            home_team: string;
            away_team: string;
            match_date: Date;
            status: MatchStatus;
            resultado: string | null;
            prediccion: {
                home: number;
                away: number;
                puntos: number;
            } | null;
        }[];
    }>;
    getTodasPredicciones(user: User, quinielaId: number, jornadaId: number): Promise<{
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
    getPuntosPorJornada(user: User, quinielaId: number, jornadaId: number): Promise<{
        user_id: number;
        username: string;
        puntos_jornada: number;
        diff_conmigo: number;
    }[]>;
    getHistorial(user: User, quinielaId: number): Promise<{
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
            status: JornadaStatus;
            partidos: {
                match_id: number;
                home_team: string;
                away_team: string;
                match_date: Date;
                status: MatchStatus;
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
    private getWinner;
    private recalcularRankings;
    private generateCode;
    findOne(id: number): Promise<Quiniela | null>;
    findMisQuinielas(userId: number): Promise<QuinielaParticipante[]>;
    getPerfilPublico(username: string): Promise<{
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
    getMisEstadisticas(userId: number): Promise<{
        mejor_rank: number | null;
        total_acertados: number;
        porcentaje_aciertos: number;
    }>;
    getMisTrofeos(userId: number): Promise<{
        quiniela_id: number;
        name: string;
        competition: string;
        season: string;
        total_points: number;
    }[]>;
    getQuinielasForMatch(matchId: number): Promise<number[]>;
    getMisLimites(user: User): Promise<{
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
}
