import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { User } from '../users/user.entity';
import { Quiniela, QuinielaStatus } from '../quinielas/quiniela.entity';
import { QuinielaParticipante } from '../quinielas/quiniela-participante.entity';
import { Prediccion } from '../quinielas/prediccion.entity';
import { Match, MatchStatus } from '../matches/match.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Quiniela)
    private quinielaRepo: Repository<Quiniela>,
    @InjectRepository(QuinielaParticipante)
    private participanteRepo: Repository<QuinielaParticipante>,
    @InjectRepository(Prediccion)
    private prediccionRepo: Repository<Prediccion>,
    @InjectRepository(Match)
    private matchRepo: Repository<Match>,
  ) {}

  async getDashboard() {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const manana = new Date(hoy)
    manana.setDate(manana.getDate() + 1)

    const inicioSemana = new Date(hoy)
    inicioSemana.setDate(inicioSemana.getDate() - 7)

    const [
      totalUsuarios,
      usuariosEstaSemana,
      totalQuinielas,
      quinielasActivas,
      quinielasEsperando,
      totalPredicciones,
      partidosHoy,
      partidosEnVivo,
    ] = await Promise.all([
      this.userRepo.count(),
      this.userRepo.count({ where: { created_at: MoreThanOrEqual(inicioSemana) } }),
      this.quinielaRepo.count(),
      this.quinielaRepo.count({ where: { status: QuinielaStatus.ACTIVA } }),
      this.quinielaRepo.count({ where: { status: QuinielaStatus.ESPERANDO } }),
      this.prediccionRepo.count(),
      this.matchRepo
        .createQueryBuilder('m')
        .where('m.match_date >= :hoy', { hoy })
        .andWhere('m.match_date < :manana', { manana })
        .getCount(),
      this.matchRepo.count({ where: { status: MatchStatus.LIVE } }),
    ])

    // Últimos 5 usuarios registrados
    const ultimosUsuarios = await this.userRepo.find({
      select: ['id', 'username', 'email', 'country', 'role', 'created_at'],
      order: { created_at: 'DESC' },
      take: 5,
    })

    // Últimas 5 quinielas creadas
    const ultimasQuinielas = await this.quinielaRepo.find({
      relations: ['owner', 'competition'],
      order: { created_at: 'DESC' },
      take: 5,
    })

    // Partidos de hoy
    const partidos = await this.matchRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.matchday', 'md')
      .leftJoinAndSelect('md.competition', 'c')
      .where('m.match_date >= :hoy', { hoy })
      .andWhere('m.match_date < :manana', { manana })
      .orderBy('m.match_date', 'ASC')
      .getMany()

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
        id:          q.id,
        name:        q.name,
        owner:       q.owner?.username,
        competition: q.competition?.name,
        status:      q.status,
        created_at:  q.created_at,
      })),
      partidosHoy: partidos.map(p => ({
        id:         p.id,
        home_team:  p.home_team,
        away_team:  p.away_team,
        match_date: p.match_date,
        status:     p.status,
        home_score: p.home_score,
        away_score: p.away_score,
        competition: p.matchday?.competition?.name,
      })),
    }
  }

  async getUserDetail(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'email', 'username', 'full_name', 'country', 'role', 'is_premium', 'created_at'],
    })

    const participaciones = await this.participanteRepo.find({
      where: { user_id: userId },
      relations: ['quiniela', 'quiniela.competition'],
      order: { joined_at: 'DESC' },
    })

    return {
      user,
      quinielas: participaciones.map(p => ({
        id:           p.quiniela?.id,
        name:         p.quiniela?.name,
        competition:  p.quiniela?.competition?.name,
        status:       p.quiniela?.status,
        total_points: p.total_points,
        rank:         p.rank,
        jornadas_jugadas: p.jornadas_jugadas,
        joined_at:    p.joined_at,
      })),
    }
  }
}
