import {
  Injectable, NotFoundException, BadRequestException,
  ForbiddenException, ConflictException, Logger
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

export const PREMIUM_LIMITS = {
  MAX_QUINIELAS_FREE:       1,
  MAX_PARTICIPANTES_FREE:   15,
  MAX_PARTICIPANTES_PREMIUM: 50,
};

export interface CreateQuinielaDto {
  name: string;
  description?: string;
  competition_id: number;
  season: string;
  torneo: string;
  is_paid?: boolean;
  entry_fee?: number;
  is_public?: boolean;
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
  private readonly logger = new Logger(QuinielasService.name);

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
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // ─── Crear quiniela ────────────────────────────────────────────
  async create(owner: User, dto: CreateQuinielaDto): Promise<Quiniela> {
    // Quiniela pública solo para premium
    if (dto.is_public && !owner.is_premium) {
      throw new ForbiddenException('Solo los usuarios Premium pueden crear quinielas públicas.');
    }

    // Límite para usuarios gratuitos: máximo 1 quiniela como owner
    if (!owner.is_premium) {
      const count = await this.quinielaRepo.count({ where: { owner_id: owner.id } });
      if (count >= PREMIUM_LIMITS.MAX_QUINIELAS_FREE) {
        throw new ForbiddenException(
          `Los usuarios gratuitos solo pueden crear ${PREMIUM_LIMITS.MAX_QUINIELAS_FREE} quiniela. Actualizá a Premium para crear más.`,
        );
      }
    }

    // Validar que existen jornadas para la competencia/temporada/torneo
    const jornadas = await this.matchdayRepo.find({
      where:    { competition_id: dto.competition_id, season: dto.season, torneo: dto.torneo },
      relations: ['matches'],
      order:    { round_number: 'ASC' },
    });

    if (!jornadas.length) {
      throw new BadRequestException(
        `No hay jornadas cargadas para ese torneo. Cargalas desde el panel de administración antes de crear la quiniela.`
      );
    }

    const primeraJornada = jornadas[0];
    if (!primeraJornada.matches?.length) {
      throw new BadRequestException('La primera jornada no tiene partidos cargados.');
    }

    const invite_code = this.generateCode();

    const quiniela = this.quinielaRepo.create({
      owner_id:       owner.id,
      competition_id: dto.competition_id,
      name:           dto.name,
      description:    dto.description,
      invite_code,
      season:         dto.season,
      is_paid:        dto.is_paid   || false,
      entry_fee:      dto.entry_fee || 0,
      is_public:      dto.is_public || false,
      is_active:      true,
      status:         QuinielaStatus.ESPERANDO,
    });

    await this.quinielaRepo.save(quiniela);
    this.logger.log(`Quiniela creada: "${quiniela.name}" (id=${quiniela.id}) por user ${owner.id}`);

    // Crear reglas de puntuación
    const scoring = this.scoringRepo.create({
      quiniela_id:          quiniela.id,
      exact_score_pts:      dto.scoring?.exact_score_pts      ?? 3,
      correct_winner_pts:   dto.scoring?.correct_winner_pts   ?? 1,
      double_points_final:  dto.scoring?.double_points_final  ?? false,
    });
    await this.scoringRepo.save(scoring);

    // El owner se une automáticamente
    await this.unirseInterno(owner.id, quiniela.id);

    return (await this.findOne(quiniela.id))!;
  }

  // ─── Owner abre la quiniela → jornada 1 se abre automáticamente ──
  async abrirQuiniela(owner: User, quinielaId: number): Promise<void> {
    const quiniela = await this.quinielaRepo.findOne({ where: { id: quinielaId } });
    if (!quiniela)                          throw new NotFoundException('Quiniela no encontrada');
    if (quiniela.owner_id !== owner.id)     throw new ForbiddenException('Solo el organizador puede abrir la quiniela');
    if (quiniela.status !== QuinielaStatus.ESPERANDO) {
      throw new BadRequestException('La quiniela ya fue abierta');
    }

    const matchdays = await this.matchdayRepo.find({
      where:    { competition_id: quiniela.competition_id, season: quiniela.season },
      relations: ['matches'],
      order:    { round_number: 'ASC' },
    });

    const primeraJornada = matchdays[0];
    if (!primeraJornada?.matches?.length) {
      throw new BadRequestException('No hay partidos cargados para esta competencia');
    }

    const partidosOrdenados = primeraJornada.matches
      .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
    const closesAt = new Date(partidosOrdenados[0].match_date);

    await this.quinielaRepo.update(quinielaId, { status: QuinielaStatus.ACTIVA });

    const jornadaQuiniela = this.jornadaRepo.create({
      quiniela_id:  quinielaId,
      matchday_id:  primeraJornada.id,
      round_number: 1,
      status:       JornadaStatus.ABIERTA,
      closes_at:    closesAt,
    });
    await this.jornadaRepo.save(jornadaQuiniela);

    this.logger.log(`Quiniela ${quinielaId} abierta — jornada 1 cierra: ${closesAt}`);
  }

  // ─── Unirse a quiniela ─────────────────────────────────────────
  async unirse(user: User, quinielaId: number): Promise<QuinielaParticipante> {
    const quiniela = await this.quinielaRepo.findOne({ where: { id: quinielaId } });
    if (!quiniela) throw new NotFoundException('Quiniela no encontrada');
    if (!quiniela.is_active) throw new BadRequestException('Esta quiniela no está activa');

    // No se puede unir a una quiniela finalizada
    if (quiniela.status === QuinielaStatus.FINALIZADA) {
      throw new BadRequestException('Esta quiniela ya finalizó');
    }
    // Tampoco una vez que ya está activa (ya arrancaron las predicciones)
    if (quiniela.status === QuinielaStatus.ACTIVA) {
      throw new BadRequestException('La quiniela ya inició — no se aceptan nuevos participantes');
    }

    const existe = await this.participanteRepo.findOne({
      where: { quiniela_id: quinielaId, user_id: user.id },
    });
    if (existe) throw new ConflictException('Ya estás participando en esta quiniela');

    // Validar límite de participantes según el plan del owner
    const owner = await this.userRepo.findOne({ where: { id: quiniela.owner_id } });
    const maxParticipantes = owner?.is_premium
      ? PREMIUM_LIMITS.MAX_PARTICIPANTES_PREMIUM
      : PREMIUM_LIMITS.MAX_PARTICIPANTES_FREE;

    const currentCount = await this.participanteRepo.count({ where: { quiniela_id: quinielaId } });
    if (currentCount >= maxParticipantes) {
      throw new BadRequestException(
        `Esta quiniela alcanzó el límite de ${maxParticipantes} participantes.${!owner?.is_premium ? ' El organizador debe actualizar a Premium para ampliar el límite a 50.' : ''}`,
      );
    }

    const participante = this.participanteRepo.create({
      quiniela_id: quinielaId,
      user_id:     user.id,
    });

    const saved = await this.participanteRepo.save(participante);
    this.logger.log(`User ${user.id} se unió a quiniela ${quinielaId}`);
    return saved;
  }

  // ─── Unirse interno (sin validar estado — solo para create) ──────
  private async unirseInterno(userId: number, quinielaId: number) {
    const participante = this.participanteRepo.create({ quiniela_id: quinielaId, user_id: userId });
    await this.participanteRepo.save(participante);
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

    // Si hay una jornada abierta y ya pasó el closes_at, cerrarla automáticamente
    const jornadaAbierta = quiniela.jornadas?.find(j => j.status === JornadaStatus.ABIERTA);
    if (jornadaAbierta) {
      const ahora = new Date();
      if (new Date(jornadaAbierta.closes_at) < ahora) {
        // Cerrar automáticamente
        await this.jornadaRepo.update(jornadaAbierta.id, {
          status: JornadaStatus.CERRADA,
        });
      } else {
        throw new BadRequestException('Ya hay una jornada abierta — esperá a que cierre antes de abrir la siguiente');
      }
    }

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

    // Validar que los partidos pertenecen a esta jornada y no iniciaron
    const ahora = new Date();
    const matchMap = new Map(jornada.matchday.matches.map(m => [m.id, m]));

    for (const p of dto.predicciones) {
      const match = matchMap.get(p.match_id);
      if (!match) {
        throw new BadRequestException(`El partido ${p.match_id} no pertenece a esta jornada`);
      }
      if (match.status === MatchStatus.LIVE || match.status === MatchStatus.FINISHED) {
        throw new BadRequestException(
          `El partido ${match.home_team} vs ${match.away_team} ya inició — no se puede predecir`
        );
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

      this.logger.debug(`Puntos calculados — participante=${prediccion.participante_id} match=${matchId} pts=${points}`);
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

    // Verificar si todos los partidos de la jornada terminaron → auto-abrir siguiente
    await this.verificarYAvanzarJornada(matchId);
  }

  private async verificarYAvanzarJornada(matchId: number): Promise<void> {
    // Encontrar la quiniela_jornada que tiene este partido
    const prediccion = await this.prediccionRepo.findOne({
      where: { match_id: matchId },
      relations: ['participante'],
    });
    if (!prediccion) return;

    const jornadasActivas = await this.jornadaRepo.find({
      where: { quiniela_id: prediccion.participante.quiniela_id, status: JornadaStatus.ABIERTA },
      relations: ['matchday', 'matchday.matches'],
    });

    for (const jornada of jornadasActivas) {
      const partidos = jornada.matchday?.matches || [];
      const todosTerminados = partidos.length > 0 &&
        partidos.every(m => m.status === MatchStatus.FINISHED);

      if (!todosTerminados) continue;

      // Marcar jornada como finalizada
      await this.jornadaRepo.update(jornada.id, { status: JornadaStatus.FINALIZADA, points_calculated: true });
      this.logger.log(`Jornada ${jornada.round_number} finalizada en quiniela ${jornada.quiniela_id}`);

      // Buscar siguiente jornada del torneo
      const quiniela = await this.quinielaRepo.findOne({ where: { id: jornada.quiniela_id } });
      if (!quiniela) continue;

      const matchdayActual = jornada.matchday;
      const siguienteMatchday = await this.matchdayRepo.findOne({
        where: {
          competition_id: quiniela.competition_id,
          season:         matchdayActual.season,
          torneo:         matchdayActual.torneo,
          round_number:   (matchdayActual.round_number || 0) + 1,
        },
        relations: ['matches'],
      });

      if (!siguienteMatchday || !siguienteMatchday.matches?.length) {
        // No hay más jornadas → quiniela finalizada
        await this.quinielaRepo.update(jornada.quiniela_id, { status: QuinielaStatus.FINALIZADA });
        this.logger.log(`Quiniela ${jornada.quiniela_id} finalizada — no hay más jornadas`);
        continue;
      }

      // Auto-abrir siguiente jornada
      const partidosOrdenados = siguienteMatchday.matches
        .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
      const closesAt = new Date(partidosOrdenados[0].match_date);

      const nuevaJornada = this.jornadaRepo.create({
        quiniela_id:  jornada.quiniela_id,
        matchday_id:  siguienteMatchday.id,
        round_number: jornada.round_number + 1,
        status:       JornadaStatus.ABIERTA,
        closes_at:    closesAt,
      });
      await this.jornadaRepo.save(nuevaJornada);
      this.logger.log(`Jornada ${nuevaJornada.round_number} abierta automáticamente en quiniela ${jornada.quiniela_id}`);
    }
  }

  // ─── Ranking de la quiniela ────────────────────────────────────
  async getRanking(quinielaId: number, page = 1, limit = 50) {
    const safePage  = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip      = (safePage - 1) * safeLimit;

    const quiniela = await this.quinielaRepo.findOne({
      where: { id: quinielaId },
      relations: ['competition', 'owner', 'scoring_rule', 'jornadas', 'jornadas.matchday'],
    });
    if (!quiniela) throw new NotFoundException('Quiniela no encontrada');

    const [participantes, total] = await this.participanteRepo.findAndCount({
      where:    { quiniela_id: quinielaId },
      relations: ['user'],
      order:    { total_points: 'DESC', exact_scores: 'DESC', correct_winners: 'DESC' },
      skip,
      take:     safeLimit,
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
      ranking: participantes.map((p) => ({
        rank:             p.rank,
        user: {
          id:        p.user.id,
          username:  p.user.username,
          country:   p.user.country,
          avatar_url: p.user.avatar_url,
        },
        total_points:     p.total_points,
        exact_scores:     p.exact_scores,
        correct_winners:  p.correct_winners,
        jornadas_jugadas: p.jornadas_jugadas,
      })),
      total_participantes: total,
      pagination: {
        page:       safePage,
        limit:      safeLimit,
        total_pages: Math.ceil(total / safeLimit),
      },
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

  // ─── Predicciones de todos en una jornada (solo partidos terminados) ──
  async getTodasPredicciones(user: User, quinielaId: number, jornadaId: number) {
    const participante = await this.participanteRepo.findOne({
      where: { quiniela_id: quinielaId, user_id: user.id },
    });
    if (!participante) throw new ForbiddenException('No estás en esta quiniela');

    const jornada = await this.jornadaRepo.findOne({
      where: { id: jornadaId, quiniela_id: quinielaId },
      relations: ['matchday', 'matchday.matches'],
    });
    if (!jornada) throw new NotFoundException('Jornada no encontrada');

    const partidosTerminados = jornada.matchday.matches.filter(
      m => m.home_score !== null && m.away_score !== null
    );
    if (!partidosTerminados.length) return { partidos: [] };

    // Traer todos los participantes con sus predicciones en esta jornada
    const participantes = await this.participanteRepo.find({
      where: { quiniela_id: quinielaId },
      relations: ['user'],
      order: { total_points: 'DESC' },
    });

    const todasPredicciones = await this.prediccionRepo.find({
      where: { quiniela_jornada_id: jornadaId },
    });

    const predMap = new Map<string, Prediccion>();
    for (const p of todasPredicciones) {
      predMap.set(`${p.participante_id}-${p.match_id}`, p);
    }

    const partidos = partidosTerminados
      .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
      .map(m => ({
        match_id:  m.id,
        home_team: m.home_team,
        away_team: m.away_team,
        resultado: `${m.home_score}-${m.away_score}`,
        predicciones: participantes.map(part => {
          const pred = predMap.get(`${part.id}-${m.id}`);
          return {
            username:  part.user.username,
            user_id:   part.user_id,
            prediccion: pred ? `${pred.home_pred}-${pred.away_pred}` : null,
            puntos:     pred?.points_earned ?? 0,
          };
        }),
      }));

    return { partidos };
  }

  // ─── Puntos por jornada de cada participante ───────────────────
  async getPuntosPorJornada(user: User, quinielaId: number, jornadaId: number) {
    const participante = await this.participanteRepo.findOne({
      where: { quiniela_id: quinielaId, user_id: user.id },
    });
    if (!participante) throw new ForbiddenException('No estás en esta quiniela');

    const participantes = await this.participanteRepo.find({
      where: { quiniela_id: quinielaId },
      relations: ['user'],
    });

    const predicciones = await this.prediccionRepo.find({
      where: { quiniela_jornada_id: jornadaId },
    });

    // Sumar puntos por participante en esta jornada
    const puntosPorParticipante = new Map<number, number>();
    for (const pred of predicciones) {
      const actual = puntosPorParticipante.get(pred.participante_id) ?? 0;
      puntosPorParticipante.set(pred.participante_id, actual + pred.points_earned);
    }

    const misPartPuntos = puntosPorParticipante.get(participante.id) ?? 0;

    return participantes
      .map(part => ({
        user_id:       part.user_id,
        username:      part.user.username,
        puntos_jornada: puntosPorParticipante.get(part.id) ?? 0,
        diff_conmigo:  (puntosPorParticipante.get(part.id) ?? 0) - misPartPuntos,
      }))
      .sort((a, b) => b.puntos_jornada - a.puntos_jornada);
  }

  // ─── Historial completo de predicciones del usuario en una quiniela ──
  async getHistorial(user: User, quinielaId: number) {
    const participante = await this.participanteRepo.findOne({
      where: { quiniela_id: quinielaId, user_id: user.id },
    });
    if (!participante) throw new ForbiddenException('No estás en esta quiniela');

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

    let totalPartidos  = 0;
    let totalAciertos  = 0;  // marcador exacto o ganador correcto
    let exactos        = 0;
    let ganadorOk      = 0;

    const jornadasData = jornadas.map(j => {
      const partidos = (j.matchday?.matches || [])
        .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
        .map(m => {
          const pred = predMap.get(m.id);
          const finalizado = m.home_score !== null && m.away_score !== null;

          let acierto: 'exacto' | 'ganador' | 'fallo' | null = null;
          if (finalizado && pred) {
            if (pred.home_pred === m.home_score && pred.away_pred === m.away_score) {
              acierto = 'exacto';
            } else if (this.getWinner(pred.home_pred, pred.away_pred) === this.getWinner(m.home_score!, m.away_score!)) {
              acierto = 'ganador';
            } else {
              acierto = 'fallo';
            }
          }

          if (finalizado && pred) {
            totalPartidos++;
            if (acierto === 'exacto')  { exactos++; totalAciertos++; }
            if (acierto === 'ganador') { ganadorOk++; }
          }

          return {
            match_id:   m.id,
            home_team:  m.home_team,
            away_team:  m.away_team,
            match_date: m.match_date,
            status:     m.status,
            resultado:  finalizado ? `${m.home_score}-${m.away_score}` : null,
            prediccion: pred ? {
              home:   pred.home_pred,
              away:   pred.away_pred,
              puntos: pred.points_earned,
            } : null,
            acierto,
          };
        });

      const jornadaFinalizada = partidos.filter(p => p.resultado).length;
      const jornadaExactos    = partidos.filter(p => p.acierto === 'exacto').length;
      const jornadaGanadores  = partidos.filter(p => p.acierto === 'ganador').length;
      const jornadaAciertos   = jornadaExactos;

      return {
        jornada_id:   j.id,
        round_number: j.round_number,
        nombre:       j.matchday?.name || `Jornada ${j.round_number}`,
        status:       j.status,
        partidos,
        stats: {
          jugados:   jornadaFinalizada,
          aciertos:  jornadaAciertos,
          porcentaje: jornadaFinalizada > 0 ? Math.round(((jornadaExactos + jornadaGanadores * 0.5) / jornadaFinalizada) * 100) : null,
        },
      };
    });

    return {
      participante: {
        total_points:    participante.total_points,
        exact_scores:    participante.exact_scores,
        correct_winners: participante.correct_winners,
        rank:            participante.rank,
      },
      stats: {
        partidos_jugados:  totalPartidos,
        aciertos:          totalAciertos,
        exactos,
        ganador_correcto:  ganadorOk,
        porcentaje:        totalPartidos > 0 ? Math.round(((exactos + ganadorOk * 0.5) / totalPartidos) * 100) : 0,
      },
      jornadas: jornadasData,
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
        order: { total_points: 'DESC', exact_scores: 'DESC', correct_winners: 'DESC' },
      });

      // Asignar el mismo puesto a jugadores con idénticos criterios de desempate
      for (let i = 0; i < participantes.length; i++) {
        if (
          i > 0 &&
          participantes[i].total_points   === participantes[i - 1].total_points &&
          participantes[i].exact_scores   === participantes[i - 1].exact_scores &&
          participantes[i].correct_winners === participantes[i - 1].correct_winners
        ) {
          participantes[i].rank = participantes[i - 1].rank; // empate real
        } else {
          participantes[i].rank = i + 1;
        }
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

  async findOne(id: number): Promise<Quiniela | null> {
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

  async getPerfilPublico(username: string) {
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user) throw new Error('Usuario no encontrado');

    const stats  = await this.getMisEstadisticas(user.id);
    const trofeos = await this.getMisTrofeos(user.id);

    return {
      username:   user.username,
      full_name:  user.full_name,
      country:    user.country,
      member_since: user.created_at,
      ...stats,
      trofeos,
    };
  }

  async getMisEstadisticas(userId: number) {
    const partRow = await this.participanteRepo
      .createQueryBuilder('p')
      .select('SUM(p.exact_scores)',    'total_exactos')
      .addSelect('SUM(p.correct_winners)', 'total_ganadores')
      .addSelect('MIN(p.rank)',            'mejor_rank')
      .where('p.user_id = :userId', { userId })
      .getRawOne();

    const predRow = await this.prediccionRepo
      .createQueryBuilder('pred')
      .innerJoin('pred.participante', 'p')
      .select('COUNT(pred.id)', 'total')
      .where('p.user_id = :userId', { userId })
      .getRawOne();

    const exactos    = Number(partRow.total_exactos)   || 0;
    const ganadores  = Number(partRow.total_ganadores) || 0;
    const total      = Number(predRow.total)           || 0;
    const mejor_rank = partRow.mejor_rank != null ? Number(partRow.mejor_rank) : null;
    const porcentaje = total > 0
      ? Math.round(((exactos + ganadores * 0.5) / total) * 100)
      : 0;

    return {
      mejor_rank,
      total_acertados:     exactos + ganadores,
      porcentaje_aciertos: porcentaje,
    };
  }

  async getMisTrofeos(userId: number) {
    const ganadas = await this.participanteRepo
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.quiniela', 'q')
      .leftJoinAndSelect('q.competition', 'c')
      .where('p.user_id = :userId', { userId })
      .andWhere('p.rank = 1')
      .andWhere('q.status = :status', { status: QuinielaStatus.FINALIZADA })
      .andWhere('q.is_paid = false')
      .orderBy('q.updated_at', 'DESC')
      .getMany();

    return ganadas.map(p => ({
      quiniela_id:  p.quiniela.id,
      name:         p.quiniela.name,
      competition:  p.quiniela.competition?.name,
      season:       p.quiniela.season,
      total_points: p.total_points,
    }));
  }

  // Retorna los quinielaIds que tienen predicciones para este partido
  async getQuinielasForMatch(matchId: number): Promise<number[]> {
    const predicciones = await this.prediccionRepo.find({
      where: { match_id: matchId },
      relations: ['participante'],
    });
    return [...new Set(predicciones.map(p => p.participante.quiniela_id))];
  }

  async getMisLimites(user: User) {
    const quinielasCreadas = await this.quinielaRepo.count({ where: { owner_id: user.id } });
    return {
      is_premium:              user.is_premium,
      quinielas: {
        creadas:  quinielasCreadas,
        limite:   user.is_premium ? null : PREMIUM_LIMITS.MAX_QUINIELAS_FREE,
        ilimitado: user.is_premium,
      },
      participantes: {
        limite_por_quiniela: user.is_premium
          ? PREMIUM_LIMITS.MAX_PARTICIPANTES_PREMIUM
          : PREMIUM_LIMITS.MAX_PARTICIPANTES_FREE,
      },
    };
  }

  // ─── Quinielas públicas (directorio) ───────────────────────────
  async getPublicas(competition_id?: number, page = 1, limit = 20) {
    const take = Math.min(limit, 50);
    const skip = (page - 1) * take;

    const qb = this.quinielaRepo.createQueryBuilder('q')
      .leftJoin('q.owner', 'owner')
      .leftJoin('q.competition', 'competition')
      .leftJoin('q.participantes', 'participantes')
      .addSelect(['owner.id', 'owner.username', 'competition.id', 'competition.name'])
      .where('q.is_public = :pub', { pub: true })
      .andWhere('q.status != :fin', { fin: QuinielaStatus.FINALIZADA })
      .loadRelationCountAndMap('q.total_participantes', 'q.participantes')
      .orderBy('q.created_at', 'DESC')
      .take(take)
      .skip(skip);

    if (competition_id) {
      qb.andWhere('q.competition_id = :cid', { cid: competition_id });
    }

    const [quinielas, total] = await qb.getManyAndCount();

    return {
      quinielas: quinielas.map(q => ({
        id:                  q.id,
        name:                q.name,
        description:         q.description,
        status:              q.status,
        season:              q.season,
        invite_code:         q.invite_code,
        total_participantes: (q as any).total_participantes ?? 0,
        competition: {
          id:   (q.competition as any)?.id,
          name: (q.competition as any)?.name,
        },
        owner: {
          id:       (q.owner as any)?.id,
          username: (q.owner as any)?.username,
        },
        created_at: q.created_at,
      })),
      pagination: {
        total,
        page,
        total_pages: Math.ceil(total / take),
      },
    };
  }
}
