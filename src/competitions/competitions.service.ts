import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import { Competition } from './competition.entity';
import { Matchday } from '../matchdays/matchday.entity';
import { Match, MatchStatus } from '../matches/match.entity';
import { QuinielasService } from '../quinielas/quinielas.service';
import { SseService } from '../events/sse.service';

@Injectable()
export class CompetitionsService {
  private readonly logger = new Logger(CompetitionsService.name);

  constructor(
    @InjectRepository(Competition) private compRepo: Repository<Competition>,
    @InjectRepository(Matchday)    private matchdayRepo: Repository<Matchday>,
    @InjectRepository(Match)       private matchRepo: Repository<Match>,
    private httpService: HttpService,
    private configService: ConfigService,
    private quinielasService: QuinielasService,
    private sseService: SseService,
  ) {}

  // ─── Endpoints públicos ────────────────────────────────────────
  findAll() {
    return this.compRepo.find({ where: { is_active: true }, order: { region: 'ASC', name: 'ASC' } });
  }

  async findOne(id: number) {
    const comp = await this.compRepo.findOne({ where: { id } });
    if (!comp) throw new NotFoundException('Competencia no encontrada');
    return comp;
  }

  async getMatchdays(competitionId: number) {
    return this.matchdayRepo.find({
      where: { competition_id: competitionId },
      order: { round_number: 'ASC' },
    });
  }

  async getMatchdayWithMatches(matchdayId: number) {
    const md = await this.matchdayRepo.findOne({
      where: { id: matchdayId },
      relations: ['competition', 'matches'],
    });
    if (!md) throw new NotFoundException('Jornada no encontrada');
    md.matches.sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
    return md;
  }

  // ─── Sync completo de una temporada desde API-Football ────────
  // Llamar una vez para importar toda la temporada
  async syncTemporada(competitionApiId: number, season: string): Promise<void> {
    this.logger.log(`Sincronizando temporada ${season} de competencia ${competitionApiId}...`);

    const apiKey = this.configService.get('API_FOOTBALL_KEY');
    const apiUrl = this.configService.get('API_FOOTBALL_URL');

    // 1. Traer todos los fixtures de la temporada
    const res = await firstValueFrom(
      this.httpService.get(`${apiUrl}/fixtures`, {
        headers: { 'x-apisports-key': apiKey },
        params: { league: competitionApiId, season },
      }),
    );

    const fixtures = (res.data as any)?.response || [];
    if (!fixtures.length) {
      this.logger.warn(`No se encontraron fixtures para liga ${competitionApiId} temporada ${season}`);
      return;
    }

    // 2. Buscar la competencia en nuestra BD
    const competition = await this.compRepo.findOne({
      where: { api_football_id: competitionApiId },
    });
    if (!competition) {
      this.logger.error(`Competencia con api_football_id ${competitionApiId} no encontrada en BD`);
      return;
    }

    // 3. Agrupar fixtures por jornada
    const byRound: Record<string, any[]> = {};
    for (const f of fixtures) {
      const round = f.league.round;
      if (!byRound[round]) byRound[round] = [];
      byRound[round].push(f);
    }

    // 4. Crear jornadas y partidos
    let jornadasCreadas = 0;
    let partidosCreados = 0;

    for (const [roundName, roundFixtures] of Object.entries(byRound)) {
      // Extraer número de jornada del nombre (ej: "Regular Season - 1" → 1)
      const roundMatch = roundName.match(/(\d+)$/);
      const roundNumber = roundMatch ? parseInt(roundMatch[1]) : undefined;

      // Buscar o crear jornada
      let matchday = await this.matchdayRepo.findOne({
        where: { competition_id: competition.id, name: roundName, season },
      });

      if (!matchday) {
        const dates = roundFixtures.map(f => new Date(f.fixture.date));
        matchday = this.matchdayRepo.create({
          competition_id: competition.id,
          name:           roundName,
          season,
          round_number:   roundNumber,
          start_date:     new Date(Math.min(...dates.map(d => d.getTime()))),
          end_date:       new Date(Math.max(...dates.map(d => d.getTime()))),
        });
        await this.matchdayRepo.save(matchday);
        jornadasCreadas++;
      }

      // Crear partidos de la jornada
      for (const f of roundFixtures) {
        const apiId = f.fixture.id;
        const existe = await this.matchRepo.findOne({ where: { api_football_id: apiId } });
        if (existe) continue;

        const match = this.matchRepo.create({
          matchday_id:    matchday.id,
          home_team:      f.teams.home.name,
          away_team:      f.teams.away.name,
          home_logo_url:  f.teams.home.logo,
          away_logo_url:  f.teams.away.logo,
          match_date:     new Date(f.fixture.date),
          status:         this.mapStatus(f.fixture.status.short),
          home_score:     f.goals.home,
          away_score:     f.goals.away,
          api_football_id: apiId,
        });

        await this.matchRepo.save(match);
        partidosCreados++;
      }
    }

    this.logger.log(`Sync completado: ${jornadasCreadas} jornadas y ${partidosCreados} partidos creados`);
  }

