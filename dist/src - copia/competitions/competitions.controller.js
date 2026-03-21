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
exports.CompetitionsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const competitions_service_1 = require("./competitions.service");
const roles_guard_1 = require("../common/guards/roles.guard");
const user_entity_1 = require("../users/user.entity");
let CompetitionsController = class CompetitionsController {
    constructor(service) {
        this.service = service;
    }
    findAll() { return this.service.findAll(); }
    findOne(id) { return this.service.findOne(id); }
    getMatchdays(id) { return this.service.getMatchdays(id); }
    getMatchday(id) { return this.service.getMatchdayWithMatches(id); }
    syncTemporada(body) {
        return this.service.syncTemporada(body.competition_api_id, body.season);
    }
    createMatchday(body) { return this.service.createMatchday(body); }
    createMatch(body) { return this.service.createMatch(body); }
    updateResult(id, body) {
        return this.service.updateResult(id, body.home_score, body.away_score);
    }
};
exports.CompetitionsController = CompetitionsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CompetitionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CompetitionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/matchdays'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CompetitionsController.prototype, "getMatchdays", null);
__decorate([
    (0, common_1.Get)('matchdays/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CompetitionsController.prototype, "getMatchday", null);
__decorate([
    (0, common_1.Post)('admin/sync'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CompetitionsController.prototype, "syncTemporada", null);
__decorate([
    (0, common_1.Post)('admin/matchday'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CompetitionsController.prototype, "createMatchday", null);
__decorate([
    (0, common_1.Post)('admin/match'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CompetitionsController.prototype, "createMatch", null);
__decorate([
    (0, common_1.Post)('admin/match/:id/result'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], CompetitionsController.prototype, "updateResult", null);
exports.CompetitionsController = CompetitionsController = __decorate([
    (0, common_1.Controller)('competitions'),
    __metadata("design:paramtypes", [competitions_service_1.CompetitionsService])
], CompetitionsController);
//# sourceMappingURL=competitions.controller.js.map