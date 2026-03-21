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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./user.entity");
const roles_guard_1 = require("../common/guards/roles.guard");
let UsersController = class UsersController {
    constructor(userRepo) {
        this.userRepo = userRepo;
    }
    async findAll(page = 1, limit = 15, search = '', role = '') {
        const skip = (page - 1) * limit;
        const where = {};
        if (role)
            where.role = role;
        const qb = this.userRepo.createQueryBuilder('u')
            .select(['u.id', 'u.email', 'u.username', 'u.full_name', 'u.country', 'u.role', 'u.created_at'])
            .orderBy('u.created_at', 'DESC')
            .skip(skip)
            .take(limit);
        if (search) {
            qb.where('u.username LIKE :search OR u.email LIKE :search', { search: `%${search}%` });
        }
        if (role) {
            search
                ? qb.andWhere('u.role = :role', { role })
                : qb.where('u.role = :role', { role });
        }
        const [data, total] = await qb.getManyAndCount();
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('admin/all'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersController);
//# sourceMappingURL=users.controller.js.map