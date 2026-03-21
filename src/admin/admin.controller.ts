import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  // Dashboard con métricas
  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  // Detalle de un usuario — quinielas, actividad
  @Get('users/:id')
  getUserDetail(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getUserDetail(id);
  }
}
