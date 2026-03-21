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
exports.Quiniela = exports.QuinielaStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const competition_entity_1 = require("../competitions/competition.entity");
const quiniela_participante_entity_1 = require("./quiniela-participante.entity");
const quiniela_jornada_entity_1 = require("./quiniela-jornada.entity");
const scoring_rule_entity_1 = require("./scoring-rule.entity");
var QuinielaStatus;
(function (QuinielaStatus) {
    QuinielaStatus["ESPERANDO"] = "ESPERANDO";
    QuinielaStatus["ACTIVA"] = "ACTIVA";
    QuinielaStatus["FINALIZADA"] = "FINALIZADA";
})(QuinielaStatus || (exports.QuinielaStatus = QuinielaStatus = {}));
let Quiniela = class Quiniela {
};
exports.Quiniela = Quiniela;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Quiniela.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Quiniela.prototype, "owner_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'owner_id' }),
    __metadata("design:type", user_entity_1.User)
], Quiniela.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Quiniela.prototype, "competition_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => competition_entity_1.Competition),
    (0, typeorm_1.JoinColumn)({ name: 'competition_id' }),
    __metadata("design:type", competition_entity_1.Competition)
], Quiniela.prototype, "competition", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Quiniela.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Quiniela.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Quiniela.prototype, "invite_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: QuinielaStatus, default: QuinielaStatus.ESPERANDO }),
    __metadata("design:type", String)
], Quiniela.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Quiniela.prototype, "is_paid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Quiniela.prototype, "entry_fee", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Quiniela.prototype, "season", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Quiniela.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Quiniela.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Quiniela.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => quiniela_participante_entity_1.QuinielaParticipante, (p) => p.quiniela, { cascade: true }),
    __metadata("design:type", Array)
], Quiniela.prototype, "participantes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => quiniela_jornada_entity_1.QuinielaJornada, (j) => j.quiniela, { cascade: true }),
    __metadata("design:type", Array)
], Quiniela.prototype, "jornadas", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => scoring_rule_entity_1.ScoringRule, (s) => s.quiniela, { cascade: true }),
    __metadata("design:type", scoring_rule_entity_1.ScoringRule)
], Quiniela.prototype, "scoring_rule", void 0);
exports.Quiniela = Quiniela = __decorate([
    (0, typeorm_1.Entity)('quinielas')
], Quiniela);
//# sourceMappingURL=quiniela.entity.js.map