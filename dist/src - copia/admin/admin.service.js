"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const quiniela_entity_1 = require("../quinielas/quiniela.entity");
const quiniela_participante_entity_1 = require("../quinielas/quiniela-participante.entity");
const prediccion_entity_1 = require("../quinielas/prediccion.entity");
const match_entity_1 = require("../matches/match.entity");
let AdminService = class AdminService {
    constructor(userRepo, quinielaRepo, participanteRepo, prediccionRepo, matchRepo) {
        this.userRepo = userRepo;
        this.quinielaRepo = quinielaRepo;
        this.participanteRepo = participanteRepo;
        this.prediccionRepo = prediccionRepo;
        this.matchRepo = matchRepo;
    }
    async getDashboard() {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(inicioSemana.getDate() - 7);
        const [totalUsuarios, usuariosEstaSemana, totalQuinielas, quinielasActivas, quinielasEsperando, totalPredicciones, partidosHoy, partidosEnVivo,] = await Promise.all([
            this.userRepo.count(),
            this.userRepo.count({ where: { created_at: (0, typeorm_2.MoreThanOrEqual)(inicioSemana) } }),
            this.quinielaRepo.count(),
            this.quinielaRepo.count({ where: { status: quiniela_entity_1.QuinielaStatus.ACTIVA } }),
            this.quinielaRepo.count({ where: { status: quiniela_entity_1.QuinielaStatus.ESPERANDO } }),
            this.prediccionRepo.count(),
            this.matchRepo
                .createQueryBuilder('m')
                .where('m.match_date >= :hoy', { hoy })
                .andWhere('m.match_date < :manana', { manana })
                .getCount(),
            this.matchRepo.count({ where: { status: match_entity_1.MatchStatus.LIVE } }),
        ]);
        const ultimosUsuarios = await this.userRepo.find({
            select: ['id', 'username', 'email', 'country', 'role', 'created_at'],
            order: { created_at: 'DESC' },
            take: 5,
        });
        const ultimasQuinielas = await this.quinielaRepo.find({
            relations: ['owner', 'competition'],
            order: { created_at: 'DESC' },
            take: 5,
        });
        const partidos = await this.matchRepo
            .createQueryBuilder('m')
            .leftJoinAndSelect('m.matchday', 'md')
            .leftJoinAndSelect('md.competition', 'c')
            .where('m.match_date >= :hoy', { hoy })
            .andWhere('m.match_date < :manana', { manana })
            .orderBy('m.match_date', 'ASC')
            .getMany();
        return {
            metricas: {
                totalUsuarios,
                usuariosEstaSemana,
                totalQuinielas,
                quinielasActivas,
                quinielasEsperando,
                totalPredicciones,
                partidosHoy,
                partidosEnVivo,
            },
            ultimosUsuarios,
            ultimasQuinielas: ultimasQuinielas.map(q => ({
                id: q.id,
                name: q.name,
                owner: q.owner?.username,
                competition: q.competition?.name,
                status: q.status,
                created_at: q.created_at,
            })),
            partidosHoy: partidos.map(p => ({
                id: p.id,
                home_team: p.home_team,
                away_team: p.away_team,
                match_date: p.match_date,
                status: p.status,
                home_score: p.home_score,
                away_score: p.away_score,
                competition: p.matchday?.competition?.name,
            })),
        };
    }
    async getUserDetail(userId) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            select: ['id', 'email', 'username', 'full_name', 'country', 'role', 'is_premium', 'created_at'],
        });
        const participaciones = await this.participanteRepo.find({
            where: { user_id: userId },
            relations: ['quiniela', 'quiniela.competition'],
            order: { joined_at: 'DESC' },
        });
        return {
            user,
            quinielas: participaciones.map(p => ({
                id: p.quiniela?.id,
                name: p.quiniela?.name,
                competition: p.quiniela?.competition?.name,
                status: p.quiniela?.status,
                total_points: p.total_points,
                rank: p.rank,
                jornadas_jugadas: p.jornadas_jugadas,
                joined_at: p.joined_at,
            })),
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(quiniela_entity_1.Quiniela)),
    __param(2, (0, typeorm_1.InjectRepository)(quiniela_participante_entity_1.QuinielaParticipante)),
    __param(3, (0, typeorm_1.InjectRepository)(prediccion_entity_1.Prediccion)),
    __param(4, (0, typeorm_1.InjectRepository)(match_entity_1.Match)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdminService);
//# sourceMappingURL=admin.service.js.map