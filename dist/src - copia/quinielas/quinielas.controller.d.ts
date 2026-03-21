import { QuinielasService, CreateQuinielaDto, AbrirJornadaDto, SubmitPrediccionesDto } from './quinielas.service';
export declare class QuinielasController {
    private quinielasService;
    constructor(quinielasService: QuinielasService);
    create(req: any, dto: CreateQuinielaDto): Promise<import("./quiniela.entity").Quiniela>;
    findOne(id: number): Promise<import("./quiniela.entity").Quiniela>;
    getRanking(id: number): Promise<{
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
            jornada_activa: import("./quiniela-jornada.entity").QuinielaJornada;
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
    misQuinielas(req: any): Promise<import("./quiniela-participante.entity").QuinielaParticipante[]>;
    unirse(req: any, id: number): Promise<import("./quiniela-participante.entity").QuinielaParticipante>;
    unirseByCode(req: any, body: {
        invite_code: string;
    }): Promise<import("./quiniela-participante.entity").QuinielaParticipante>;
    abrirJornada(req: any, id: number, dto: AbrirJornadaDto): Promise<import("./quiniela-jornada.entity").QuinielaJornada>;
    enviarPredicciones(req: any, id: number, jornadaId: number, dto: SubmitPrediccionesDto): Promise<import("./prediccion.entity").Prediccion[]>;
    misPredicciones(req: any, id: number, jornadaId: number): Promise<{
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
            resultado: string;
            prediccion: {
                home: number;
                away: number;
                puntos: number;
            };
        }[];
    }>;
}
