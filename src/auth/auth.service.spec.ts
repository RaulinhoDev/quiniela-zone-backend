import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { User, UserRole } from '../users/user.entity';
import { EmailService } from '../email/email.service';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const mockEmailService = {
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
};

function makeUser(overrides: Partial<User> = {}): User {
  const u          = new User();
  u.id             = overrides.id          ?? 1;
  u.email          = overrides.email       ?? 'user@test.com';
  u.username       = overrides.username    ?? 'testuser';
  u.password_hash  = overrides.password_hash ?? 'hash';
  u.role           = UserRole.USER;
  u.is_premium     = overrides.is_premium  ?? false;
  u.is_verified    = overrides.is_verified ?? true;
  u.country        = 'HN';
  return u;
}

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: {
    findOne: jest.Mock;
    create:  jest.Mock;
    save:    jest.Mock;
    update:  jest.Mock;
  };

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      create:  jest.fn((dto: any) => ({ ...dto, id: Math.floor(Math.random() * 1000) })),
      save:    jest.fn(async (u: any) => u),
      update:  jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.register({ secret: 'test-secret', signOptions: { expiresIn: '1h' } }),
      ],
      providers: [
        AuthService,
        { provide: getRepositoryToken(User),  useValue: userRepo         },
        { provide: EmailService,              useValue: mockEmailService  },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ── register ────────────────────────────────────────────────
  describe('register()', () => {
    it('registra usuario nuevo y devuelve token (modo dev)', async () => {
      userRepo.findOne.mockResolvedValue(null); // no existe
      userRepo.create.mockReturnValue(makeUser({ is_verified: true }));
      userRepo.save.mockResolvedValue(makeUser({ is_verified: true }));
      userRepo.update.mockResolvedValue({});

      const res = await service.register({
        email: 'new@test.com', username: 'newuser', password: 'pass123'
      }) as any;

      // En dev (REQUIRE_EMAIL_VERIFICATION !== 'true'), devuelve token directamente
      expect(res.access_token || res.message).toBeDefined();
    });

    it('lanza ConflictException si email ya existe', async () => {
      userRepo.findOne.mockResolvedValue(makeUser({ email: 'existing@test.com' }));

      await expect(
        service.register({ email: 'existing@test.com', username: 'other', password: 'pass' })
      ).rejects.toThrow(ConflictException);
    });

    it('lanza ConflictException si username ya existe', async () => {
      userRepo.findOne.mockResolvedValue(makeUser({ username: 'takenuser' }));

      await expect(
        service.register({ email: 'new@test.com', username: 'takenuser', password: 'pass' })
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── login ──────────────────────────────────────────────────
  describe('login()', () => {
    it('login exitoso devuelve access_token y refresh_token', async () => {
      const hashed = await bcrypt.hash('mypassword', 10);
      const user   = makeUser({ password_hash: hashed, is_premium: false });
      userRepo.findOne.mockResolvedValue(user);
      userRepo.update.mockResolvedValue({});

      const res = await service.login({ email: 'user@test.com', password: 'mypassword' });

      expect(res.access_token).toBeDefined();
      expect(res.refresh_token).toBeDefined();
      expect(res.user.is_premium).toBe(false);
    });

    it('lanza UnauthorizedException con contraseña incorrecta', async () => {
      const hashed = await bcrypt.hash('correct', 10);
      const user   = makeUser({ password_hash: hashed });
      userRepo.findOne.mockResolvedValue(user);

      await expect(
        service.login({ email: 'user@test.com', password: 'wrong' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si el usuario no existe', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'noexiste@test.com', password: 'pass' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('incluye is_premium: true para usuarios premium', async () => {
      const hashed = await bcrypt.hash('pass', 10);
      const user   = makeUser({ password_hash: hashed, is_premium: true });
      userRepo.findOne.mockResolvedValue(user);
      userRepo.update.mockResolvedValue({});

      const res = await service.login({ email: 'prem@test.com', password: 'pass' });

      expect(res.user.is_premium).toBe(true);
    });
  });

  // ── refreshToken ───────────────────────────────────────────
  describe('refreshToken()', () => {
    it('renueva access_token con refresh token válido', async () => {
      const expires = new Date(Date.now() + 3600_000); // 1h
      const user    = makeUser();
      (user as any).refresh_token         = 'valid_rt';
      (user as any).refresh_token_expires = expires;
      userRepo.findOne.mockResolvedValue(user);
      userRepo.update.mockResolvedValue({});

      const res = await service.refreshToken('valid_rt');

      expect(res.access_token).toBeDefined();
      expect(res.refresh_token).toBeDefined();
      // El refresh token debe cambiar (rotación)
      expect(res.refresh_token).not.toBe('valid_rt');
    });

    it('lanza UnauthorizedException con refresh token inválido', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.refreshToken('invalid_token')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException con refresh token expirado', async () => {
      const expired = new Date(Date.now() - 3600_000); // hace 1h
      const user    = makeUser();
      (user as any).refresh_token         = 'expired_rt';
      (user as any).refresh_token_expires = expired;
      userRepo.findOne.mockResolvedValue(user);

      await expect(
        service.refreshToken('expired_rt')
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── revokeRefreshToken ─────────────────────────────────────
  describe('revokeRefreshToken()', () => {
    it('llama a update para limpiar el refresh token', async () => {
      await service.revokeRefreshToken(1);
      expect(userRepo.update).toHaveBeenCalledWith(1, {
        refresh_token:         undefined,
        refresh_token_expires: undefined,
      });
    });
  });

  // ── forgotPassword ─────────────────────────────────────────
  describe('forgotPassword()', () => {
    it('no revela si el email existe o no', async () => {
      userRepo.findOne.mockResolvedValue(null); // email no existe

      const res = await service.forgotPassword('noexiste@test.com');

      expect(res.message).toContain('Si ese email existe');
    });
  });
});
