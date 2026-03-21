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
exports.ScoringRule = void 0;
const typeorm_1 = require("typeorm");
const quiniela_entity_1 = require("./quiniela.entity");
let ScoringRule = class ScoringRule {
};
exports.ScoringRule = ScoringRule;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ScoringRule.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ScoringRule.prototype, "quiniela_id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => quiniela_entity_1.Quiniela, (q) => q.scoring_rule),
    (0, typeorm_1.JoinColumn)({ name: 'quiniela_id' }),
    __metadata("design:type", quiniela_entity_1.Quiniela)
], ScoringRule.prototype, "quiniela", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 3 }),
    __metadata("design:type", Number)
], ScoringRule.prototype, "exact_score_pts", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Number)
], ScoringRule.prototype, "correct_winner_pts", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], ScoringRule.prototype, "wrong_pts", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], ScoringRule.prototype, "double_points_final", void 0);
exports.ScoringRule = ScoringRule = __decorate([
    (0, typeorm_1.Entity)('scoring_rules')
], ScoringRule);
//# sourceMappingURL=scoring-rule.entity.js.map