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
exports.QuinielaJornada = exports.JornadaStatus = void 0;
const typeorm_1 = require("typeorm");
const quiniela_entity_1 = require("./quiniela.entity");
const matchday_entity_1 = require("../matchdays/matchday.entity");
const prediccion_entity_1 = require("./prediccion.entity");
var JornadaStatus;
(function (JornadaStatus) {
    JornadaStatus["PENDIENTE"] = "PENDIENTE";
    JornadaStatus["ABIERTA"] = "ABIERTA";
    JornadaStatus["CERRADA"] = "CERRADA";
    JornadaStatus["FINALIZADA"] = "FINALIZADA";
})(JornadaStatus || (exports.JornadaStatus = JornadaStatus = {}));
let QuinielaJornada = class QuinielaJornada {
};
exports.QuinielaJornada = QuinielaJornada;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], QuinielaJornada.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], QuinielaJornada.prototype, "quiniela_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => quiniela_entity_1.Quiniela, (q) => q.jornadas),
    (0, typeorm_1.JoinColumn)({ name: 'quiniela_id' }),
    __metadata("design:type", quiniela_entity_1.Quiniela)
], QuinielaJornada.prototype, "quiniela", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], QuinielaJornada.prototype, "matchday_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => matchday_entity_1.Matchday),
    (0, typeorm_1.JoinColumn)({ name: 'matchday_id' }),
    __metadata("design:type", matchday_entity_1.Matchday)
], QuinielaJornada.prototype, "matchday", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], QuinielaJornada.prototype, "round_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: JornadaStatus, default: JornadaStatus.PENDIENTE }),
    __metadata("design:type", String)
], QuinielaJornada.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'datetime' }),
    __metadata("design:type", Date)
], QuinielaJornada.prototype, "closes_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], QuinielaJornada.prototype, "points_calculated", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], QuinielaJornada.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => prediccion_entity_1.Prediccion, (p) => p.quiniela_jornada),
    __metadata("design:type", Array)
], QuinielaJornada.prototype, "predicciones", void 0);
exports.QuinielaJornada = QuinielaJornada = __decorate([
    (0, typeorm_1.Entity)('quiniela_jornadas')
], QuinielaJornada);
//# sourceMappingURL=quiniela-jornada.entity.js.map