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
exports.Match = exports.MatchStatus = void 0;
const typeorm_1 = require("typeorm");
const matchday_entity_1 = require("../matchdays/matchday.entity");
var MatchStatus;
(function (MatchStatus) {
    MatchStatus["SCHEDULED"] = "SCHEDULED";
    MatchStatus["LIVE"] = "LIVE";
    MatchStatus["FINISHED"] = "FINISHED";
    MatchStatus["POSTPONED"] = "POSTPONED";
    MatchStatus["CANCELLED"] = "CANCELLED";
})(MatchStatus || (exports.MatchStatus = MatchStatus = {}));
let Match = class Match {
};
exports.Match = Match;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Match.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Match.prototype, "matchday_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => matchday_entity_1.Matchday, (m) => m.matches),
    (0, typeorm_1.JoinColumn)({ name: 'matchday_id' }),
    __metadata("design:type", matchday_entity_1.Matchday)
], Match.prototype, "matchday", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Match.prototype, "home_team", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Match.prototype, "away_team", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Match.prototype, "home_logo_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Match.prototype, "away_logo_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime' }),
    __metadata("design:type", Date)
], Match.prototype, "match_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: MatchStatus, default: MatchStatus.SCHEDULED }),
    __metadata("design:type", String)
], Match.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'int' }),
    __metadata("design:type", Number)
], Match.prototype, "home_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'int' }),
    __metadata("design:type", Number)
], Match.prototype, "away_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Match.prototype, "api_football_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Match.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Match.prototype, "updated_at", void 0);
exports.Match = Match = __decorate([
    (0, typeorm_1.Entity)('matches')
], Match);
//# sourceMappingURL=match.entity.js.map