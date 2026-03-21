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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prediccion = void 0;
const typeorm_1 = require("typeorm");
const quiniela_participante_entity_1 = require("./quiniela-participante.entity");
const quiniela_jornada_entity_1 = require("./quiniela-jornada.entity");
const match_entity_1 = require("../matches/match.entity");
let Prediccion = class Prediccion {
};
exports.Prediccion = Prediccion;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Prediccion.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Prediccion.prototype, "participante_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => quiniela_participante_entity_1.QuinielaParticipante, (p) => p.predicciones),
    (0, typeorm_1.JoinColumn)({ name: 'participante_id' }),
    __metadata("design:type", quiniela_participante_entity_1.QuinielaParticipante)
], Prediccion.prototype, "participante", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Prediccion.prototype, "quiniela_jornada_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => quiniela_jornada_entity_1.QuinielaJornada, (j) => j.predicciones),
    (0, typeorm_1.JoinColumn)({ name: 'quiniela_jornada_id' }),
    __metadata("design:type", quiniela_jornada_entity_1.QuinielaJornada)
], Prediccion.prototype, "quiniela_jornada", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Prediccion.prototype, "match_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => match_entity_1.Match),
    (0, typeorm_1.JoinColumn)({ name: 'match_id' }),
    __metadata("design:type", match_entity_1.Match)
], Prediccion.prototype, "match", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Prediccion.prototype, "home_pred", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Prediccion.prototype, "away_pred", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Prediccion.prototype, "points_earned", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Prediccion.prototype, "is_calculated", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Prediccion.prototype, "created_at", void 0);
exports.Prediccion = Prediccion = __decorate([
    (0, typeorm_1.Entity)('predicciones'),
    (0, typeorm_1.Unique)(['participante_id', 'match_id'])
], Prediccion);
//# sourceMappingURL=prediccion.entity.js.map