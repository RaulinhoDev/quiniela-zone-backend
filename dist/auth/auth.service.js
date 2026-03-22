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
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const user_entity_1 = require("../users/user.entity");
const email_service_1 = require("../email/email.service");
let AuthService = class AuthService {
    constructor(userRepo, jwtService, configService, emailService) {
        this.userRepo = userRepo;
        this.jwtService = jwtService;
        this.configService = configService;
        this.emailService = emailService;
    }
    async register(dto) {
        const exists = await this.userRepo.findOne({
            where: [{ email: dto.email }, { username: dto.username }],
        });
        if (exists)
            throw new common_1.ConflictException(exists.email === dto.email ? 'Email ya registrado' : 'Username en uso');
        const password_hash = await bcrypt.hash(dto.password, 12);
        const isDev = this.configService.get('REQUIRE_EMAIL_VERIFICATION') !== 'true';
        const verification_token = isDev ? null : crypto.randomBytes(32).toString('hex');
        const verification_expires = isDev ? null : new Date(Date.now() + 24 * 60 * 60 * 1000);
        const user = this.userRepo.create({
            ...dto,
            password_hash,
            role: user_entity_1.UserRole.USER,
            is_verified: isDev,
            verification_token,
            verification_expires,
        });
        dto.email = dto.email.trim().toLowerCase();
        dto.username = dto.username.trim().replace(/[^a-zA-Z0-9_]/g, '');
        dto.full_name = dto.full_name?.trim().substring(0, 100);
        await this.userRepo.save(user);
        if (!isDev) {
            await this.emailService.sendVerificationEmail(user.email, user.username, verification_token);
            return {
                message: 'Cuenta creada. Revisá tu email para verificar tu cuenta.',
                email: user.email,
            };
        }
        return this.token(user);
    }
    async verifyEmail(token) {
        const user = await this.userRepo.findOne({
            where: { verification_token: token },
        });
        if (!user)
            throw new common_1.BadRequestException('Token inválido o expirado');
        if (new Date() > user.verification_expires) {
            throw new common_1.BadRequestException('El link de verificación expiró — solicitá uno nuevo');
        }
        await this.userRepo.update(user.id, {
            is_verified: true,
            verification_token: null,
            verification_expires: null,
        });
        return this.token({ ...user, is_verified: true });
    }
    async login(dto) {
        const user = await this.userRepo.findOne({ where: { email: dto.email } });
        if (!user || !await bcrypt.compare(dto.password, user.password_hash)) {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        const isDev = this.configService.get('REQUIRE_EMAIL_VERIFICATION') !== 'true';
        if (!isDev && !user.is_verified) {
            throw new common_1.UnauthorizedException('Debés verificar tu email antes de iniciar sesión');
        }
        return this.token(user);
    }
    async forgotPassword(email) {
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user)
            return { message: 'Si ese email existe, recibirás un link para restablecer tu contraseña.' };
        const reset_password_token = crypto.randomBytes(32).toString('hex');
        const reset_password_expires = new Date(Date.now() + 60 * 60 * 1000);
        await this.userRepo.update(user.id, { reset_password_token, reset_password_expires });
        await this.emailService.sendPasswordResetEmail(user.email, user.username, reset_password_token);
        return { message: 'Si ese email existe, recibirás un link para restablecer tu contraseña.' };
    }
    async resetPassword(token, newPassword) {
        const user = await this.userRepo.findOne({
            where: { reset_password_token: token },
        });
        if (!user)
            throw new common_1.BadRequestException('Token inválido o expirado');
        if (new Date() > user.reset_password_expires) {
            throw new common_1.BadRequestException('El link expiró — solicitá uno nuevo');
        }
        const password_hash = await bcrypt.hash(newPassword, 12);
        await this.userRepo.update(user.id, {
            password_hash,
            reset_password_token: null,
            reset_password_expires: null,
        });
        return { message: 'Contraseña actualizada correctamente' };
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!await bcrypt.compare(currentPassword, user.password_hash)) {
            throw new common_1.BadRequestException('La contraseña actual es incorrecta');
        }
        const password_hash = await bcrypt.hash(newPassword, 12);
        await this.userRepo.update(userId, { password_hash });
        return { message: 'Contraseña actualizada correctamente' };
    }
    async updateProfile(userId, dto) {
        await this.userRepo.update(userId, dto);
        return this.userRepo.findOne({
            where: { id: userId },
            select: ['id', 'email', 'username', 'full_name', 'country', 'role', 'is_premium'],
        });
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
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
                country: user.country,
                full_name: user.full_name,
                is_verified: user.is_verified,
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map