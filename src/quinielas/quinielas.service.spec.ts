import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QuinielasService, PREMIUM_LIMITS } from './quinielas.service';
import { Quiniela, QuinielaStatus } from './quiniela.entity';
import { QuinielaJornada, JornadaStatus } from './quiniela-jornada.entity';
import { QuinielaParticipante } from './quiniela-participante.entity';
import { Prediccion } from './prediccion.entity';
import { ScoringRule } from './scoring-rule.entity';
import { Match, MatchStatus } from '../matches/match.entity';
import { Matchday } from '../matchdays/matchday.entity';
import { User, UserRole } from '../users/user.entity';
import { ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';

// Fábrica de mocks de repositorio TypeORM
function mockRepo<T>(overrides: Partial<Record<string, jest.Mock>> = {}) {
  return {
    create:       jest.fn((dto: any) => ({ ...dto })),
    save:         jest.fn(async (e: any) => ({ id: Math.random(), ...e })),
    findOne:      jest.fn(),
    find:         jest.fn(),
    findAndCount: jest.fn(),
    count:        jest.fn(),
    update:       jest.fn(),
    increment:    jest.fn(),
    createQueryBuilder: jest.fn(),
    ...overrides,
  };
}

function makeUser(overrides: Partial<User> = {}): User {
  const u     = new User();
  u.id         = overrides.id         ?? 1;
  u.email      = overrides.email      ?? 'test@example.com';
  u.username   = overrides.username   ?? 'testuser';
  u.password_hash = 'hash';
  u.role       = UserRole.USER;
  u.is_premium = overrides.is_premium ?? false;
  u.is_verified = true;
  u.country    = 'HN';
  return u;
}

function makeQuiniela(overrides: Partial<Quiniela> = {}): Quiniela {
  const q        = new Quiniela();
  q.id           = overrides.id           ?? 10;
  q.owner_id     = overrides.owner_id     ?? 1;
  q.name         = overrides.name         ?? 'Test Quiniela';
  q.is_active    = overrides.is_active    ?? true;
  q.status       = overrides.status       ?? QuinielaStatus.ESPERANDO;
  q.competition_id = overrides.competition_id ?? 1;
  q.season       = '2025';
  q.invite_code  = 'ABC123';
  return q;
}

describe('QuinielasService — Restricciones Premium', () => {
  let service: QuinielasService;
  let quinielaRepo: ReturnType<typeof mockRepo>;
  let participanteRepo: ReturnType<typeof mockRepo>;
  let scoringRepo: ReturnType<typeof mockRepo>;
  let userRepo: ReturnType<typeof mockRepo>;
  let jornadaRepo: ReturnType<typeof mockRepo>;
  let prediccionRepo: ReturnType<typeof mockRepo>;
  let matchRepo: ReturnType<typeof mockRepo>;
  let matchdayRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    quinielaRepo    = mockRepo();
    participanteRepo = mockRepo();
    scoringRepo     = mockRepo();
    userRepo        = mockRepo();
    jornadaRepo     = mockRepo();
    prediccionRepo  = mockRepo();
    matchRepo       = mockRepo();
    matchdayRepo    = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuinielasService,
        { provide: getRepositoryToken(Quiniela),             useValue: quinielaRepo     },
        { provide: getRepositoryToken(QuinielaJornada),      useValue: jornadaRepo      },
        { provide: getRepositoryToken(QuinielaParticipante), useValue: participanteRepo },
        { provide: getRepositoryToken(Prediccion),           useValue: prediccionRepo   },
        { provide: getRepositoryToken(ScoringRule),          useValue: scoringRepo      },
        { provide: getRepositoryToken(Match),                useValue: matchRepo        },
        { provide: getRepositoryToken(Matchday),             useValue: matchdayRepo     },
        { provide: getRepositoryToken(User),                 useValue: userRepo         },
      ],
    }).compile();

    service = module.get<QuinielasService>(QuinielasService);
  });

  // ── Tests: límite de creación de quinielas ──────────────────
  describe('create() — límite free', () => {
    it('usuario free puede crear su primera quiniela', async () => {
      const owner = makeUser({ is_premium: false });

      quinielaRepo.count.mockResolvedValue(0);
      const savedQuiniela = makeQuiniela({ owner_id: owner.id });
      quinielaRepo.save.mockResolvedValue(savedQuiniela);
      quinielaRepo.create.mockReturnValue(savedQuiniela);
      scoringRepo.create.mockReturnValue({});
      scoringRepo.save.mockResolvedValue({ id: 1 });
      participanteRepo.findOne.mockResolvedValue(null); // no existe aún
      participanteRepo.count.mockResolvedValue(0);
      userRepo.findOne.mockResolvedValue(owner);
      participanteRepo.create.mockReturnValue({});
      participanteRepo.save.mockResolvedValue({ id: 1 });
      quinielaRepo.findOne.mockResolvedValue(savedQuiniela);

      await expect(
        service.create(owner, { name: 'Q1', competition_id: 1, season: '2025', torneo: 'Clausura' })
      ).resolves.toBeDefined();
    });

    it('usuario free NO puede crear segunda quiniela', async () => {
      const owner = makeUser({ is_premium: false });
      quinielaRepo.count.mockResolvedValue(1); // ya tiene una

      await expect(
        service.create(owner, { name: 'Q2', competition_id: 1, season: '2025', torneo: 'Clausura' })
      ).rejects.toThrow(ForbiddenException);
    });

    it('usuario premium puede crear múltiples quinielas', async () => {
      const owner = makeUser({ is_premium: true });
      quinielaRepo.count.mockResolvedValue(5); // ya tiene 5

      const savedQuiniela = makeQuiniela({ owner_id: owner.id });
      quinielaRepo.save.mockResolvedValue(savedQuiniela);
      quinielaRepo.create.mockReturnValue(savedQuiniela);
      scoringRepo.create.mockReturnValue({});
      scoringRepo.save.mockResolvedValue({ id: 1 });
      participanteRepo.findOne.mockResolvedValue(null);
      participanteRepo.count.mockResolvedValue(0);
      userRepo.findOne.mockResolvedValue(owner);
      participanteRepo.create.mockReturnValue({});
      participanteRepo.save.mockResolvedValue({ id: 1 });
      quinielaRepo.findOne.mockResolvedValue(savedQuiniela);

      await expect(
        service.create(owner, { name: 'Q6', competition_id: 1, season: '2025', torneo: 'Clausura' })
      ).resolves.toBeDefined();
    });
  });

  // ── Tests: límite de participantes ──────────────────────────
  describe('unirse() — límite de participantes', () => {
    it('bloquea cuando quiniela free alcanzó el límite', async () => {
      const user     = makeUser({ id: 99 });
      const quiniela = makeQuiniela({ owner_id: 1, status: QuinielaStatus.ESPERANDO });
      const owner    = makeUser({ id: 1, is_premium: false });

      quinielaRepo.findOne.mockResolvedValue(quiniela);
      participanteRepo.findOne.mockResolvedValue(null); // el user no está aún
      userRepo.findOne.mockResolvedValue(owner);
      // Ya alcanzó el límite
      participanteRepo.count.mockResolvedValue(PREMIUM_LIMITS.MAX_PARTICIPANTES_FREE);

      await expect(service.unirse(user, quiniela.id)).rejects.toThrow(BadRequestException);
    });

    it('permite unirse en quiniela premium con más de 15 participantes', async () => {
      const user     = makeUser({ id: 99 });
      const quiniela = makeQuiniela({ owner_id: 1, status: QuinielaStatus.ESPERANDO });
      const owner    = makeUser({ id: 1, is_premium: true });

      quinielaRepo.findOne.mockResolvedValue(quiniela);
      participanteRepo.findOne.mockResolvedValue(null);
      userRepo.findOne.mockResolvedValue(owner);
      // 20 participantes — dentro del límite premium (50)
      participanteRepo.count.mockResolvedValue(20);
      participanteRepo.create.mockReturnValue({});
      participanteRepo.save.mockResolvedValue({ id: 200 });

      await expect(service.unirse(user, quiniela.id)).resolves.toBeDefined();
    });

    it('no permite unirse dos veces', async () => {
      const user     = makeUser({ id: 99 });
      const quiniela = makeQuiniela({ status: QuinielaStatus.ESPERANDO });

      quinielaRepo.findOne.mockResolvedValue(quiniela);
      participanteRepo.findOne.mockResolvedValue({ id: 5, user_id: user.id }); // ya existe

      await expect(service.unirse(user, quiniela.id)).rejects.toThrow(ConflictException);
    });

    it('bloquea si la quiniela ya inició', async () => {
      const user     = makeUser();
      const quiniela = makeQuiniela({ status: QuinielaStatus.ACTIVA });

      quinielaRepo.findOne.mockResolvedValue(quiniela);

      await expect(service.unirse(user, quiniela.id)).rejects.toThrow(BadRequestException);
    });
  });

  // ── Tests: getMisLimites ────────────────────────────────────
  describe('getMisLimites()', () => {
    it('devuelve límites correctos para usuario free', async () => {
      const user = makeUser({ is_premium: false });
      quinielaRepo.count.mockResolvedValue(0);

      const res = await service.getMisLimites(user);

      expect(res.is_premium).toBe(false);
      expect(res.quinielas.limite).toBe(PREMIUM_LIMITS.MAX_QUINIELAS_FREE);
      expect(res.quinielas.ilimitado).toBe(false);
      expect(res.participantes.limite_por_quiniela).toBe(PREMIUM_LIMITS.MAX_PARTICIPANTES_FREE);
    });

    it('devuelve límites correctos para usuario premium', async () => {
      const user = makeUser({ is_premium: true });
      quinielaRepo.count.mockResolvedValue(3);

      const res = await service.getMisLimites(user);

      expect(res.is_premium).toBe(true);
      expect(res.quinielas.ilimitado).toBe(true);
      expect(res.quinielas.limite).toBeNull();
      expect(res.participantes.limite_por_quiniela).toBe(PREMIUM_LIMITS.MAX_PARTICIPANTES_PREMIUM);
    });
  });
});

