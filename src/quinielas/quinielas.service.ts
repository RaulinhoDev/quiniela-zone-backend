import {
  Injectable, NotFoundException, BadRequestException,
  ForbiddenException, ConflictException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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

@Injectable()
export class QuinielasService {
  constructor(
    @InjectRepository(Quiniela)
    private quinielaRepo: Repository<Quiniela>,
    @InjectRepository(QuinielaJornada)
    private jornadaRepo: Repository<QuinielaJornada>,
    @InjectRepository(QuinielaParticipante)
    private participanteRepo: Repository<QuinielaParticipante>,
    @InjectRepository(Prediccion)
    private prediccionRepo: Repository<Prediccion>,
    @InjectRepository(ScoringRule)
    private scoringRepo: Repository<ScoringRule>,
    @InjectRepository(Match)
    private matchRepo: Repository<Match>,
    @InjectRepository(Matchday)
    private matchdayRepo: Repository<Matchday>,
  ) {}

  // ─── Crear quiniela ────────────────────────────────────────────
  async create(owner: User, dto: CreateQuinielaDto): Promise<Quiniela> {
    const invite_code = this.generateCode();

    const quiniela = this.quinielaRepo.create({
      owner_id:       owner.id,
      competition_id: dto.competition_id,
      name:           dto.name,
      description:    dto.description,
      invite_code,
      season:         dto.season,
      is_paid:        dto.is_paid  || false,
      entry_fee:      dto.entry_fee || 0,
      is_active:      true,
      status:         QuinielaStatus.ESPERANDO,
    });

    await this.quinielaRepo.save(quiniela);

    // Crear reglas de puntuación
    const scoring = this.scoringRepo.create({
      quiniela_id:          quiniela.id,
      exact_score_pts:      dto.scoring?.exact_score_pts      ?? 3,
      correct_winner_pts:   dto.scoring?.correct_winner_pts   ?? 1,
      double_points_final:  dto.scoring?.double_points_final  ?? false,
    });
    await this.scoringRepo.save(scoring);

    // El owner se une automáticamente
    await this.unirse(owner, quiniela.id);

    return this.findOne(quiniela.id);
  }

  // ─── Unirse a quiniela ─────────────────────────────────────────
  async unirse(user: User, quinielaId: number): Promise<QuinielaParticipante> {
    const quiniela = await this.quinielaRepo.findOne({ where: { id: quinielaId } });
    if (!quiniela) throw new NotFoundException('Quiniela no encontrada');
    if (!quiniela.is_active) throw new BadRequestException('Esta quiniela no está activa');

    // Solo se puede unir mientras está en ESPERANDO
    if (quiniela.status !== QuinielaStatus.ESPERANDO) {
      throw new BadRequestException('La quiniela ya inició — no se aceptan nuevos participantes');
    }

    const existe = await this.participanteRepo.findOne({
      where: { quiniela_id: quinielaId, user_id: user.id },
    });
    if (existe) throw new ConflictException('Ya estás participando en esta quiniela');

    const participante = this.participanteRepo.create({
      quiniela_id: quinielaId,
      user_id:     user.id,
    });

    return this.participanteRepo.save(participante);
  }

  // ─── Unirse por código de invitación ──────────────────────────
  async unirseByCode(user: User, invite_code: string): Promise<QuinielaParticipante> {
    const quiniela = await this.quinielaRepo.findOne({
      where: { invite_code: invite_code.toUpperCase() },
    });
    if (!quiniela) throw new NotFoundException('Código inválido');
    return this.unirse(user, quiniela.id);
  }

  // ─── Owner abre una jornada ────────────────────────────────────
  async abrirJornada(owner: User, quinielaId: number, dto: AbrirJornadaDto): Promise<QuinielaJornada> {
    const quiniela = await this.quinielaRepo.findOne({
      where: { id: quinielaId },
      relations: ['jornadas'],
    });

    if (!quiniela)           throw new NotFoundException('Quiniela no encontrada');
    if (quiniela.owner_id !== owner.id) throw new ForbiddenException('Solo el owner puede abrir jornadas');

    // Verificar que el matchday existe y tiene partidos
    const matchday = await this.matchdayRepo.findOne({
      where: { id: dto.matchday_id },
      relations: ['matches'],
    });
    if (!matchday) throw new NotFoundException('Jornada no encontrada');
    if (!matchday.matches.length) throw new BadRequestException('La jornada no tiene partidos registrados');

    // Verificar que no haya otra jornada abierta
    const jornadaAbierta = quiniela.jornadas?.find(j => j.status === JornadaStatus.ABIERTA);
    if (jornadaAbierta) throw new BadRequestException('Ya hay una jornada abierta — cerrala antes de abrir la siguiente');

    // Verificar que este matchday no fue usado antes en esta quiniela
    const yaUsado = quiniela.jornadas?.find(j => j.matchday_id === dto.matchday_id);
    if (yaUsado) throw new BadRequestException('Esta jornada ya fue usada en la quiniela');

    const round_number = (quiniela.jornadas?.length || 0) + 1;

    const jornadaQuiniela = this.jornadaRepo.create({
      quiniela_id:  quinielaId,
      matchday_id:  dto.matchday_id,
      round_number,
      status:       JornadaStatus.ABIERTA,
      closes_at:    new Date(dto.closes_at),
    });

    await this.jornadaRepo.save(jornadaQuiniela);

    // Si es la primera jornada, cambiar status de la quiniela a ACTIVA
    if (quiniela.status === QuinielaStatus.ESPERANDO) {
      await this.quinielaRepo.update(quinielaId, { status: QuinielaStatus.ACTIVA });
    }

    return jornadaQuiniela;
  }

  // ─── Participante envía predicciones ──────────────────────────
  async enviarPredicciones(
    user: User,
    quinielaId: number,
    jornadaId: number,
    dto: SubmitPrediccionesDto,
  ): Promise<Prediccion[]> {
    const jornada = await this.jornadaRepo.findOne({
      where: { id: jornadaId, quiniela_id: quinielaId },
      relations: ['matchday', 'matchday.matches'],
    });

    if (!jornada) throw new NotFoundException('Jornada no encontrada');
    if (jornada.status !== JornadaStatus.ABIERTA) {
      throw new BadRequestException('Esta jornada no está abierta para predicciones');
    }
    if (new Date() > jornada.closes_at) {
      throw new BadRequestException('El plazo para enviar predicciones cerró');
    }

    const participante = await this.participanteRepo.findOne({
      where: { quiniela_id: quinielaId, user_id: user.id },
    });
    if (!participante) throw new ForbiddenException('No estás participando en esta quiniela');

    // Validar que los partidos pertenecen a esta jornada
    const validIds = jornada.matchday.matches.map(m => m.id);
    for (const p of dto.predicciones) {
      if (!validIds.includes(p.match_id)) {
        throw new BadRequestException(`El partido ${p.match_id} no pertenece a esta jornada`);
      }
    }

    const saved: Prediccion[] = [];

    for (const pred of dto.predicciones) {
      let prediccion = await this.prediccionRepo.findOne({
        where: { participante_id: participante.id, match_id: pred.match_id },
      });

      if (prediccion) {
        prediccion.home_pred     = pred.home_pred;
        prediccion.away_pred     = pred.away_pred;
        prediccion.is_calculated = false;
      } else {
        prediccion = this.prediccionRepo.create({
          participante_id:    participante.id,
          quiniela_jornada_id: jornadaId,
          match_id:           pred.match_id,
          home_pred:          pred.home_pred,
          away_pred:          pred.away_pred,
        });
      }

      saved.push(await this.prediccionRepo.save(prediccion));
    }

    // Marcar que este participante jugó esta jornada
    await this.participanteRepo.increment({ id: participante.id }, 'jornadas_jugadas', 0);

    return saved;
  }

  // ─── Motor de puntos ───────────────────────────────────────────
  async calcularPuntos(matchId: number): Promise<void> {
    const match = await this.matchRepo.findOne({ where: { id: matchId } });
    if (!match || match.status !== MatchStatus.FINISHED) return;
    if (match.home_score === null || match.away_score === null) return;

    const predicciones = await this.prediccionRepo.find({
      where: { match_id: matchId, is_calculated: false },
      relations: [
        'participante',
        'participante.quiniela',
        'participante.quiniela.scoring_rule',
      ],
    });

    for (const prediccion of predicciones) {
      const rule   = prediccion.participante.quiniela.scoring_rule;
      let   points = 0;

      const exacto  = prediccion.home_pred === match.home_score &&
                      prediccion.away_pred === match.away_score;

      const ganador = !exacto &&
                      this.getWinner(prediccion.home_pred, prediccion.away_pred) ===
                      this.getWinner(match.home_score, match.away_score);

      if (exacto) {
        points = rule.exact_score_pts;
        await this.participanteRepo.increment({ id: prediccion.participante_id }, 'exact_scores', 1);
      } else if (ganador) {
        points = rule.correct_winner_pts;
        await this.participanteRepo.increment({ id: prediccion.participante_id }, 'correct_winners', 1);
      }

      prediccion.points_earned  = points;
      prediccion.is_calculated  = true;
      await this.prediccionRepo.save(prediccion);

      if (points > 0) {
        await this.participanteRepo.increment(
          { id: prediccion.participante_id },
          'total_points', points
        );
      }
    }

    await this.recalcularRankings(matchId);
  }

  // ─── Ranking de la quiniela ────────────────────────────────────
  async getRanking(quinielaId: number) {
    const quiniela = await this.quinielaRepo.findOne({
      where: { id: quinielaId },
      relations: ['competition', 'owner', 'scoring_rule', 'jornadas', 'jornadas.matchday'],
    });
    if (!quiniela) throw new NotFoundException('Quiniela no encontrada');

    const participantes = await this.participanteRepo.find({
      where: { quiniela_id: quinielaId },
      relations: ['user'],
      order: { total_points: 'DESC', exact_scores: 'DESC' },
    });

    return {
      quiniela: {
        id:           quiniela.id,
        name:         quiniela.name,
        competition:  quiniela.competition?.name,
        season:       quiniela.season,
        status:       quiniela.status,
        invite_code:  quiniela.invite_code,
        is_paid:      quiniela.is_paid,
        entry_fee:    quiniela.entry_fee,
        owner:        quiniela.owner?.username,
        scoring_rule: quiniela.scoring_rule,
        jornadas_jugadas: quiniela.jornadas?.filter(j => j.status === JornadaStatus.FINALIZADA).length || 0,
        jornada_activa:   quiniela.jornadas?.find(j => j.status === JornadaStatus.ABIERTA) || null,
      },
      ranking: participantes.map((p, i) => ({
        rank:             i + 1,
        user: {
          id:       p.user.id,
          username: p.user.username,
          country:  p.user.country,
          avatar_url: p.user.avatar_url,
        },
        total_points:     p.total_points,
        exact_scores:     p.exact_scores,
        correct_winners:  p.correct_winners,
        jornadas_jugadas: p.jornadas_jugadas,
      })),
      total_participantes: participantes.length,
    };
  }

  // ─── Ver predicciones de un participante en una jornada ────────
  async getMisPredicciones(user: User, quinielaId: number, jornadaId: number) {
    const participante = await this.participanteRepo.findOne({
      where: { quiniela_id: quinielaId, user_id: user.id },
    });
    if (!participante) throw new ForbiddenException('No estás en esta quiniela');

    const jornada = await this.jornadaRepo.findOne({
      where: { id: jornadaId, quiniela_id: quinielaId },
      relations: ['matchday', 'matchday.matches'],
    });
    if (!jornada) throw new NotFoundException('Jornada no encontrada');

    const predicciones = await this.prediccionRepo.find({
      where: { participante_id: participante.id, quiniela_jornada_id: jornadaId },
      relations: ['match'],
    });

    return {
      jornada: {
        id:           jornada.id,
        round_number: jornada.round_number,
        status:       jornada.status,
        closes_at:    jornada.closes_at,
        matchday:     jornada.matchday?.name,
      },
      partidos: jornada.matchday.matches.map(m => {
        const pred = predicciones.find(p => p.match_id === m.id);
        return {
          match_id:   m.id,
          home_team:  m.home_team,
          away_team:  m.away_team,
          match_date: m.match_date,
          status:     m.status,
          resultado:  m.home_score !== null ? `${m.home_score}-${m.away_score}` : null,
          prediccion: pred ? { home: pred.home_pred, away: pred.away_pred, puntos: pred.points_earned } : null,
        };
      }),
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────
  private getWinner(home: number, away: number): 'home' | 'away' | 'draw' {
    if (home > away) return 'home';
    if (away > home) return 'away';
    return 'draw';
  }

  private async recalcularRankings(matchId: number): Promise<void> {
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

  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async findOne(id: number): Promise<Quiniela> {
    return this.quinielaRepo.findOne({
      where: { id },
      relations: ['owner', 'competition', 'scoring_rule', 'jornadas', 'jornadas.matchday'],
    });
  }

  async findMisQuinielas(userId: number) {
    return this.participanteRepo.find({
      where: { user_id: userId },
      relations: ['quiniela', 'quiniela.competition', 'quiniela.owner'],
      order: { joined_at: 'DESC' },
    });
  }
}
