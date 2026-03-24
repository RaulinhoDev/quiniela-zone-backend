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
var QuinielasService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuinielasService = exports.PREMIUM_LIMITS = void 0;
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
const user_entity_1 = require("../users/user.entity");
exports.PREMIUM_LIMITS = {
    MAX_QUINIELAS_FREE: 1,
    MAX_PARTICIPANTES_FREE: 15,
    MAX_PARTICIPANTES_PREMIUM: 50,
};
let QuinielasService = QuinielasService_1 = class QuinielasService {
    constructor(quinielaRepo, jornadaRepo, participanteRepo, prediccionRepo, scoringRepo, matchRepo, matchdayRepo, userRepo) {
        this.quinielaRepo = quinielaRepo;
        this.jornadaRepo = jornadaRepo;
        this.participanteRepo = participanteRepo;
        this.prediccionRepo = prediccionRepo;
        this.scoringRepo = scoringRepo;
        this.matchRepo = matchRepo;
        this.matchdayRepo = matchdayRepo;
        this.userRepo = userRepo;
        this.logger = new common_1.Logger(QuinielasService_1.name);
    }
    async create(owner, dto) {
        if (!owner.is_premium) {
            const count = await this.quinielaRepo.count({ where: { owner_id: owner.id } });
            if (count >= exports.PREMIUM_LIMITS.MAX_QUINIELAS_FREE) {
                throw new common_1.ForbiddenException(`Los usuarios gratuitos solo pueden crear ${exports.PREMIUM_LIMITS.MAX_QUINIELAS_FREE} quiniela. Actualizá a Premium para crear más.`);
            }
        }
        const jornadas = await this.matchdayRepo.find({
            where: { competition_id: dto.competition_id, season: dto.season, torneo: dto.torneo },
            relations: ['matches'],
            order: { round_number: 'ASC' },
        });
        if (!jornadas.length) {
            throw new common_1.BadRequestException(`No hay jornadas cargadas para ese torneo. Cargalas desde el panel de administración antes de crear la quiniela.`);
        }
        const primeraJornada = jornadas[0];
        if (!primeraJornada.matches?.length) {
            throw new common_1.BadRequestException('La primera jornada no tiene partidos cargados.');
        }
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
        this.logger.log(`Quiniela creada: "${quiniela.name}" (id=${quiniela.id}) por user ${owner.id}`);
        const scoring = this.scoringRepo.create({
            quiniela_id: quiniela.id,
            exact_score_pts: dto.scoring?.exact_score_pts ?? 3,
            correct_winner_pts: dto.scoring?.correct_winner_pts ?? 1,
            double_points_final: dto.scoring?.double_points_final ?? false,
        });
        await this.scoringRepo.save(scoring);
        await this.unirseInterno(owner.id, quiniela.id);
        return (await this.findOne(quiniela.id));
    }
    async abrirQuiniela(owner, quinielaId) {
        const quiniela = await this.quinielaRepo.findOne({ where: { id: quinielaId } });
        if (!quiniela)
            throw new common_1.NotFoundException('Quiniela no encontrada');
        if (quiniela.owner_id !== owner.id)
            throw new common_1.ForbiddenException('Solo el organizador puede abrir la quiniela');
        if (quiniela.status !== quiniela_entity_1.QuinielaStatus.ESPERANDO) {
            throw new common_1.BadRequestException('La quiniela ya fue abierta');
        }
        const matchdays = await this.matchdayRepo.find({
            where: { competition_id: quiniela.competition_id, season: quiniela.season },
            relations: ['matches'],
            order: { round_number: 'ASC' },
        });
        const primeraJornada = matchdays[0];
        if (!primeraJornada?.matches?.length) {
            throw new common_1.BadRequestException('No hay partidos cargados para esta competencia');
        }
        const partidosOrdenados = primeraJornada.matches
            .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
        const closesAt = new Date(partidosOrdenados[0].match_date);
        await this.quinielaRepo.update(quinielaId, { status: quiniela_entity_1.QuinielaStatus.ACTIVA });
        const jornadaQuiniela = this.jornadaRepo.create({
            quiniela_id: quinielaId,
            matchday_id: primeraJornada.id,
            round_number: 1,
            status: quiniela_jornada_entity_1.JornadaStatus.ABIERTA,
            closes_at: closesAt,
        });
        await this.jornadaRepo.save(jornadaQuiniela);
        this.logger.log(`Quiniela ${quinielaId} abierta — jornada 1 cierra: ${closesAt}`);
    }
    async unirse(user, quinielaId) {
        const quiniela = await this.quinielaRepo.findOne({ where: { id: quinielaId } });
        if (!quiniela)
            throw new common_1.NotFoundException('Quiniela no encontrada');
        if (!quiniela.is_active)
            throw new common_1.BadRequestException('Esta quiniela no está activa');
        if (quiniela.status === quiniela_entity_1.QuinielaStatus.FINALIZADA) {
            throw new common_1.BadRequestException('Esta quiniela ya finalizó');
        }
        if (quiniela.status === quiniela_entity_1.QuinielaStatus.ACTIVA) {
            throw new common_1.BadRequestException('La quiniela ya inició — no se aceptan nuevos participantes');
        }
        const existe = await this.participanteRepo.findOne({
            where: { quiniela_id: quinielaId, user_id: user.id },
        });
        if (existe)
            throw new common_1.ConflictException('Ya estás participando en esta quiniela');
        const owner = await this.userRepo.findOne({ where: { id: quiniela.owner_id } });
        const maxParticipantes = owner?.is_premium
            ? exports.PREMIUM_LIMITS.MAX_PARTICIPANTES_PREMIUM
            : exports.PREMIUM_LIMITS.MAX_PARTICIPANTES_FREE;
        const currentCount = await this.participanteRepo.count({ where: { quiniela_id: quinielaId } });
        if (currentCount >= maxParticipantes) {
            throw new common_1.BadRequestException(`Esta quiniela alcanzó el límite de ${maxParticipantes} participantes.${!owner?.is_premium ? ' El organizador debe actualizar a Premium para ampliar el límite a 50.' : ''}`);
        }
        const participante = this.participanteRepo.create({
            quiniela_id: quinielaId,
            user_id: user.id,
        });
        const saved = await this.participanteRepo.save(participante);
        this.logger.log(`User ${user.id} se unió a quiniela ${quinielaId}`);
        return saved;
    }
    async unirseInterno(userId, quinielaId) {
        const participante = this.participanteRepo.create({ quiniela_id: quinielaId, user_id: userId });
        await this.participanteRepo.save(participante);
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
        const ahora = new Date();
        const matchMap = new Map(jornada.matchday.matches.map(m => [m.id, m]));
        for (const p of dto.predicciones) {
            const match = matchMap.get(p.match_id);
            if (!match) {
                throw new common_1.BadRequestException(`El partido ${p.match_id} no pertenece a esta jornada`);
            }
            if (match.status === match_entity_1.MatchStatus.LIVE || match.status === match_entity_1.MatchStatus.FINISHED) {
                throw new common_1.BadRequestException(`El partido ${match.home_team} vs ${match.away_team} ya inició — no se puede predecir`);
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
            this.logger.debug(`Puntos calculados — participante=${prediccion.participante_id} match=${matchId} pts=${points}`);
            prediccion.points_earned = points;
            prediccion.is_calculated = true;
            await this.prediccionRepo.save(prediccion);
            if (points > 0) {
                await this.participanteRepo.increment({ id: prediccion.participante_id }, 'total_points', points);
            }
        }
        await this.recalcularRankings(matchId);
        await this.verificarYAvanzarJornada(matchId);
    }
    async verificarYAvanzarJornada(matchId) {
        const prediccion = await this.prediccionRepo.findOne({
            where: { match_id: matchId },
            relations: ['participante'],
        });
        if (!prediccion)
            return;
        const jornadasActivas = await this.jornadaRepo.find({
            where: { quiniela_id: prediccion.participante.quiniela_id, status: quiniela_jornada_entity_1.JornadaStatus.ABIERTA },
            relations: ['matchday', 'matchday.matches'],
        });
        for (const jornada of jornadasActivas) {
            const partidos = jornada.matchday?.matches || [];
            const todosTerminados = partidos.length > 0 &&
                partidos.every(m => m.status === match_entity_1.MatchStatus.FINISHED);
            if (!todosTerminados)
                continue;
            await this.jornadaRepo.update(jornada.id, { status: quiniela_jornada_entity_1.JornadaStatus.FINALIZADA, points_calculated: true });
            this.logger.log(`Jornada ${jornada.round_number} finalizada en quiniela ${jornada.quiniela_id}`);
            const quiniela = await this.quinielaRepo.findOne({ where: { id: jornada.quiniela_id } });
            if (!quiniela)
                continue;
            const matchdayActual = jornada.matchday;
            const siguienteMatchday = await this.matchdayRepo.findOne({
                where: {
                    competition_id: quiniela.competition_id,
                    season: matchdayActual.season,
                    torneo: matchdayActual.torneo,
                    round_number: (matchdayActual.round_number || 0) + 1,
                },
                relations: ['matches'],
            });
            if (!siguienteMatchday || !siguienteMatchday.matches?.length) {
                await this.quinielaRepo.update(jornada.quiniela_id, { status: quiniela_entity_1.QuinielaStatus.FINALIZADA });
                this.logger.log(`Quiniela ${jornada.quiniela_id} finalizada — no hay más jornadas`);
                continue;
            }
            const partidosOrdenados = siguienteMatchday.matches
                .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
            const closesAt = new Date(partidosOrdenados[0].match_date);
            const nuevaJornada = this.jornadaRepo.create({
                quiniela_id: jornada.quiniela_id,
                matchday_id: siguienteMatchday.id,
                round_number: jornada.round_number + 1,
                status: quiniela_jornada_entity_1.JornadaStatus.ABIERTA,
                closes_at: closesAt,
            });
            await this.jornadaRepo.save(nuevaJornada);
            this.logger.log(`Jornada ${nuevaJornada.round_number} abierta automáticamente en quiniela ${jornada.quiniela_id}`);
        }
    }
    async getRanking(quinielaId, page = 1, limit = 50) {
        const safePage = Math.max(1, page);
        const safeLimit = Math.min(100, Math.max(1, limit));
        const skip = (safePage - 1) * safeLimit;
        const quiniela = await this.quinielaRepo.findOne({
            where: { id: quinielaId },
            relations: ['competition', 'owner', 'scoring_rule', 'jornadas', 'jornadas.matchday'],
        });
        if (!quiniela)
            throw new common_1.NotFoundException('Quiniela no encontrada');
        const [participantes, total] = await this.participanteRepo.findAndCount({
            where: { quiniela_id: quinielaId },
            relations: ['user'],
            order: { total_points: 'DESC', exact_scores: 'DESC', correct_winners: 'DESC' },
            skip,
            take: safeLimit,
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
            ranking: participantes.map((p) => ({
                rank: p.rank,
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
            total_participantes: total,
            pagination: {
                page: safePage,
                limit: safeLimit,
                total_pages: Math.ceil(total / safeLimit),
            },
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
    async getTodasPredicciones(user, quinielaId, jornadaId) {
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
        const partidosTerminados = jornada.matchday.matches.filter(m => m.home_score !== null && m.away_score !== null);
        if (!partidosTerminados.length)
            return { partidos: [] };
        const participantes = await this.participanteRepo.find({
            where: { quiniela_id: quinielaId },
            relations: ['user'],
            order: { total_points: 'DESC' },
        });
        const todasPredicciones = await this.prediccionRepo.find({
            where: { quiniela_jornada_id: jornadaId },
        });
        const predMap = new Map();
        for (const p of todasPredicciones) {
            predMap.set(`${p.participante_id}-${p.match_id}`, p);
        }
        const partidos = partidosTerminados
            .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
            .map(m => ({
            match_id: m.id,
            home_team: m.home_team,
            away_team: m.away_team,
            resultado: `${m.home_score}-${m.away_score}`,
            predicciones: participantes.map(part => {
                const pred = predMap.get(`${part.id}-${m.id}`);
                return {
                    username: part.user.username,
                    user_id: part.user_id,
                    prediccion: pred ? `${pred.home_pred}-${pred.away_pred}` : null,
                    puntos: pred?.points_earned ?? 0,
                };
            }),
        }));
        return { partidos };
    }
    async getPuntosPorJornada(user, quinielaId, jornadaId) {
        const participante = await this.participanteRepo.findOne({
            where: { quiniela_id: quinielaId, user_id: user.id },
        });
        if (!participante)
            throw new common_1.ForbiddenException('No estás en esta quiniela');
        const participantes = await this.participanteRepo.find({
            where: { quiniela_id: quinielaId },
            relations: ['user'],
        });
        const predicciones = await this.prediccionRepo.find({
            where: { quiniela_jornada_id: jornadaId },
        });
        const puntosPorParticipante = new Map();
        for (const pred of predicciones) {
            const actual = puntosPorParticipante.get(pred.participante_id) ?? 0;
            puntosPorParticipante.set(pred.participante_id, actual + pred.points_earned);
        }
        const misPartPuntos = puntosPorParticipante.get(participante.id) ?? 0;
        return participantes
            .map(part => ({
            user_id: part.user_id,
            username: part.user.username,
            puntos_jornada: puntosPorParticipante.get(part.id) ?? 0,
            diff_conmigo: (puntosPorParticipante.get(part.id) ?? 0) - misPartPuntos,
        }))
            .sort((a, b) => b.puntos_jornada - a.puntos_jornada);
    }
    async getHistorial(user, quinielaId) {
        const participante = await this.participanteRepo.findOne({
            where: { quiniela_id: quinielaId, user_id: user.id },
        });
        if (!participante)
            throw new common_1.ForbiddenException('No estás en esta quiniela');
        const jornadas = await this.jornadaRepo.find({
            where: { quiniela_id: quinielaId },
            relations: ['matchday', 'matchday.matches'],
            order: { round_number: 'ASC' },
        });
        const predicciones = await this.prediccionRepo.find({
            where: { participante_id: participante.id },
            relations: ['match'],
        });
        const predMap = new Map(predicciones.map(p => [p.match_id, p]));
        let totalPartidos = 0;
        let totalAciertos = 0;
        let exactos = 0;
        let ganadorOk = 0;
        const jornadasData = jornadas.map(j => {
            const partidos = (j.matchday?.matches || [])
                .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
                .map(m => {
                const pred = predMap.get(m.id);
                const finalizado = m.home_score !== null && m.away_score !== null;
                let acierto = null;
                if (finalizado && pred) {
                    if (pred.home_pred === m.home_score && pred.away_pred === m.away_score) {
                        acierto = 'exacto';
                    }
                    else if (this.getWinner(pred.home_pred, pred.away_pred) === this.getWinner(m.home_score, m.away_score)) {
                        acierto = 'ganador';
                    }
                    else {
                        acierto = 'fallo';
                    }
                }
                if (finalizado && pred) {
                    totalPartidos++;
                    if (acierto === 'exacto') {
                        exactos++;
                        totalAciertos++;
                    }
                    if (acierto === 'ganador') {
                        ganadorOk++;
                    }
                }
                return {
                    match_id: m.id,
                    home_team: m.home_team,
                    away_team: m.away_team,
                    match_date: m.match_date,
                    status: m.status,
                    resultado: finalizado ? `${m.home_score}-${m.away_score}` : null,
                    prediccion: pred ? {
                        home: pred.home_pred,
                        away: pred.away_pred,
                        puntos: pred.points_earned,
                    } : null,
                    acierto,
                };
            });
            const jornadaFinalizada = partidos.filter(p => p.resultado).length;
            const jornadaExactos = partidos.filter(p => p.acierto === 'exacto').length;
            const jornadaGanadores = partidos.filter(p => p.acierto === 'ganador').length;
            const jornadaAciertos = jornadaExactos;
            return {
                jornada_id: j.id,
                round_number: j.round_number,
                nombre: j.matchday?.name || `Jornada ${j.round_number}`,
                status: j.status,
                partidos,
                stats: {
                    jugados: jornadaFinalizada,
                    aciertos: jornadaAciertos,
                    porcentaje: jornadaFinalizada > 0 ? Math.round(((jornadaExactos + jornadaGanadores * 0.5) / jornadaFinalizada) * 100) : null,
                },
            };
        });
        return {
            participante: {
                total_points: participante.total_points,
                exact_scores: participante.exact_scores,
                correct_winners: participante.correct_winners,
                rank: participante.rank,
            },
            stats: {
                partidos_jugados: totalPartidos,
                aciertos: totalAciertos,
                exactos,
                ganador_correcto: ganadorOk,
                porcentaje: totalPartidos > 0 ? Math.round(((exactos + ganadorOk * 0.5) / totalPartidos) * 100) : 0,
            },
            jornadas: jornadasData,
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
                order: { total_points: 'DESC', exact_scores: 'DESC', correct_winners: 'DESC' },
            });
            for (let i = 0; i < participantes.length; i++) {
                if (i > 0 &&
                    participantes[i].total_points === participantes[i - 1].total_points &&
                    participantes[i].exact_scores === participantes[i - 1].exact_scores &&
                    participantes[i].correct_winners === participantes[i - 1].correct_winners) {
                    participantes[i].rank = participantes[i - 1].rank;
                }
                else {
                    participantes[i].rank = i + 1;
                }
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
    async getPerfilPublico(username) {
        const user = await this.userRepo.findOne({ where: { username } });
        if (!user)
            throw new Error('Usuario no encontrado');
        const stats = await this.getMisEstadisticas(user.id);
        const trofeos = await this.getMisTrofeos(user.id);
        return {
            username: user.username,
            full_name: user.full_name,
            country: user.country,
            member_since: user.created_at,
            ...stats,
            trofeos,
        };
    }
    async getMisEstadisticas(userId) {
        const partRow = await this.participanteRepo
            .createQueryBuilder('p')
            .select('SUM(p.exact_scores)', 'total_exactos')
            .addSelect('SUM(p.correct_winners)', 'total_ganadores')
            .addSelect('MIN(p.rank)', 'mejor_rank')
            .where('p.user_id = :userId', { userId })
            .getRawOne();
        const predRow = await this.prediccionRepo
            .createQueryBuilder('pred')
            .innerJoin('pred.participante', 'p')
            .select('COUNT(pred.id)', 'total')
            .where('p.user_id = :userId', { userId })
            .getRawOne();
        const exactos = Number(partRow.total_exactos) || 0;
        const ganadores = Number(partRow.total_ganadores) || 0;
        const total = Number(predRow.total) || 0;
        const mejor_rank = partRow.mejor_rank != null ? Number(partRow.mejor_rank) : null;
        const porcentaje = total > 0
            ? Math.round(((exactos + ganadores * 0.5) / total) * 100)
            : 0;
        return {
            mejor_rank,
            total_acertados: exactos + ganadores,
            porcentaje_aciertos: porcentaje,
        };
    }
    async getMisTrofeos(userId) {
        const ganadas = await this.participanteRepo
            .createQueryBuilder('p')
            .innerJoinAndSelect('p.quiniela', 'q')
            .leftJoinAndSelect('q.competition', 'c')
            .where('p.user_id = :userId', { userId })
            .andWhere('p.rank = 1')
            .andWhere('q.status = :status', { status: quiniela_entity_1.QuinielaStatus.FINALIZADA })
            .andWhere('q.is_paid = false')
            .orderBy('q.updated_at', 'DESC')
            .getMany();
        return ganadas.map(p => ({
            quiniela_id: p.quiniela.id,
            name: p.quiniela.name,
            competition: p.quiniela.competition?.name,
            season: p.quiniela.season,
            total_points: p.total_points,
        }));
    }
    async getQuinielasForMatch(matchId) {
        const predicciones = await this.prediccionRepo.find({
            where: { match_id: matchId },
            relations: ['participante'],
        });
        return [...new Set(predicciones.map(p => p.participante.quiniela_id))];
    }
    async getMisLimites(user) {
        const quinielasCreadas = await this.quinielaRepo.count({ where: { owner_id: user.id } });
        return {
            is_premium: user.is_premium,
            quinielas: {
                creadas: quinielasCreadas,
                limite: user.is_premium ? null : exports.PREMIUM_LIMITS.MAX_QUINIELAS_FREE,
                ilimitado: user.is_premium,
            },
            participantes: {
                limite_por_quiniela: user.is_premium
                    ? exports.PREMIUM_LIMITS.MAX_PARTICIPANTES_PREMIUM
                    : exports.PREMIUM_LIMITS.MAX_PARTICIPANTES_FREE,
            },
        };
    }
};
exports.QuinielasService = QuinielasService;
exports.QuinielasService = QuinielasService = QuinielasService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(quiniela_entity_1.Quiniela)),
    __param(1, (0, typeorm_1.InjectRepository)(quiniela_jornada_entity_1.QuinielaJornada)),
    __param(2, (0, typeorm_1.InjectRepository)(quiniela_participante_entity_1.QuinielaParticipante)),
    __param(3, (0, typeorm_1.InjectRepository)(prediccion_entity_1.Prediccion)),
    __param(4, (0, typeorm_1.InjectRepository)(scoring_rule_entity_1.ScoringRule)),
    __param(5, (0, typeorm_1.InjectRepository)(match_entity_1.Match)),
    __param(6, (0, typeorm_1.InjectRepository)(matchday_entity_1.Matchday)),
    __param(7, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], QuinielasService);
//# sourceMappingURL=quinielas.service.js.map