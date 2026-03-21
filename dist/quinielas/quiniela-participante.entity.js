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
exports.QuinielaParticipante = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const quiniela_entity_1 = require("./quiniela.entity");
const prediccion_entity_1 = require("./prediccion.entity");
let QuinielaParticipante = class QuinielaParticipante {
};
exports.QuinielaParticipante = QuinielaParticipante;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], QuinielaParticipante.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], QuinielaParticipante.prototype, "quiniela_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => quiniela_entity_1.Quiniela, (q) => q.participantes),
    (0, typeorm_1.JoinColumn)({ name: 'quiniela_id' }),
    __metadata("design:type", quiniela_entity_1.Quiniela)
], QuinielaParticipante.prototype, "quiniela", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], QuinielaParticipante.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], QuinielaParticipante.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], QuinielaParticipante.prototype, "total_points", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], QuinielaParticipante.prototype, "exact_scores", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], QuinielaParticipante.prototype, "correct_winners", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], QuinielaParticipante.prototype, "jornadas_jugadas", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'int' }),
    __metadata("design:type", Number)
], QuinielaParticipante.prototype, "rank", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], QuinielaParticipante.prototype, "has_paid", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], QuinielaParticipante.prototype, "joined_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => prediccion_entity_1.Prediccion, (p) => p.participante),
    __metadata("design:type", Array)
], QuinielaParticipante.prototype, "predicciones", void 0);
exports.QuinielaParticipante = QuinielaParticipante = __decorate([
    (0, typeorm_1.Entity)('quiniela_participantes'),
    (0, typeorm_1.Unique)(['quiniela_id', 'user_id'])
], QuinielaParticipante);
//# sourceMappingURL=quiniela-participante.entity.js.map