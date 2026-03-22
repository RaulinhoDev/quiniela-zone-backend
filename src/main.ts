import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  // Helmet — headers de seguridad HTTP
  app.use(helmet());

  app.setGlobalPrefix('api/v1');

  // Validación global de inputs
  app.useGlobalPipes(new ValidationPipe({
    whitelist:              true,  // elimina campos no declarados en el DTO
    forbidNonWhitelisted:   true,  // lanza error si vienen campos extra
    transform:              true,
    transformOptions: { enableImplicitConversion: true },
  }));

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.enableCors({
    origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`
  ╔══════════════════════════════════════════╗
  ║   Quiniela Zone — Backend corriendo     ║
  ║   http://localhost:${port}/api/v1           ║
  ╚══════════════════════════════════════════╝
  `);
}

bootstrap();