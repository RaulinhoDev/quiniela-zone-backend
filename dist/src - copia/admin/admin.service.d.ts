import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Quiniela, QuinielaStatus } from '../quinielas/quiniela.entity';
import { QuinielaParticipante } from '../quinielas/quiniela-participante.entity';
import { Prediccion } from '../quinielas/prediccion.entity';
import { Match, MatchStatus } from '../matches/match.entity';
export declare class AdminService {
    private userRepo;
    private quinielaRepo;
    private participanteRepo;
    private prediccionRepo;
    private matchRepo;
    constructor(userRepo: Repository<User>, quinielaRepo: Repository<Quiniela>, participanteRepo: Repository<QuinielaParticipante>, prediccionRepo: Repository<Prediccion>, matchRepo: Repository<Match>);
    getDashboard(): Promise<{
        metricas: {
            totalUsuarios: number;
            usuariosEstaSemana: number;
            totalQuinielas: number;
            quinielasActivas: number;
            quinielasEsperando: number;
            totalPredicciones: number;
            partidosHoy: number;
            partidosEnVivo: number;
        };
        ultimosUsuarios: User[];
        ultimasQuinielas: {
            id: number;
            name: string;
            owner: string;
            competition: string;
            status: QuinielaStatus;
            created_at: Date;
        }[];
        partidosHoy: {
            id: number;
            home_team: string;
            away_team: string;
            match_date: Date;
            status: MatchStatus;
            home_score: number;
            away_score: number;
            competition: string;
        }[];
    }>;
    getUserDetail(userId: number): Promise<{
        user: User;
        quinielas: {
            id: number;
            name: string;
            competition: string;
            status: QuinielaStatus;
            total_points: number;
            rank: number;
            jornadas_jugadas: number;
            joined_at: Date;
        }[];
    }>;
}
