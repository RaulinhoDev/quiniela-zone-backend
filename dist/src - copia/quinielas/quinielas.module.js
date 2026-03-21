"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuinielasModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const quinielas_service_1 = require("./quinielas.service");
const quinielas_controller_1 = require("./quinielas.controller");
const quiniela_entity_1 = require("./quiniela.entity");
const quiniela_jornada_entity_1 = require("./quiniela-jornada.entity");
const quiniela_participante_entity_1 = require("./quiniela-participante.entity");
const prediccion_entity_1 = require("./prediccion.entity");
const scoring_rule_entity_1 = require("./scoring-rule.entity");
const match_entity_1 = require("../matches/match.entity");
const matchday_entity_1 = require("../matchdays/matchday.entity");
let QuinielasModule = class QuinielasModule {
};
exports.QuinielasModule = QuinielasModule;
exports.QuinielasModule = QuinielasModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                quiniela_entity_1.Quiniela, quiniela_jornada_entity_1.QuinielaJornada, quiniela_participante_entity_1.QuinielaParticipante,
                prediccion_entity_1.Prediccion, scoring_rule_entity_1.ScoringRule, match_entity_1.Match, matchday_entity_1.Matchday,
            ]),
        ],
        providers: [quinielas_service_1.QuinielasService],
        controllers: [quinielas_controller_1.QuinielasController],
        exports: [quinielas_service_1.QuinielasService],
    })
], QuinielasModule);
//# sourceMappingURL=quinielas.module.js.map