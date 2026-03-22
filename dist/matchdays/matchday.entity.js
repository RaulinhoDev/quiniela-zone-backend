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
exports.Matchday = exports.TorneoType = void 0;
const typeorm_1 = require("typeorm");
const competition_entity_1 = require("../competitions/competition.entity");
const match_entity_1 = require("../matches/match.entity");
var TorneoType;
(function (TorneoType) {
    TorneoType["APERTURA"] = "Apertura";
    TorneoType["CLAUSURA"] = "Clausura";
    TorneoType["UNICO"] = "\u00DAnico";
    TorneoType["OTRO"] = "Otro";
})(TorneoType || (exports.TorneoType = TorneoType = {}));
let Matchday = class Matchday {
};
exports.Matchday = Matchday;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Matchday.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Matchday.prototype, "competition_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => competition_entity_1.Competition),
    (0, typeorm_1.JoinColumn)({ name: 'competition_id' }),
    __metadata("design:type", competition_entity_1.Competition)
], Matchday.prototype, "competition", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Matchday.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Matchday.prototype, "season", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Matchday.prototype, "torneo", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Matchday.prototype, "round_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Matchday.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Matchday.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Matchday.prototype, "is_finished", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Matchday.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => match_entity_1.Match, (m) => m.matchday),
    __metadata("design:type", Array)
], Matchday.prototype, "matches", void 0);
exports.Matchday = Matchday = __decorate([
    (0, typeorm_1.Entity)('matchdays')
], Matchday);
//# sourceMappingURL=matchday.entity.js.map