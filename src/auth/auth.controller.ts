import {
  Controller, Post, Get, Patch, Body,
  HttpCode, HttpStatus, UseGuards, Request, Query
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private authService: AuthService,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  @Post('register')
  @Throttle({ auth: { ttl: 300000, limit: 15 } })
  register(@Body() dto: {
    email: string; username: string; password: string;
    full_name?: string; country?: string;
  }) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle({ auth: { ttl: 300000, limit: 15 } })
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: { email: string; password: string }) {
    return this.authService.login(dto);
  }

  // Verificar email con token
  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  // Solicitar reset de contraseña
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: { email: string }) {
    return this.authService.forgotPassword(dto.email);
  }

  // Resetear contraseña con token
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: { token: string; password: string }) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  // Cambiar contraseña (logueado)
  @Patch('change-password')
  @UseGuards(AuthGuard('jwt'))
  changePassword(
    @Request() req: { user: { id: number } },
    @Body() dto: { current_password: string; new_password: string }
  ) {
    return this.authService.changePassword(
      req.user.id, dto.current_password, dto.new_password
    );
  }

  // Editar perfil (logueado)
  @Patch('profile')
  @UseGuards(AuthGuard('jwt'))
  updateProfile(
    @Request() req: { user: { id: number } },
    @Body() dto: { full_name?: string; country?: string }
  ) {
    return this.authService.updateProfile(req.user.id, dto);
  }

  // Obtener datos frescos del usuario autenticado
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async me(@Request() req: { user: { id: number } }) {
    const user = await this.userRepo.findOne({ where: { id: req.user.id } });
    const { password_hash, verification_token, reset_password_token, refresh_token, ...data } = user as any;
    return data;
  }

  // Renovar access token con refresh token
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: { refresh_token: string }) {
    return this.authService.refreshToken(dto.refresh_token);
  }

  // Cerrar sesión y revocar refresh token
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  logout(@Request() req: { user: { id: number } }) {
    return this.authService.revokeRefreshToken(req.user.id);
  }
}
