import { AdminService } from './admin.service';
export declare class AdminController {
    private adminService;
    constructor(adminService: AdminService);
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
        ultimosUsuarios: import("../users/user.entity").User[];
        ultimasQuinielas: {
            id: number;
            name: string;
            owner: string;
            competition: string;
            status: import("../quinielas/quiniela.entity").QuinielaStatus;
            created_at: Date;
        }[];
        partidosHoy: {
            id: number;
            home_team: string;
            away_team: string;
            match_date: Date;
            status: import("../matches/match.entity").MatchStatus;
            home_score: number;
            away_score: number;
            competition: string;
        }[];
    }>;
    getUserDetail(id: number): Promise<{
        user: import("../users/user.entity").User;
        quinielas: {
            id: number;
            name: string;
            competition: string;
            status: import("../quinielas/quiniela.entity").QuinielaStatus;
            total_points: number;
            rank: number;
            jornadas_jugadas: number;
            joined_at: Date;
        }[];
    }>;
}
