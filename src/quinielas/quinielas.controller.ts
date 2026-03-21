import {
  Controller, Post, Get, Body, Param,
  UseGuards, Request, ParseIntPipe
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  QuinielasService,
  CreateQuinielaDto,
  AbrirJornadaDto,
  SubmitPrediccionesDto,
} from './quinielas.service';

@Controller('quinielas')
export class QuinielasController {
  constructor(private quinielasService: QuinielasService) {}

  // ── Crear quiniela
  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Request() req, @Body() dto: CreateQuinielaDto) {
    return this.quinielasService.create(req.user, dto);
  }

  // ── Ver quiniela (público — para compartir link)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.quinielasService.findOne(id);
  }

  // ── Ver ranking de la quiniela (público)
  @Get(':id/ranking')
  getRanking(@Param('id', ParseIntPipe) id: number) {
    return this.quinielasService.getRanking(id);
  }

  // ── Mis quinielas (en las que participo)
  @Get('mis/quinielas')
  @UseGuards(AuthGuard('jwt'))
  misQuinielas(@Request() req) {
    return this.quinielasService.findMisQuinielas(req.user.id);
  }

  // ── Unirse por ID
  @Post(':id/unirse')
  @UseGuards(AuthGuard('jwt'))
  unirse(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.quinielasService.unirse(req.user, id);
  }

  // ── Unirse por código
  @Post('unirse/codigo')
  @UseGuards(AuthGuard('jwt'))
  unirseByCode(@Request() req, @Body() body: { invite_code: string }) {
    return this.quinielasService.unirseByCode(req.user, body.invite_code);
  }

  // ── Owner abre una jornada
  @Post(':id/jornadas')
  @UseGuards(AuthGuard('jwt'))
  abrirJornada(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AbrirJornadaDto,
  ) {
    return this.quinielasService.abrirJornada(req.user, id, dto);
  }

  // ── Enviar predicciones para una jornada
  @Post(':id/jornadas/:jornadaId/predicciones')
  @UseGuards(AuthGuard('jwt'))
  enviarPredicciones(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Param('jornadaId', ParseIntPipe) jornadaId: number,
    @Body() dto: SubmitPrediccionesDto,
  ) {
    return this.quinielasService.enviarPredicciones(req.user, id, jornadaId, dto);
  }

  // ── Ver mis predicciones en una jornada
  @Get(':id/jornadas/:jornadaId/mis-predicciones')
  @UseGuards(AuthGuard('jwt'))
  misPredicciones(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Param('jornadaId', ParseIntPipe) jornadaId: number,
  ) {
    return this.quinielasService.getMisPredicciones(req.user, id, jornadaId);
  }
}
