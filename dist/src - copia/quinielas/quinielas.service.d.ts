import { Repository } from 'typeorm';
import { Quiniela, QuinielaStatus } from './quiniela.entity';
import { QuinielaJornada, JornadaStatus } from './quiniela-jornada.entity';
import { QuinielaParticipante } from './quiniela-participante.entity';
import { Prediccion } from './prediccion.entity';
import { ScoringRule } from './scoring-rule.entity';
import { Match, MatchStatus } from '../matches/match.entity';
import { Matchday } from '../matchdays/matchday.entity';
import { User } from '../users/user.entity';
export interface CreateQuinielaDto {
    name: string;
    description?: string;
    competition_id: number;
    season: string;
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
    constructor(quinielaRepo: Repository<Quiniela>, jornadaRepo: Repository<QuinielaJornada>, participanteRepo: Repository<QuinielaParticipante>, prediccionRepo: Repository<Prediccion>, scoringRepo: Repository<ScoringRule>, matchRepo: Repository<Match>, matchdayRepo: Repository<Matchday>);
    create(owner: User, dto: CreateQuinielaDto): Promise<Quiniela>;
    unirse(user: User, quinielaId: number): Promise<QuinielaParticipante>;
    unirseByCode(user: User, invite_code: string): Promise<QuinielaParticipante>;
    abrirJornada(owner: User, quinielaId: number, dto: AbrirJornadaDto): Promise<QuinielaJornada>;
    enviarPredicciones(user: User, quinielaId: number, jornadaId: number, dto: SubmitPrediccionesDto): Promise<Prediccion[]>;
    calcularPuntos(matchId: number): Promise<void>;
    getRanking(quinielaId: number): Promise<{
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
            jornada_activa: QuinielaJornada;
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
            resultado: string;
            prediccion: {
                home: number;
                away: number;
                puntos: number;
            };
        }[];
    }>;
    private getWinner;
    private recalcularRankings;
    private generateCode;
    findOne(id: number): Promise<Quiniela>;
    findMisQuinielas(userId: number): Promise<QuinielaParticipante[]>;
}
