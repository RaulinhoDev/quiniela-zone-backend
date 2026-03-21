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
exports.Competition = exports.CompetitionRegion = void 0;
const typeorm_1 = require("typeorm");
var CompetitionRegion;
(function (CompetitionRegion) {
    CompetitionRegion["HONDURAS"] = "HN";
    CompetitionRegion["COSTA_RICA"] = "CR";
    CompetitionRegion["GUATEMALA"] = "GT";
    CompetitionRegion["EL_SALVADOR"] = "SV";
    CompetitionRegion["NICARAGUA"] = "NI";
    CompetitionRegion["PANAMA"] = "PA";
    CompetitionRegion["BELIZE"] = "BZ";
    CompetitionRegion["CONCACAF"] = "CONCACAF";
    CompetitionRegion["MUNDIAL"] = "MUNDIAL";
})(CompetitionRegion || (exports.CompetitionRegion = CompetitionRegion = {}));
let Competition = class Competition {
};
exports.Competition = Competition;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Competition.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Competition.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Competition.prototype, "short_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: CompetitionRegion, default: CompetitionRegion.HONDURAS }),
    __metadata("design:type", String)
], Competition.prototype, "region", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Competition.prototype, "logo_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Competition.prototype, "api_football_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Competition.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Competition.prototype, "is_manual", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Competition.prototype, "created_at", void 0);
exports.Competition = Competition = __decorate([
    (0, typeorm_1.Entity)('competitions')
], Competition);
//# sourceMappingURL=competition.entity.js.map