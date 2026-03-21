import {
  Controller, Get, Patch, Param, Body,
  UseGuards, ParseIntPipe, Query
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { RolesGuard, Roles } from '../common/guards/roles.guard';

@Controller('users')
export class UsersController {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // Listar todos los usuarios (solo ADMIN)
  @Get('admin/all')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 15,
    @Query('search') search = '',
    @Query('role') role = '',
  ) {
    const skip = (page - 1) * limit
    const where: any = {}

    if (role) where.role = role

    const qb = this.userRepo.createQueryBuilder('u')
      .select(['u.id', 'u.email', 'u.username', 'u.full_name', 'u.country', 'u.role', 'u.created_at'])
      .orderBy('u.created_at', 'DESC')
      .skip(skip)
      .take(limit)

    if (search) {
      qb.where('u.username LIKE :search OR u.email LIKE :search', { search: `%${search}%` })
    }

    if (role) {
      search
        ? qb.andWhere('u.role = :role', { role })
        : qb.where('u.role = :role', { role })
    }

    const [data, total] = await qb.getManyAndCount()

    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) }
  }
}
