import {
  Injectable, UnauthorizedException, ConflictException,
  NotFoundException, BadRequestException
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
      ...dto,
      password_hash,
      role:         UserRole.USER,
      is_verified:  isDev, // true en dev, false en prod
      verification_token,
      verification_expires,
    });

    // Sanitizar inputs — eliminar HTML y espacios extra
    dto.email    = dto.email.trim().toLowerCase();
    dto.username = dto.username.trim().replace(/[^a-zA-Z0-9_]/g, '');
    dto.full_name = dto.full_name?.trim().substring(0, 100);

    await this.userRepo.save(user);

    // Enviar email de verificación solo en producción
    if (!isDev) {
      await this.emailService.sendVerificationEmail(
        user.email, user.username, verification_token
      );
      return {
        message: 'Cuenta creada. Revisá tu email para verificar tu cuenta.',
        email: user.email,
      };
    }

    return this.token(user);
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
      is_verified:         true,
      verification_token:  null,
      verification_expires: null,
    });

    return this.token({ ...user, is_verified: true } as User);
  }

  async login(dto: { email: string; password: string }) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });

    if (!user || !await bcrypt.compare(dto.password, user.password_hash)) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // En producción verificar que el email esté confirmado
    const isDev = this.configService.get('REQUIRE_EMAIL_VERIFICATION') !== 'true';
    if (!isDev && !user.is_verified) {
      throw new UnauthorizedException('Debés verificar tu email antes de iniciar sesión');
    }

    return this.token(user);
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
      reset_password_token:   null,
      reset_password_expires: null,
    });

    return { message: 'Contraseña actualizada correctamente' };
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

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
      select: ['id', 'email', 'username', 'full_name', 'country', 'role', 'is_premium'],
    });
  }

  async validateUser(id: number) {
    return this.userRepo.findOne({ where: { id } });
  }

  private token(user: User) {
    return {
      access_token: this.jwtService.sign({
        sub: user.id, email: user.email, role: user.role
      }),
      user: {
        id:         user.id,
        email:      user.email,
        username:   user.username,
        role:       user.role,
        country:    user.country,
        full_name:  user.full_name,
        is_verified: user.is_verified,
      },
    };
  }
}