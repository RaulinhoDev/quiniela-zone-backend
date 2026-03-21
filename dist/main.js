"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalInterceptors(new common_1.ClassSerializerInterceptor(app.get(core_1.Reflector)));
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    });
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`
  ╔══════════════════════════════════════════╗
  ║   Quiniela Zone — Backend corriendo    ║
  ║   http://localhost:${port}/api/v1           ║
  ╚══════════════════════════════════════════╝

  AUTH
  POST  /api/v1/auth/register
  POST  /api/v1/auth/login

  COMPETENCIAS
  GET   /api/v1/competitions
  GET   /api/v1/competitions/:id/matchdays
  GET   /api/v1/competitions/matchdays/:id
  POST  /api/v1/competitions/admin/sync        (ADMIN)
  POST  /api/v1/competitions/admin/match/:id/result (ADMIN)

  QUINIELAS
  POST  /api/v1/quinielas                      crear quiniela
  GET   /api/v1/quinielas/:id/ranking          ranking público
  POST  /api/v1/quinielas/unirse/codigo        unirse por código
  POST  /api/v1/quinielas/:id/jornadas         abrir jornada (owner)
  POST  /api/v1/quinielas/:id/jornadas/:jId/predicciones
  GET   /api/v1/quinielas/:id/jornadas/:jId/mis-predicciones
  GET   /api/v1/quinielas/mis/quinielas
  `);
}
bootstrap();
//# sourceMappingURL=main.js.map