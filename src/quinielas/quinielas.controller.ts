import {
  Controller, Post, Get, Body, Param, Query,
  UseGuards, Request, ParseIntPipe
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  QuinielasService,
  CreateQuinielaDto,
  SubmitPrediccionesDto,
  PREMIUM_LIMITS,
} from './quinielas.service';
import { User } from '../users/user.entity';

type AuthReq = { user: User };

@Controller('quinielas')
export class QuinielasController {
  constructor(private quinielasService: QuinielasService) {}

  // ── Crear quiniela
  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Request() req: AuthReq, @Body() dto: CreateQuinielaDto) {
    return this.quinielasService.create(req.user, dto);
  }

  // ── Ver quiniela (público — para compartir link)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.quinielasService.findOne(id);
  }

  // ── Ver ranking de la quiniela (público)
  @Get(':id/ranking')
  getRanking(
    @Param('id', ParseIntPipe) id: number,
    @Query('page')  page  = '1',
    @Query('limit') limit = '50',
  ) {
    return this.quinielasService.getRanking(id, parseInt(page), parseInt(limit));
  }

  // ── Mis quinielas (en las que participo)
  @Get('mis/quinielas')
  @UseGuards(AuthGuard('jwt'))
  misQuinielas(@Request() req: AuthReq) {
    return this.quinielasService.findMisQuinielas(req.user.id);
  }

  // ── Perfil público de un usuario
  @Get('perfil/:username')
  perfilPublico(@Param('username') username: string) {
    return this.quinielasService.getPerfilPublico(username);
  }

  // ── Mis estadísticas globales
  @Get('mis/estadisticas')
  @UseGuards(AuthGuard('jwt'))
  misEstadisticas(@Request() req: AuthReq) {
    return this.quinielasService.getMisEstadisticas(req.user.id);
  }

  // ── Mis trofeos (quinielas no-pago ganadas)
  @Get('mis/trofeos')
  @UseGuards(AuthGuard('jwt'))
  misTrofeos(@Request() req: AuthReq) {
    return this.quinielasService.getMisTrofeos(req.user.id);
  }

  // ── Mis límites de plan
  @Get('mis/limites')
  @UseGuards(AuthGuard('jwt'))
  misLimites(@Request() req: AuthReq) {
    return this.quinielasService.getMisLimites(req.user);
  }

  // ── Unirse por ID
  @Post(':id/unirse')
  @UseGuards(AuthGuard('jwt'))
  unirse(@Request() req: AuthReq, @Param('id', ParseIntPipe) id: number) {
    return this.quinielasService.unirse(req.user, id);
  }

  // ── Unirse por código
  @Post('unirse/codigo')
  @UseGuards(AuthGuard('jwt'))
  unirseByCode(@Request() req: AuthReq, @Body() body: { invite_code: string }) {
    return this.quinielasService.unirseByCode(req.user, body.invite_code);
  }

  // ── Owner abre la quiniela
  @Post(':id/abrir')
  @UseGuards(AuthGuard('jwt'))
  abrirQuiniela(@Request() req: AuthReq, @Param('id', ParseIntPipe) id: number) {
    return this.quinielasService.abrirQuiniela(req.user, id);
  }

  // ── Enviar predicciones para una jornada
  @Post(':id/jornadas/:jornadaId/predicciones')
  @UseGuards(AuthGuard('jwt'))
  enviarPredicciones(
    @Request() req: AuthReq,
    @Param('id', ParseIntPipe) id: number,
    @Param('jornadaId', ParseIntPipe) jornadaId: number,
    @Body() dto: SubmitPrediccionesDto,
  ) {
    return this.quinielasService.enviarPredicciones(req.user, id, jornadaId, dto);
  }

  // ── Historial completo de predicciones en una quiniela
  @Get(':id/historial')
  @UseGuards(AuthGuard('jwt'))
  historial(
    @Request() req: AuthReq,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.quinielasService.getHistorial(req.user, id);
  }

  // ── Predicciones de todos en una jornada (partidos terminados)
  @Get(':id/jornadas/:jornadaId/todas-predicciones')
  @UseGuards(AuthGuard('jwt'))
  todasPredicciones(
    @Request() req: AuthReq,
    @Param('id', ParseIntPipe) id: number,
    @Param('jornadaId', ParseIntPipe) jornadaId: number,
  ) {
    return this.quinielasService.getTodasPredicciones(req.user, id, jornadaId);
  }

  // ── Puntos por jornada de cada participante
  @Get(':id/jornadas/:jornadaId/puntos')
  @UseGuards(AuthGuard('jwt'))
  puntosPorJornada(
    @Request() req: AuthReq,
    @Param('id', ParseIntPipe) id: number,
    @Param('jornadaId', ParseIntPipe) jornadaId: number,
  ) {
    return this.quinielasService.getPuntosPorJornada(req.user, id, jornadaId);
  }

  // ── Ver mis predicciones en una jornada
  @Get(':id/jornadas/:jornadaId/mis-predicciones')
  @UseGuards(AuthGuard('jwt'))
  misPredicciones(
    @Request() req: AuthReq,
    @Param('id', ParseIntPipe) id: number,
    @Param('jornadaId', ParseIntPipe) jornadaId: number,
  ) {
    return this.quinielasService.getMisPredicciones(req.user, id, jornadaId);
  }
}
