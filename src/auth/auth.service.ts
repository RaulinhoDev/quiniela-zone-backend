import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(dto: {
    email: string; username: string; password: string;
    full_name?: string; country?: string;
  }) {
    const exists = await this.userRepo.findOne({
      where: [{ email: dto.email }, { username: dto.username }],
    });
    if (exists) throw new ConflictException(
      exists.email === dto.email ? 'Email ya registrado' : 'Username en uso'
    );

    const password_hash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({ ...dto, password_hash, role: UserRole.USER });
    await this.userRepo.save(user);
    return this.token(user);
  }

  async login(dto: { email: string; password: string }) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user || !await bcrypt.compare(dto.password, user.password_hash)) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return this.token(user);
  }

  async validateUser(id: number) {
    return this.userRepo.findOne({ where: { id } });
  }

  private token(user: User) {
    return {
      access_token: this.jwtService.sign({
        sub: user.id, email: user.email, role: user.role
      }),
      user: {
        id: user.id, email: user.email,
        username: user.username, role: user.role,
        country: user.country, full_name: user.full_name,
      },
    };
  }
}
