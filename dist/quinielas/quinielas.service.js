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
exports.QuinielasService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const quiniela_entity_1 = require("./quiniela.entity");
const quiniela_jornada_entity_1 = require("./quiniela-jornada.entity");
const quiniela_participante_entity_1 = require("./quiniela-participante.entity");
const prediccion_entity_1 = require("./prediccion.entity");
const scoring_rule_entity_1 = require("./scoring-rule.entity");
const match_entity_1 = require("../matches/match.entity");
const matchday_entity_1 = require("../matchdays/matchday.entity");
let QuinielasService = class QuinielasService {
    constructor(quinielaRepo, jornadaRepo, participanteRepo, prediccionRepo, scoringRepo, matchRepo, matchdayRepo) {
        this.quinielaRepo = quinielaRepo;
        this.jornadaRepo = jornadaRepo;
        this.participanteRepo = participanteRepo;
        this.prediccionRepo = prediccionRepo;
        this.scoringRepo = scoringRepo;
        this.matchRepo = matchRepo;
        this.matchdayRepo = matchdayRepo;
    }
    async create(owner, dto) {
        const invite_code = this.generateCode();
        const quiniela = this.quinielaRepo.create({
            owner_id: owner.id,
            competition_id: dto.competition_id,
            name: dto.name,
            description: dto.description,
            invite_code,
            season: dto.season,
            is_paid: dto.is_paid || false,
            entry_fee: dto.entry_fee || 0,
            is_active: true,
            status: quiniela_entity_1.QuinielaStatus.ESPERANDO,
        });
        await this.quinielaRepo.save(quiniela);
        const scoring = this.scoringRepo.create({
            quiniela_id: quiniela.id,
            exact_score_pts: dto.scoring?.exact_score_pts ?? 3,
            correct_winner_pts: dto.scoring?.correct_winner_pts ?? 1,
            double_points_final: dto.scoring?.double_points_final ?? false,
        });
        await this.scoringRepo.save(scoring);
        await this.unirse(owner, quiniela.id);
        return this.findOne(quiniela.id);
    }
    async unirse(user, quinielaId) {
        const quiniela = await this.quinielaRepo.findOne({ where: { id: quinielaId } });
        if (!quiniela)
            throw new common_1.NotFoundException('Quiniela no encontrada');
        if (!quiniela.is_active)
            throw new common_1.BadRequestException('Esta quiniela no está activa');
        if (quiniela.status !== quiniela_entity_1.QuinielaStatus.ESPERANDO) {
            throw new common_1.BadRequestException('La quiniela ya inició — no se aceptan nuevos participantes');
        }
        const existe = await this.participanteRepo.findOne({
            where: { quiniela_id: quinielaId, user_id: user.id },
        });
        if (existe)
            throw new common_1.ConflictException('Ya estás participando en esta quiniela');
        const participante = this.participanteRepo.create({
            quiniela_id: quinielaId,
            user_id: user.id,
        });
        return this.participanteRepo.save(participante);
    }
    async unirseByCode(user, invite_code) {
        const quiniela = await this.quinielaRepo.findOne({
            where: { invite_code: invite_code.toUpperCase() },
        });
        if (!quiniela)
            throw new common_1.NotFoundException('Código inválido');
        return this.unirse(user, quiniela.id);
    }
    async abrirJornada(owner, quinielaId, dto) {
        const quiniela = await this.quinielaRepo.findOne({
            where: { id: quinielaId },
            relations: ['jornadas'],
        });
        if (!quiniela)
            throw new common_1.NotFoundException('Quiniela no encontrada');
        if (quiniela.owner_id !== owner.id)
            throw new common_1.ForbiddenException('Solo el owner puede abrir jornadas');
        const matchday = await this.matchdayRepo.findOne({
            where: { id: dto.matchday_id },
            relations: ['matches'],
        });
        if (!matchday)
            throw new common_1.NotFoundException('Jornada no encontrada');
        if (!matchday.matches.length)
            throw new common_1.BadRequestException('La jornada no tiene partidos registrados');
        const jornadaAbierta = quiniela.jornadas?.find(j => j.status === quiniela_jornada_entity_1.JornadaStatus.ABIERTA);
        if (jornadaAbierta) {
            const ahora = new Date();
            if (new Date(jornadaAbierta.closes_at) < ahora) {
                await this.jornadaRepo.update(jornadaAbierta.id, {
                    status: quiniela_jornada_entity_1.JornadaStatus.CERRADA,
                });
            }
            else {
                throw new common_1.BadRequestException('Ya hay una jornada abierta — esperá a que cierre antes de abrir la siguiente');
            }
        }
        const yaUsado = quiniela.jornadas?.find(j => j.matchday_id === dto.matchday_id);
        if (yaUsado)
            throw new common_1.BadRequestException('Esta jornada ya fue usada en la quiniela');
        const round_number = (quiniela.jornadas?.length || 0) + 1;
        const jornadaQuiniela = this.jornadaRepo.create({
            quiniela_id: quinielaId,
            matchday_id: dto.matchday_id,
            round_number,
            status: quiniela_jornada_entity_1.JornadaStatus.ABIERTA,
            closes_at: new Date(dto.closes_at),
        });
        await this.jornadaRepo.save(jornadaQuiniela);
        if (quiniela.status === quiniela_entity_1.QuinielaStatus.ESPERANDO) {
            await this.quinielaRepo.update(quinielaId, { status: quiniela_entity_1.QuinielaStatus.ACTIVA });
        }
        return jornadaQuiniela;
    }
    async enviarPredicciones(user, quinielaId, jornadaId, dto) {
        const jornada = await this.jornadaRepo.findOne({
            where: { id: jornadaId, quiniela_id: quinielaId },
            relations: ['matchday', 'matchday.matches'],
        });
        if (!jornada)
            throw new common_1.NotFoundException('Jornada no encontrada');
        if (jornada.status !== quiniela_jornada_entity_1.JornadaStatus.ABIERTA) {
            throw new common_1.BadRequestException('Esta jornada no está abierta para predicciones');
        }
        if (new Date() > jornada.closes_at) {
            throw new common_1.BadRequestException('El plazo para enviar predicciones cerró');
        }
        const participante = await this.participanteRepo.findOne({
            where: { quiniela_id: quinielaId, user_id: user.id },
        });
        if (!participante)
            throw new common_1.ForbiddenException('No estás participando en esta quiniela');
        const validIds = jornada.matchday.matches.map(m => m.id);
        for (const p of dto.predicciones) {
            if (!validIds.includes(p.match_id)) {
                throw new common_1.BadRequestException(`El partido ${p.match_id} no pertenece a esta jornada`);
            }
        }
        const saved = [];
        for (const pred of dto.predicciones) {
            let prediccion = await this.prediccionRepo.findOne({
                where: { participante_id: participante.id, match_id: pred.match_id },
            });
            if (prediccion) {
                prediccion.home_pred = pred.home_pred;
                prediccion.away_pred = pred.away_pred;
                prediccion.is_calculated = false;
            }
            else {
                prediccion = this.prediccionRepo.create({
                    participante_id: participante.id,
                    quiniela_jornada_id: jornadaId,
                    match_id: pred.match_id,
                    home_pred: pred.home_pred,
                    away_pred: pred.away_pred,
                });
            }
            saved.push(await this.prediccionRepo.save(prediccion));
        }
        await this.participanteRepo.increment({ id: participante.id }, 'jornadas_jugadas', 0);
        return saved;
    }
    async calcularPuntos(matchId) {
        const match = await this.matchRepo.findOne({ where: { id: matchId } });
        if (!match || match.status !== match_entity_1.MatchStatus.FINISHED)
            return;
        if (match.home_score === null || match.away_score === null)
            return;
        const predicciones = await this.prediccionRepo.find({
            where: { match_id: matchId, is_calculated: false },
            relations: [
                'participante',
                'participante.quiniela',
                'participante.quiniela.scoring_rule',
            ],
        });
        for (const prediccion of predicciones) {
            const rule = prediccion.participante.quiniela.scoring_rule;
            let points = 0;
            const exacto = prediccion.home_pred === match.home_score &&
                prediccion.away_pred === match.away_score;
            const ganador = !exacto &&
                this.getWinner(prediccion.home_pred, prediccion.away_pred) ===
                    this.getWinner(match.home_score, match.away_score);
            if (exacto) {
                points = rule.exact_score_pts;
                await this.participanteRepo.increment({ id: prediccion.participante_id }, 'exact_scores', 1);
            }
            else if (ganador) {
                points = rule.correct_winner_pts;
                await this.participanteRepo.increment({ id: prediccion.participante_id }, 'correct_winners', 1);
            }
            prediccion.points_earned = points;
            prediccion.is_calculated = true;
            await this.prediccionRepo.save(prediccion);
            if (points > 0) {
                await this.participanteRepo.increment({ id: prediccion.participante_id }, 'total_points', points);
            }
        }
        await this.recalcularRankings(matchId);
    }
    async getRanking(quinielaId) {
        const quiniela = await this.quinielaRepo.findOne({
            where: { id: quinielaId },
            relations: ['competition', 'owner', 'scoring_rule', 'jornadas', 'jornadas.matchday'],
        });
        if (!quiniela)
            throw new common_1.NotFoundException('Quiniela no encontrada');
        const participantes = await this.participanteRepo.find({
            where: { quiniela_id: quinielaId },
            relations: ['user'],
            order: { total_points: 'DESC', exact_scores: 'DESC' },
        });
        return {
            quiniela: {
                id: quiniela.id,
                name: quiniela.name,
                competition: quiniela.competition?.name,
                season: quiniela.season,
                status: quiniela.status,
                invite_code: quiniela.invite_code,
                is_paid: quiniela.is_paid,
                entry_fee: quiniela.entry_fee,
                owner: quiniela.owner?.username,
                scoring_rule: quiniela.scoring_rule,
                jornadas_jugadas: quiniela.jornadas?.filter(j => j.status === quiniela_jornada_entity_1.JornadaStatus.FINALIZADA).length || 0,
                jornada_activa: quiniela.jornadas?.find(j => j.status === quiniela_jornada_entity_1.JornadaStatus.ABIERTA) || null,
            },
            ranking: participantes.map((p, i) => ({
                rank: i + 1,
                user: {
                    id: p.user.id,
                    username: p.user.username,
                    country: p.user.country,
                    avatar_url: p.user.avatar_url,
                },
                total_points: p.total_points,
                exact_scores: p.exact_scores,
                correct_winners: p.correct_winners,
                jornadas_jugadas: p.jornadas_jugadas,
            })),
            total_participantes: participantes.length,
        };
    }
    async getMisPredicciones(user, quinielaId, jornadaId) {
        const participante = await this.participanteRepo.findOne({
            where: { quiniela_id: quinielaId, user_id: user.id },
        });
        if (!participante)
            throw new common_1.ForbiddenException('No estás en esta quiniela');
        const jornada = await this.jornadaRepo.findOne({
            where: { id: jornadaId, quiniela_id: quinielaId },
            relations: ['matchday', 'matchday.matches'],
        });
        if (!jornada)
            throw new common_1.NotFoundException('Jornada no encontrada');
        const predicciones = await this.prediccionRepo.find({
            where: { participante_id: participante.id, quiniela_jornada_id: jornadaId },
            relations: ['match'],
        });
        return {
            jornada: {
                id: jornada.id,
                round_number: jornada.round_number,
                status: jornada.status,
                closes_at: jornada.closes_at,
                matchday: jornada.matchday?.name,
            },
            partidos: jornada.matchday.matches.map(m => {
                const pred = predicciones.find(p => p.match_id === m.id);
                return {
                    match_id: m.id,
                    home_team: m.home_team,
                    away_team: m.away_team,
                    match_date: m.match_date,
                    status: m.status,
                    resultado: m.home_score !== null ? `${m.home_score}-${m.away_score}` : null,
                    prediccion: pred ? { home: pred.home_pred, away: pred.away_pred, puntos: pred.points_earned } : null,
                };
            }),
        };
    }
    getWinner(home, away) {
        if (home > away)
            return 'home';
        if (away > home)
            return 'away';
        return 'draw';
    }
    async recalcularRankings(matchId) {
        const predicciones = await this.prediccionRepo.find({
            where: { match_id: matchId },
            relations: ['participante'],
        });
        const quinielaIds = [...new Set(predicciones.map(p => p.participante.quiniela_id))];
        for (const quinielaId of quinielaIds) {
            const participantes = await this.participanteRepo.find({
                where: { quiniela_id: quinielaId },
                order: { total_points: 'DESC', exact_scores: 'DESC' },
            });
            for (let i = 0; i < participantes.length; i++) {
                participantes[i].rank = i + 1;
                await this.participanteRepo.save(participantes[i]);
            }
        }
    }
    generateCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
    async findOne(id) {
        return this.quinielaRepo.findOne({
            where: { id },
            relations: ['owner', 'competition', 'scoring_rule', 'jornadas', 'jornadas.matchday'],
        });
    }
    async findMisQuinielas(userId) {
        return this.participanteRepo.find({
            where: { user_id: userId },
            relations: ['quiniela', 'quiniela.competition', 'quiniela.owner'],
            order: { joined_at: 'DESC' },
        });
    }
};
exports.QuinielasService = QuinielasService;
exports.QuinielasService = QuinielasService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(quiniela_entity_1.Quiniela)),
    __param(1, (0, typeorm_1.InjectRepository)(quiniela_jornada_entity_1.QuinielaJornada)),
    __param(2, (0, typeorm_1.InjectRepository)(quiniela_participante_entity_1.QuinielaParticipante)),
    __param(3, (0, typeorm_1.InjectRepository)(prediccion_entity_1.Prediccion)),
    __param(4, (0, typeorm_1.InjectRepository)(scoring_rule_entity_1.ScoringRule)),
    __param(5, (0, typeorm_1.InjectRepository)(match_entity_1.Match)),
    __param(6, (0, typeorm_1.InjectRepository)(matchday_entity_1.Matchday)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], QuinielasService);
//# sourceMappingURL=quinielas.service.js.map