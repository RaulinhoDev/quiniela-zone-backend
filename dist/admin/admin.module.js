"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const admin_service_1 = require("./admin.service");
const admin_controller_1 = require("./admin.controller");
const user_entity_1 = require("../users/user.entity");
const quiniela_entity_1 = require("../quinielas/quiniela.entity");
const quiniela_participante_entity_1 = require("../quinielas/quiniela-participante.entity");
const prediccion_entity_1 = require("../quinielas/prediccion.entity");
const match_entity_1 = require("../matches/match.entity");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                user_entity_1.User, quiniela_entity_1.Quiniela, quiniela_participante_entity_1.QuinielaParticipante, prediccion_entity_1.Prediccion, match_entity_1.Match
            ]),
        ],
        providers: [admin_service_1.AdminService],
        controllers: [admin_controller_1.AdminController],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map