  // ─── Job: actualizar resultados en tiempo real ─────────────────
  @Cron('*/5 * * * *')
  async syncResultadosEnVivo(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const partidos = await this.matchRepo
      .createQueryBuilder('m')
      .where('m.status IN (:...statuses)', { statuses: [MatchStatus.LIVE, MatchStatus.SCHEDULED] })
      .andWhere('m.match_date >= :today', { today })
      .andWhere('m.match_date < :tomorrow', { tomorrow })
      .andWhere('m.api_football_id IS NOT NULL')
      .getMany();

    if (!partidos.length) return;

    const apiKey = this.configService.get('API_FOOTBALL_KEY');
    const apiUrl = this.configService.get('API_FOOTBALL_URL');

    for (const partido of partidos) {
      try {
        const res = await firstValueFrom(
          this.httpService.get(`${apiUrl}/fixtures`, {
            headers: { 'x-apisports-key': apiKey },
            params: { id: partido.api_football_id },
          }),
        );

        const f = (res.data as any)?.response?.[0];
        if (!f) continue;

        const nuevoStatus = this.mapStatus(f.fixture.status.short);
        const eraFinalizado = partido.status === MatchStatus.FINISHED;
        const esFinalizado  = nuevoStatus  === MatchStatus.FINISHED;

        await this.matchRepo.update(partido.id, {
          status:     nuevoStatus,
          home_score: f.goals.home,
          away_score: f.goals.away,
        });

        // Si acaba de terminar → calcular puntos y notificar por SSE
        if (!eraFinalizado && esFinalizado) {
          this.logger.log(`⚽ Partido terminado: ${partido.home_team} ${f.goals.home}-${f.goals.away} ${partido.away_team}`);
          const quinielaIds = await this.quinielasService.getQuinielasForMatch(partido.id);
          await this.quinielasService.calcularPuntos(partido.id);
          this.sseService.emitToAll(
            quinielaIds, partido.id,
            partido.home_team, partido.away_team,
            f.goals.home, f.goals.away,
          );
        } else if (nuevoStatus === MatchStatus.LIVE && partido.status !== MatchStatus.LIVE) {
          // Partido comenzó en vivo — notificar también
          const quinielaIds = await this.quinielasService.getQuinielasForMatch(partido.id);
          this.sseService.emitToAll(
            quinielaIds, partido.id,
            partido.home_team, partido.away_team,
            f.goals.home ?? 0, f.goals.away ?? 0,
          );
        }

        await this.sleep(300);
      } catch (e) {
        this.logger.error(`Error sync partido ${partido.id}: ${e.message}`);
      }
    }
  }

  // ─── Temporadas y Torneos ──────────────────────────────────────
  async getTemporadas(competitionId: number) {
    const matchdays = await this.matchdayRepo
      .createQueryBuilder("m")
      .select("DISTINCT m.season", "season")
      .where("m.competition_id = :id", { id: competitionId })
      .orderBy("m.season", "DESC")
      .getRawMany();
    return matchdays.map(m => m.season).filter(Boolean);
  }

  async getTorneos(competitionId: number, season: string) {
    const matchdays = await this.matchdayRepo
      .createQueryBuilder("m")
      .select("DISTINCT m.torneo", "torneo")
      .where("m.competition_id = :id AND m.season = :season", { id: competitionId, season })
      .getRawMany();
    return matchdays.map(m => m.torneo).filter(Boolean);
  }

  // ─── Admin manual ──────────────────────────────────────────────
  async createMatchday(data: Partial<Matchday>) {
    return this.matchdayRepo.save(this.matchdayRepo.create(data));
  }

  async createMatch(data: Partial<Match>) {
    return this.matchRepo.save(this.matchRepo.create(data));
  }


  async updateResult(matchId: number, homeScore: number, awayScore: number) {
    const match = await this.matchRepo.findOne({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Partido no encontrado');

    const eraFinalizado = match.status === MatchStatus.FINISHED;

    await this.matchRepo.update(matchId, {
      home_score: homeScore,
      away_score: awayScore,
      status:     MatchStatus.FINISHED,
    });

    if (!eraFinalizado) {
      const quinielaIds = await this.quinielasService.getQuinielasForMatch(matchId);
      await this.quinielasService.calcularPuntos(matchId);
      this.sseService.emitToAll(
        quinielaIds, matchId,
        match.home_team, match.away_team,
        homeScore, awayScore,
      );
    }

    return this.matchRepo.findOne({ where: { id: matchId } });
  }

  // ─── Helpers ──────────────────────────────────────────────────
  private mapStatus(s: string): MatchStatus {
    const map: Record<string, MatchStatus> = {
      'NS': MatchStatus.SCHEDULED, 'TBD': MatchStatus.SCHEDULED,
      '1H': MatchStatus.LIVE, 'HT': MatchStatus.LIVE,
      '2H': MatchStatus.LIVE, 'ET': MatchStatus.LIVE,
      'P':  MatchStatus.LIVE, 'BT': MatchStatus.LIVE,
      'FT': MatchStatus.FINISHED, 'AET': MatchStatus.FINISHED, 'PEN': MatchStatus.FINISHED,
      'PST': MatchStatus.POSTPONED,
      'CANC': MatchStatus.CANCELLED, 'ABD': MatchStatus.CANCELLED,
    };
    return map[s] || MatchStatus.SCHEDULED;
  }

  private sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms));
  }
}
