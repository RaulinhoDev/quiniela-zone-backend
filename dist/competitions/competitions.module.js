"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompetitionsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const axios_1 = require("@nestjs/axios");
const competitions_service_1 = require("./competitions.service");
const competitions_controller_1 = require("./competitions.controller");
const competition_entity_1 = require("./competition.entity");
const matchday_entity_1 = require("../matchdays/matchday.entity");
const match_entity_1 = require("../matches/match.entity");
const quinielas_module_1 = require("../quinielas/quinielas.module");
let CompetitionsModule = class CompetitionsModule {
};
exports.CompetitionsModule = CompetitionsModule;
exports.CompetitionsModule = CompetitionsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([competition_entity_1.Competition, matchday_entity_1.Matchday, match_entity_1.Match]),
            axios_1.HttpModule,
            quinielas_module_1.QuinielasModule,
        ],
        providers: [competitions_service_1.CompetitionsService],
        controllers: [competitions_controller_1.CompetitionsController],
        exports: [competitions_service_1.CompetitionsService],
    })
], CompetitionsModule);
//# sourceMappingURL=competitions.module.js.map