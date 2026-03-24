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
exports.QuinielasController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const quinielas_service_1 = require("./quinielas.service");
let QuinielasController = class QuinielasController {
    constructor(quinielasService) {
        this.quinielasService = quinielasService;
    }
    create(req, dto) {
        return this.quinielasService.create(req.user, dto);
    }
    findOne(id) {
        return this.quinielasService.findOne(id);
    }
    getRanking(id, page = '1', limit = '50') {
        return this.quinielasService.getRanking(id, parseInt(page), parseInt(limit));
    }
    misQuinielas(req) {
        return this.quinielasService.findMisQuinielas(req.user.id);
    }
    perfilPublico(username) {
        return this.quinielasService.getPerfilPublico(username);
    }
    misEstadisticas(req) {
        return this.quinielasService.getMisEstadisticas(req.user.id);
    }
    misTrofeos(req) {
        return this.quinielasService.getMisTrofeos(req.user.id);
    }
    misLimites(req) {
        return this.quinielasService.getMisLimites(req.user);
    }
    unirse(req, id) {
        return this.quinielasService.unirse(req.user, id);
    }
    unirseByCode(req, body) {
        return this.quinielasService.unirseByCode(req.user, body.invite_code);
    }
    abrirQuiniela(req, id) {
        return this.quinielasService.abrirQuiniela(req.user, id);
    }
    enviarPredicciones(req, id, jornadaId, dto) {
        return this.quinielasService.enviarPredicciones(req.user, id, jornadaId, dto);
    }
    historial(req, id) {
        return this.quinielasService.getHistorial(req.user, id);
    }
    todasPredicciones(req, id, jornadaId) {
        return this.quinielasService.getTodasPredicciones(req.user, id, jornadaId);
    }
    puntosPorJornada(req, id, jornadaId) {
        return this.quinielasService.getPuntosPorJornada(req.user, id, jornadaId);
    }
    misPredicciones(req, id, jornadaId) {
        return this.quinielasService.getMisPredicciones(req.user, id, jornadaId);
    }
};
exports.QuinielasController = QuinielasController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], QuinielasController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], QuinielasController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/ranking'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], QuinielasController.prototype, "getRanking", null);
__decorate([
    (0, common_1.Get)('mis/quinielas'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QuinielasController.prototype, "misQuinielas", null);
__decorate([
    (0, common_1.Get)('perfil/:username'),
    __param(0, (0, common_1.Param)('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuinielasController.prototype, "perfilPublico", null);
__decorate([
    (0, common_1.Get)('mis/estadisticas'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QuinielasController.prototype, "misEstadisticas", null);
__decorate([
    (0, common_1.Get)('mis/trofeos'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QuinielasController.prototype, "misTrofeos", null);
__decorate([
    (0, common_1.Get)('mis/limites'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QuinielasController.prototype, "misLimites", null);
__decorate([
    (0, common_1.Post)(':id/unirse'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], QuinielasController.prototype, "unirse", null);
__decorate([
    (0, common_1.Post)('unirse/codigo'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], QuinielasController.prototype, "unirseByCode", null);
__decorate([
    (0, common_1.Post)(':id/abrir'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], QuinielasController.prototype, "abrirQuiniela", null);
__decorate([
    (0, common_1.Post)(':id/jornadas/:jornadaId/predicciones'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Param)('jornadaId', common_1.ParseIntPipe)),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, Object]),
    __metadata("design:returntype", void 0)
], QuinielasController.prototype, "enviarPredicciones", null);
__decorate([
    (0, common_1.Get)(':id/historial'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], QuinielasController.prototype, "historial", null);
__decorate([
    (0, common_1.Get)(':id/jornadas/:jornadaId/todas-predicciones'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Param)('jornadaId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", void 0)
], QuinielasController.prototype, "todasPredicciones", null);
__decorate([
    (0, common_1.Get)(':id/jornadas/:jornadaId/puntos'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Param)('jornadaId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", void 0)
], QuinielasController.prototype, "puntosPorJornada", null);
__decorate([
    (0, common_1.Get)(':id/jornadas/:jornadaId/mis-predicciones'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Param)('jornadaId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", void 0)
], QuinielasController.prototype, "misPredicciones", null);
exports.QuinielasController = QuinielasController = __decorate([
    (0, common_1.Controller)('quinielas'),
    __metadata("design:paramtypes", [quinielas_service_1.QuinielasService])
], QuinielasController);
//# sourceMappingURL=quinielas.controller.js.map