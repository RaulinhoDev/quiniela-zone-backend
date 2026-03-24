import {
  Controller, Get, Post, Body, Param,
  ParseIntPipe, UseGuards, Query
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CompetitionsService } from './competitions.service';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';

@Controller('competitions')
export class CompetitionsController {
  constructor(private service: CompetitionsService) {}

  // ── Públicos ──────────────────────────────────────────────────
  @Get()
  findAll() { return this.service.findAll(); }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Get(':id/matchdays')
  getMatchdays(@Param('id', ParseIntPipe) id: number) { return this.service.getMatchdays(id); }

  @Get('matchdays/:id')
  getMatchday(@Param('id', ParseIntPipe) id: number) { return this.service.getMatchdayWithMatches(id); }

  // Temporadas disponibles para una competencia
  @Get(':id/temporadas')
  getTemporadas(@Param('id', ParseIntPipe) id: number) {
    return this.service.getTemporadas(id);
  }

  // Torneos disponibles para una competencia y temporada
  @Get(':id/torneos')
  getTorneos(
    @Param('id', ParseIntPipe) id: number,
    @Query('season') season: string,
  ) {
    return this.service.getTorneos(id, season);
  }

  // ── Admin — requieren rol ADMIN ───────────────────────────────
  @Post('admin/sync')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  syncTemporada(@Body() body: { competition_api_id: number; season: string }) {
    return this.service.syncTemporada(body.competition_api_id, body.season);
  }

  @Post('admin/matchday')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  createMatchday(@Body() body: any) { return this.service.createMatchday(body); }

  @Post('admin/match')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  createMatch(@Body() body: any) { return this.service.createMatch(body); }

  @Post('admin/match/:id/result')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  updateResult(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { home_score: number; away_score: number },
  ) {
    return this.service.updateResult(id, body.home_score, body.away_score);
  }

}
