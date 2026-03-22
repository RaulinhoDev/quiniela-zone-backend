"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const schedule_1 = require("@nestjs/schedule");
const throttler_1 = require("@nestjs/throttler");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const admin_module_1 = require("./admin/admin.module");
const email_module_1 = require("./email/email.module");
const competitions_module_1 = require("./competitions/competitions.module");
const quinielas_module_1 = require("./quinielas/quinielas.module");
const stripe_module_1 = require("./stripe/stripe.module");
const user_entity_1 = require("./users/user.entity");
const competition_entity_1 = require("./competitions/competition.entity");
const matchday_entity_1 = require("./matchdays/matchday.entity");
const match_entity_1 = require("./matches/match.entity");
const quiniela_entity_1 = require("./quinielas/quiniela.entity");
const quiniela_jornada_entity_1 = require("./quinielas/quiniela-jornada.entity");
const quiniela_participante_entity_1 = require("./quinielas/quiniela-participante.entity");
const prediccion_entity_1 = require("./quinielas/prediccion.entity");
const scoring_rule_entity_1 = require("./quinielas/scoring-rule.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    type: 'mysql',
                    host: config.get('DB_HOST', 'localhost'),
                    port: config.get('DB_PORT', 3306),
                    username: config.get('DB_USERNAME', 'root'),
                    password: config.get('DB_PASSWORD', ''),
                    database: config.get('DB_DATABASE', 'quiniela_ca_v2'),
                    entities: [
                        user_entity_1.User, competition_entity_1.Competition, matchday_entity_1.Matchday, match_entity_1.Match,
                        quiniela_entity_1.Quiniela, quiniela_jornada_entity_1.QuinielaJornada, quiniela_participante_entity_1.QuinielaParticipante,
                        prediccion_entity_1.Prediccion, scoring_rule_entity_1.ScoringRule,
                    ],
                    synchronize: config.get('NODE_ENV') === 'development',
                    logging: config.get('NODE_ENV') === 'development',
                    timezone: 'America/Tegucigalpa',
                }),
            }),
            schedule_1.ScheduleModule.forRoot(),
            throttler_1.ThrottlerModule.forRoot([
                { name: 'global', ttl: 60000, limit: 60 },
                { name: 'auth', ttl: 300000, limit: 5 },
            ]),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            admin_module_1.AdminModule,
            email_module_1.EmailModule,
            competitions_module_1.CompetitionsModule,
            quinielas_module_1.QuinielasModule,
            stripe_module_1.StripeModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map