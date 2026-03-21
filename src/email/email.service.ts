import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;

  constructor(private config: ConfigService) {
    this.resend = new Resend(this.config.get('RESEND_API_KEY'));
  }

  async sendVerificationEmail(email: string, username: string, token: string): Promise<void> {
    const appUrl   = this.config.get('APP_URL', 'http://localhost:5173');
    const fromEmail= this.config.get('RESEND_FROM', 'onboarding@resend.dev');
    const verifyUrl= `${appUrl}/verificar-email?token=${token}`;

    try {
      await this.resend.emails.send({
        from:    fromEmail,
        to:      email,
        subject: '✅ Verificá tu cuenta en Quiniela Zone',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #0d0f14; color: #f0f2f8;">
            <h1 style="color: #00e5a0; font-size: 28px; margin-bottom: 8px;">⚽ Quiniela Zone</h1>
            <h2 style="font-size: 20px; margin-bottom: 16px;">Hola ${username}, ¡bienvenido!</h2>
            <p style="color: #8892b0; line-height: 1.6; margin-bottom: 24px;">
              Ya casi estás listo. Solo necesitamos verificar tu correo electrónico para activar tu cuenta.
            </p>
            <a href="${verifyUrl}"
               style="display: inline-block; background: #00e5a0; color: #0d0f14; padding: 14px 32px;
                      border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px;">
              Verificar mi cuenta
            </a>
            <p style="color: #4a5580; font-size: 13px; margin-top: 32px;">
              Este link expira en 24 horas. Si no creaste esta cuenta, ignorá este email.
            </p>
            <p style="color: #4a5580; font-size: 12px; margin-top: 8px;">
              Si el botón no funciona, copiá este link: ${verifyUrl}
            </p>
          </div>
        `,
      });
      this.logger.log(`Email de verificación enviado a ${email}`);
    } catch (error) {
      this.logger.error(`Error enviando email a ${email}: ${error.message}`);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, username: string, token: string): Promise<void> {
    const appUrl    = this.config.get('APP_URL', 'http://localhost:5173');
    const fromEmail = this.config.get('RESEND_FROM', 'onboarding@resend.dev');
    const resetUrl  = `${appUrl}/reset-password?token=${token}`;

    try {
      await this.resend.emails.send({
        from:    fromEmail,
        to:      email,
        subject: '🔐 Recuperar contraseña — Quiniela Zone',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #0d0f14; color: #f0f2f8;">
            <h1 style="color: #00e5a0; font-size: 28px; margin-bottom: 8px;">⚽ Quiniela Zone</h1>
            <h2 style="font-size: 20px; margin-bottom: 16px;">Hola ${username}, ¿olvidaste tu contraseña?</h2>
            <p style="color: #8892b0; line-height: 1.6; margin-bottom: 24px;">
              Recibimos una solicitud para restablecer tu contraseña. Hacé clic en el botón para crear una nueva.
            </p>
            <a href="${resetUrl}"
               style="display: inline-block; background: #00e5a0; color: #0d0f14; padding: 14px 32px;
                      border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px;">
              Restablecer contraseña
            </a>
            <p style="color: #4a5580; font-size: 13px; margin-top: 32px;">
              Este link expira en 1 hora. Si no solicitaste esto, ignorá este email.
            </p>
          </div>
        `,
      });
      this.logger.log(`Email de reset enviado a ${email}`);
    } catch (error) {
      this.logger.error(`Error enviando email de reset a ${email}: ${error.message}`);
      throw error;
    }
  }
}
