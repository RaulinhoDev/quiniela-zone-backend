import {
  Injectable, UnauthorizedException, ConflictException,
  NotFoundException, BadRequestException, InternalServerErrorException, Logger
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserRole } from '../users/user.entity';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async register(dto: {
    email: string; username: string; password: string;
    full_name?: string; country?: string;
  }) {
    const exists = await this.userRepo.findOne({
      where: [{ email: dto.email }, { username: dto.username }],
    });
    if (exists) throw new ConflictException(
      exists.email === dto.email ? 'Email ya registrado' : 'Username en uso'
    );

    const password_hash = await bcrypt.hash(dto.password, 12);
    const isDev = this.configService.get('REQUIRE_EMAIL_VERIFICATION') !== 'true';

    // En desarrollo: verificado automáticamente
    // En producción: requiere verificación por email
    const verification_token   = isDev ? null : crypto.randomBytes(32).toString('hex');
    const verification_expires = isDev ? null : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24hs

    const user = this.userRepo.create({
      email:                dto.email,
      username:             dto.username,
      full_name:            dto.full_name,
      country:              dto.country,
      password_hash,
      role:                 UserRole.USER,
      is_verified:          isDev,
      verification_token:   verification_token ?? undefined,
      verification_expires: verification_expires ?? undefined,
    });

    // Sanitizar inputs — eliminar HTML y espacios extra
    dto.email    = dto.email.trim().toLowerCase();
    dto.username = dto.username.trim().replace(/[^a-zA-Z0-9_]/g, '');
    dto.full_name = dto.full_name?.trim().substring(0, 100);

    await this.userRepo.save(user);
    this.logger.log(`Nuevo usuario registrado: ${user.username} (${user.email})`);

    // Enviar email de verificación solo en producción
    if (!isDev && verification_token) {
      await this.emailService.sendVerificationEmail(
        user.email, user.username, verification_token
      );
      return {
        message: 'Cuenta creada. Revisá tu email para verificar tu cuenta.',
        email: user.email,
      };
    }

    return this.tokenWithRefresh(user);
  }

  async verifyEmail(token: string) {
    const user = await this.userRepo.findOne({
      where: { verification_token: token },
    });

    if (!user) throw new BadRequestException('Token inválido o expirado');

    if (new Date() > user.verification_expires) {
      throw new BadRequestException('El link de verificación expiró — solicitá uno nuevo');
    }

    await this.userRepo.update(user.id, {
      is_verified:          true,
      verification_token:   undefined,
      verification_expires: undefined,
    });

    return this.tokenWithRefresh({ ...user, is_verified: true } as User);
  }

  async login(dto: { email: string; password: string }) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });

    const passwordMatch = user ? await bcrypt.compare(dto.password, user.password_hash) : false;
    if (!user || !passwordMatch) {
      this.logger.warn(`Login fallido para email: ${dto.email}`);
      throw new UnauthorizedException('Credenciales inválidas');
    }
    this.logger.log(`Login exitoso: ${user.username} (${user.email})`);

    // En producción verificar que el email esté confirmado
    const isDev = this.configService.get('REQUIRE_EMAIL_VERIFICATION') !== 'true';
    if (!isDev && !user.is_verified) {
      throw new UnauthorizedException('Debés verificar tu email antes de iniciar sesión');
    }

    return this.tokenWithRefresh(user);
  }

  async forgotPassword(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });

    // No revelar si el email existe o no por seguridad
    if (!user) return { message: 'Si ese email existe, recibirás un link para restablecer tu contraseña.' };

    const reset_password_token   = crypto.randomBytes(32).toString('hex');
    const reset_password_expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await this.userRepo.update(user.id, { reset_password_token, reset_password_expires });

    await this.emailService.sendPasswordResetEmail(user.email, user.username, reset_password_token);

    return { message: 'Si ese email existe, recibirás un link para restablecer tu contraseña.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userRepo.findOne({
      where: { reset_password_token: token },
    });

    if (!user) throw new BadRequestException('Token inválido o expirado');

    if (new Date() > user.reset_password_expires) {
      throw new BadRequestException('El link expiró — solicitá uno nuevo');
    }

    const password_hash = await bcrypt.hash(newPassword, 12);

    await this.userRepo.update(user.id, {
      password_hash,
      reset_password_token:   undefined,
      reset_password_expires: undefined,
    });

    return { message: 'Contraseña actualizada correctamente' };
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (!await bcrypt.compare(currentPassword, user.password_hash)) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    const password_hash = await bcrypt.hash(newPassword, 12);
    await this.userRepo.update(userId, { password_hash });

    return { message: 'Contraseña actualizada correctamente' };
  }

  async updateProfile(userId: number, dto: { full_name?: string; country?: string }) {
    await this.userRepo.update(userId, dto);
    return this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'email', 'username', 'full_name', 'country', 'role', 'is_premium', 'is_verified'],
    });
  }

  async validateUser(id: number) {
    return this.userRepo.findOne({ where: { id } });
  }

  async refreshToken(refreshToken: string) {
    const user = await this.userRepo.findOne({ where: { refresh_token: refreshToken } });

    if (!user || !user.refresh_token_expires || new Date() > user.refresh_token_expires) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    // Rotar el refresh token
    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días

    await this.userRepo.update(user.id, {
      refresh_token:         newRefreshToken,
      refresh_token_expires: expires,
    });

    return {
      ...this.token(user),
      refresh_token: newRefreshToken,
    };
  }

  async revokeRefreshToken(userId: number) {
    await this.userRepo.update(userId, {
      refresh_token:         undefined,
      refresh_token_expires: undefined,
    });
  }

  private async tokenWithRefresh(user: User) {
    const refresh_token = crypto.randomBytes(40).toString('hex');
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días

    await this.userRepo.update(user.id, {
      refresh_token,
      refresh_token_expires: expires,
    });

    return {
      ...this.token(user),
      refresh_token,
    };
  }

  private token(user: User) {
    return {
      access_token: this.jwtService.sign({
        sub: user.id, email: user.email, role: user.role
      }),
      user: {
        id:          user.id,
        email:       user.email,
        username:    user.username,
        role:        user.role,
        country:     user.country,
        full_name:   user.full_name,
        is_verified: user.is_verified,
        is_premium:  user.is_premium,
      },
    };
  }
}