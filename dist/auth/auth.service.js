"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const user_entity_1 = require("../users/user.entity");
let AuthService = class AuthService {
    constructor(userRepo, jwtService) {
        this.userRepo = userRepo;
        this.jwtService = jwtService;
    }
    async register(dto) {
        const exists = await this.userRepo.findOne({
            where: [{ email: dto.email }, { username: dto.username }],
        });
        if (exists)
            throw new common_1.ConflictException(exists.email === dto.email ? 'Email ya registrado' : 'Username en uso');
        const password_hash = await bcrypt.hash(dto.password, 12);
        const user = this.userRepo.create({ ...dto, password_hash, role: user_entity_1.UserRole.USER });
        await this.userRepo.save(user);
        return this.token(user);
    }
    async login(dto) {
        const user = await this.userRepo.findOne({ where: { email: dto.email } });
        if (!user || !await bcrypt.compare(dto.password, user.password_hash)) {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        return this.token(user);
    }
    async validateUser(id) {
        return this.userRepo.findOne({ where: { id } });
    }
    token(user) {
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map