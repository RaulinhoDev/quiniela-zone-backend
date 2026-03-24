"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const dotenv = require("dotenv");
dotenv.config();
const AppDataSource = new typeorm_1.DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT ?? '3306') || 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'quiniela_ca_v2',
    entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
    synchronize: false,
});
async function seed() {
    await AppDataSource.initialize();
    const repo = AppDataSource.getRepository('competitions');
    const competencias = [
        { name: 'Liga Nacional de Honduras', short_name: 'LNH', region: 'HN', api_football_id: 239, is_manual: false },
        { name: 'Selección de Honduras', short_name: 'H', region: 'HN', api_football_id: null, is_manual: true },
        { name: 'Liga Promerica de Costa Rica', short_name: 'LPR', region: 'CR', api_football_id: 238, is_manual: false },
        { name: 'Liga Mayor de Guatemala', short_name: 'LMG', region: 'GT', api_football_id: 240, is_manual: false },
        { name: 'Primera División El Salvador', short_name: 'PDES', region: 'SV', api_football_id: 241, is_manual: false },
        { name: 'Liga Primera de Nicaragua', short_name: 'LPN', region: 'NI', api_football_id: null, is_manual: true },
        { name: 'Liga Panameña de Fútbol', short_name: 'LPF', region: 'PA', api_football_id: 242, is_manual: false },
        { name: 'Premier League de Belice', short_name: 'PLB', region: 'BZ', api_football_id: null, is_manual: true },
        { name: 'Liga de Campeones CONCACAF', short_name: 'LCC', region: 'CONCACAF', api_football_id: 21, is_manual: false },
        { name: 'Copa Oro CONCACAF', short_name: 'CG', region: 'CONCACAF', api_football_id: 22, is_manual: false },
        { name: 'Liga de Naciones CONCACAF', short_name: 'LNC', region: 'CONCACAF', api_football_id: 686, is_manual: false },
        { name: 'Eliminatoria CONCACAF', short_name: 'ELIM', region: 'CONCACAF', api_football_id: 31, is_manual: false },
        { name: 'UEFA Champions League', short_name: 'UCL', region: 'MUNDIAL', api_football_id: 2, is_manual: false },
        { name: 'Copa Mundial FIFA', short_name: 'WC', region: 'MUNDIAL', api_football_id: 1, is_manual: false },
        { name: 'Copa América', short_name: 'CA', region: 'MUNDIAL', api_football_id: 9, is_manual: false },
        { name: 'Copa Libertadores', short_name: 'LIB', region: 'MUNDIAL', api_football_id: 13, is_manual: false },
        { name: 'LaLiga', short_name: 'ESP', region: 'MUNDIAL', api_football_id: 140, is_manual: false },
        { name: 'Premier League', short_name: 'ENG', region: 'MUNDIAL', api_football_id: 39, is_manual: false },
    ];
    let creadas = 0;
    for (const data of competencias) {
        const existe = await repo.findOne({ where: { name: data.name } });
        if (!existe) {
            await repo.save(repo.create(data));
            console.log(`✓ ${data.name}`);
            creadas++;
        }
        else {
            console.log(`- Ya existe: ${data.name}`);
        }
    }
    console.log(`\nSeed completado: ${creadas} competencias creadas.`);
    await AppDataSource.destroy();
}
seed().catch(e => { console.error(e); process.exit(1); });
//# sourceMappingURL=competitions.seed.js.map