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
var CompetitionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompetitionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const rxjs_1 = require("rxjs");
const competition_entity_1 = require("./competition.entity");
const matchday_entity_1 = require("../matchdays/matchday.entity");
const match_entity_1 = require("../matches/match.entity");
const quinielas_service_1 = require("../quinielas/quinielas.service");
let CompetitionsService = CompetitionsService_1 = class CompetitionsService {
    constructor(compRepo, matchdayRepo, matchRepo, httpService, configService, quinielasService) {
        this.compRepo = compRepo;
        this.matchdayRepo = matchdayRepo;
        this.matchRepo = matchRepo;
        this.httpService = httpService;
        this.configService = configService;
        this.quinielasService = quinielasService;
        this.logger = new common_1.Logger(CompetitionsService_1.name);
    }
    findAll() {
        return this.compRepo.find({ where: { is_active: true }, order: { region: 'ASC', name: 'ASC' } });
    }
    async findOne(id) {
        const comp = await this.compRepo.findOne({ where: { id } });
        if (!comp)
            throw new common_1.NotFoundException('Competencia no encontrada');
        return comp;
    }
    async getMatchdays(competitionId) {
        return this.matchdayRepo.find({
            where: { competition_id: competitionId },
            order: { round_number: 'ASC' },
        });
    }
    async getMatchdayWithMatches(matchdayId) {
        const md = await this.matchdayRepo.findOne({
            where: { id: matchdayId },
            relations: ['competition', 'matches'],
        });
        if (!md)
            throw new common_1.NotFoundException('Jornada no encontrada');
        md.matches.sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
        return md;
    }
    async syncTemporada(competitionApiId, season) {
        this.logger.log(`Sincronizando temporada ${season} de competencia ${competitionApiId}...`);
        const apiKey = this.configService.get('API_FOOTBALL_KEY');
        const apiUrl = this.configService.get('API_FOOTBALL_URL');
        const res = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${apiUrl}/fixtures`, {
            headers: { 'x-apisports-key': apiKey },
            params: { league: competitionApiId, season },
        }));
        const fixtures = res.data?.response || [];
        if (!fixtures.length) {
            this.logger.warn(`No se encontraron fixtures para liga ${competitionApiId} temporada ${season}`);
            return;
        }
        const competition = await this.compRepo.findOne({
            where: { api_football_id: competitionApiId },
        });
        if (!competition) {
            this.logger.error(`Competencia con api_football_id ${competitionApiId} no encontrada en BD`);
            return;
        }
        const byRound = {};
        for (const f of fixtures) {
            const round = f.league.round;
            if (!byRound[round])
                byRound[round] = [];
            byRound[round].push(f);
        }
        let jornadasCreadas = 0;
        let partidosCreados = 0;
        for (const [roundName, roundFixtures] of Object.entries(byRound)) {
            const roundMatch = roundName.match(/(\d+)$/);
            const roundNumber = roundMatch ? parseInt(roundMatch[1]) : null;
            let matchday = await this.matchdayRepo.findOne({
                where: { competition_id: competition.id, name: roundName, season },
            });
            if (!matchday) {
                const dates = roundFixtures.map(f => new Date(f.fixture.date));
                matchday = this.matchdayRepo.create({
                    competition_id: competition.id,
                    name: roundName,
                    season,
                    round_number: roundNumber,
                    start_date: new Date(Math.min(...dates.map(d => d.getTime()))),
                    end_date: new Date(Math.max(...dates.map(d => d.getTime()))),
                });
                await this.matchdayRepo.save(matchday);
                jornadasCreadas++;
            }
            for (const f of roundFixtures) {
                const apiId = f.fixture.id;
                const existe = await this.matchRepo.findOne({ where: { api_football_id: apiId } });
                if (existe)
                    continue;
                const match = this.matchRepo.create({
                    matchday_id: matchday.id,
                    home_team: f.teams.home.name,
                    away_team: f.teams.away.name,
                    home_logo_url: f.teams.home.logo,
                    away_logo_url: f.teams.away.logo,
                    match_date: new Date(f.fixture.date),
                    status: this.mapStatus(f.fixture.status.short),
                    home_score: f.goals.home,
                    away_score: f.goals.away,
                    api_football_id: apiId,
                });
                await this.matchRepo.save(match);
                partidosCreados++;
            }
        }
        this.logger.log(`Sync completado: ${jornadasCreadas} jornadas y ${partidosCreados} partidos creados`);
    }
    async syncResultadosEnVivo() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const partidos = await this.matchRepo
            .createQueryBuilder('m')
            .where('m.status IN (:...statuses)', { statuses: [match_entity_1.MatchStatus.LIVE, match_entity_1.MatchStatus.SCHEDULED] })
            .andWhere('m.match_date >= :today', { today })
            .andWhere('m.match_date < :tomorrow', { tomorrow })
            .andWhere('m.api_football_id IS NOT NULL')
            .getMany();
        if (!partidos.length)
            return;
        const apiKey = this.configService.get('API_FOOTBALL_KEY');
        const apiUrl = this.configService.get('API_FOOTBALL_URL');
        for (const partido of partidos) {
            try {
                const res = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${apiUrl}/fixtures`, {
                    headers: { 'x-apisports-key': apiKey },
                    params: { id: partido.api_football_id },
                }));
                const f = res.data?.response?.[0];
                if (!f)
                    continue;
                const nuevoStatus = this.mapStatus(f.fixture.status.short);
                const eraFinalizado = partido.status === match_entity_1.MatchStatus.FINISHED;
                const esFinalizado = nuevoStatus === match_entity_1.MatchStatus.FINISHED;
                await this.matchRepo.update(partido.id, {
                    status: nuevoStatus,
                    home_score: f.goals.home,
                    away_score: f.goals.away,
                });
                if (!eraFinalizado && esFinalizado) {
                    this.logger.log(`⚽ Partido terminado: ${partido.home_team} ${f.goals.home}-${f.goals.away} ${partido.away_team}`);
                    await this.quinielasService.calcularPuntos(partido.id);
                }
                await this.sleep(300);
            }
            catch (e) {
                this.logger.error(`Error sync partido ${partido.id}: ${e.message}`);
            }
        }
    }
    async createMatchday(data) {
        return this.matchdayRepo.save(this.matchdayRepo.create(data));
    }
    async createMatch(data) {
        return this.matchRepo.save(this.matchRepo.create(data));
    }
    async updateResult(matchId, homeScore, awayScore) {
        const match = await this.matchRepo.findOne({ where: { id: matchId } });
        if (!match)
            throw new common_1.NotFoundException('Partido no encontrado');
        const eraFinalizado = match.status === match_entity_1.MatchStatus.FINISHED;
        await this.matchRepo.update(matchId, {
            home_score: homeScore,
            away_score: awayScore,
            status: match_entity_1.MatchStatus.FINISHED,
        });
        if (!eraFinalizado) {
            await this.quinielasService.calcularPuntos(matchId);
        }
        return this.matchRepo.findOne({ where: { id: matchId } });
    }
    mapStatus(s) {
        const map = {
            'NS': match_entity_1.MatchStatus.SCHEDULED, 'TBD': match_entity_1.MatchStatus.SCHEDULED,
            '1H': match_entity_1.MatchStatus.LIVE, 'HT': match_entity_1.MatchStatus.LIVE,
            '2H': match_entity_1.MatchStatus.LIVE, 'ET': match_entity_1.MatchStatus.LIVE,
            'P': match_entity_1.MatchStatus.LIVE, 'BT': match_entity_1.MatchStatus.LIVE,
            'FT': match_entity_1.MatchStatus.FINISHED, 'AET': match_entity_1.MatchStatus.FINISHED, 'PEN': match_entity_1.MatchStatus.FINISHED,
            'PST': match_entity_1.MatchStatus.POSTPONED,
            'CANC': match_entity_1.MatchStatus.CANCELLED, 'ABD': match_entity_1.MatchStatus.CANCELLED,
        };
        return map[s] || match_entity_1.MatchStatus.SCHEDULED;
    }
    sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
};
exports.CompetitionsService = CompetitionsService;
__decorate([
    (0, schedule_1.Cron)('*/5 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CompetitionsService.prototype, "syncResultadosEnVivo", null);
exports.CompetitionsService = CompetitionsService = CompetitionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(competition_entity_1.Competition)),
    __param(1, (0, typeorm_1.InjectRepository)(matchday_entity_1.Matchday)),
    __param(2, (0, typeorm_1.InjectRepository)(match_entity_1.Match)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        axios_1.HttpService,
        config_1.ConfigService,
        quinielas_service_1.QuinielasService])
], CompetitionsService);
//# sourceMappingURL=competitions.service.js.map