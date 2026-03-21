import {
  Controller, Post, Get, Patch, Body,
  HttpCode, HttpStatus, UseGuards, Request, Query
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: {
    email: string; username: string; password: string;
    full_name?: string; country?: string;
  }) {
    return this.authService.register(dto);
  }

  @Post('login')
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
    @Request() req,
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
    @Request() req,
    @Body() dto: { full_name?: string; country?: string }
  ) {
    return this.authService.updateProfile(req.user.id, dto);
  }
}