// ── Tests: validación deadline por partido ──────────────────────
describe('QuinielasService — Validación de predicciones', () => {
  let service: QuinielasService;
  let quinielaRepo: ReturnType<typeof mockRepo>;
  let participanteRepo: ReturnType<typeof mockRepo>;
  let jornadaRepo: ReturnType<typeof mockRepo>;
  let prediccionRepo: ReturnType<typeof mockRepo>;
  let matchRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    quinielaRepo     = mockRepo();
    participanteRepo = mockRepo();
    jornadaRepo      = mockRepo();
    prediccionRepo   = mockRepo();
    matchRepo        = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuinielasService,
        { provide: getRepositoryToken(Quiniela),             useValue: quinielaRepo     },
        { provide: getRepositoryToken(QuinielaJornada),      useValue: jornadaRepo      },
        { provide: getRepositoryToken(QuinielaParticipante), useValue: participanteRepo },
        { provide: getRepositoryToken(Prediccion),           useValue: prediccionRepo   },
        { provide: getRepositoryToken(ScoringRule),          useValue: mockRepo()       },
        { provide: getRepositoryToken(Match),                useValue: matchRepo        },
        { provide: getRepositoryToken(Matchday),             useValue: mockRepo()       },
        { provide: getRepositoryToken(User),                 useValue: mockRepo()       },
      ],
    }).compile();

    service = module.get<QuinielasService>(QuinielasService);
  });

  it('rechaza predicción para partido ya iniciado (LIVE)', async () => {
    const user = makeUser();

    const futureDate = new Date(Date.now() + 3600_000); // 1h desde ahora
    const jornada = {
      id: 1, quiniela_id: 1, status: JornadaStatus.ABIERTA,
      closes_at: futureDate,
      matchday: {
        matches: [
          {
            id: 100, home_team: 'A', away_team: 'B',
            match_date: new Date(Date.now() - 3600_000), // hace 1h
            status: MatchStatus.LIVE,
          },
        ],
      },
    };

    jornadaRepo.findOne.mockResolvedValue(jornada);
    participanteRepo.findOne.mockResolvedValue({ id: 5, user_id: user.id });

    await expect(
      service.enviarPredicciones(user, 1, 1, {
        predicciones: [{ match_id: 100, home_pred: 1, away_pred: 0 }],
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('acepta predicción para partido a punto de iniciar (< 5 min, antes del primer partido)', async () => {
    const user = makeUser();

    const futureDate = new Date(Date.now() + 3600_000);
    const jornada = {
      id: 1, quiniela_id: 1, status: JornadaStatus.ABIERTA,
      closes_at: futureDate,
      matchday: {
        matches: [
          {
            id: 100, home_team: 'A', away_team: 'B',
            match_date: new Date(Date.now() + 2 * 60_000), // en 2 minutos
            status: MatchStatus.SCHEDULED,
          },
        ],
      },
    };

    jornadaRepo.findOne.mockResolvedValue(jornada);
    participanteRepo.findOne.mockResolvedValue({ id: 5, user_id: user.id });
    prediccionRepo.findOne.mockResolvedValue(null);
    prediccionRepo.create.mockReturnValue({});
    prediccionRepo.save.mockResolvedValue({ id: 1 });
    participanteRepo.increment.mockResolvedValue(undefined);

    await expect(
      service.enviarPredicciones(user, 1, 1, {
        predicciones: [{ match_id: 100, home_pred: 1, away_pred: 0 }],
      })
    ).resolves.toBeDefined();
  });

  it('acepta predicción para partido futuro', async () => {
    const user = makeUser();

    const futureDate = new Date(Date.now() + 3600_000);
    const jornada = {
      id: 1, quiniela_id: 1, status: JornadaStatus.ABIERTA,
      closes_at: futureDate,
      matchday: {
        matches: [
          {
            id: 100, home_team: 'A', away_team: 'B',
            match_date: new Date(Date.now() + 7200_000), // en 2 horas
            status: MatchStatus.SCHEDULED,
          },
        ],
      },
    };

    jornadaRepo.findOne.mockResolvedValue(jornada);
    participanteRepo.findOne.mockResolvedValue({ id: 5, user_id: user.id });
    prediccionRepo.findOne.mockResolvedValue(null);
    prediccionRepo.create.mockReturnValue({});
    prediccionRepo.save.mockResolvedValue({ id: 1 });
    participanteRepo.increment.mockResolvedValue(undefined);

    await expect(
      service.enviarPredicciones(user, 1, 1, {
        predicciones: [{ match_id: 100, home_pred: 1, away_pred: 0 }],
      })
    ).resolves.toBeDefined();
  });
});
