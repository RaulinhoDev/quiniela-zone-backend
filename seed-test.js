// Script de datos de prueba — Liga Nacional Clausura
// Ejecutar: node seed-test.js
// Requiere que el servidor esté corriendo en localhost:3000

const BASE_URL    = 'http://localhost:3000/api/v1';
const ADMIN_EMAIL = 'rauleduardoq@outlook.com';   // ← cambiá esto
const ADMIN_PASS  = 'Raul1999.';      // ← cambiá esto
const COMPETITION_ID = 1;              // Liga Nacional de Honduras
const SEASON      = '2026';
const TORNEO      = 'Clausura';
const HOY         = '2026-03-23';

const JORNADA_1_INICIO = `${HOY}T22:02:00`;
const JORNADA_1_FIN    = `${HOY}T22:05:00`;
const JORNADA_2_INICIO = `${HOY}T22:12:00`;
const JORNADA_2_FIN    = `${HOY}T22:15:00`;

const PARTIDOS_J1 = [
  { home: 'Olimpia',           away: 'Motagua'         },
  { home: 'Real España',       away: 'Marathón'        },
  { home: 'Platense',          away: 'Victoria'        },
  { home: 'Honduras Progreso', away: 'Lobos UPNFM'     },
  { home: 'Olancho FC',        away: 'Juticalpa FC'    },
];

const PARTIDOS_J2 = [
  { home: 'Motagua',           away: 'Real España'     },
  { home: 'Marathón',          away: 'Olimpia'         },
  { home: 'Victoria',          away: 'Honduras Progreso'},
  { home: 'Lobos UPNFM',       away: 'Olancho FC'      },
  { home: 'Juticalpa FC',      away: 'Platense'        },
];

async function post(url, body, token) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status} — ${err}`);
  }
  return res.json();
}

async function main() {
  // 1. Login
  console.log('Iniciando sesión...');
  const loginRes = await post(`${BASE_URL}/auth/login`, {
    email: ADMIN_EMAIL, password: ADMIN_PASS,
  });
  const token = loginRes.access_token;
  console.log('✓ Login OK\n');

  // 2. Jornada 1
  console.log('Creando Jornada 1...');
  const j1 = await post(`${BASE_URL}/competitions/admin/matchday`, {
    competition_id: COMPETITION_ID,
    name:           `${TORNEO} - Jornada 1`,
    season:         SEASON,
    torneo:         TORNEO,
    round_number:   1,
    start_date:     JORNADA_1_INICIO,
    end_date:       JORNADA_1_FIN,
  }, token);
  console.log(`✓ Jornada 1 creada (ID: ${j1.id})\n`);

  // 3. Partidos Jornada 1
  console.log('Creando partidos Jornada 1...');
  for (const p of PARTIDOS_J1) {
    await post(`${BASE_URL}/competitions/admin/match`, {
      matchday_id: j1.id,
      home_team:   p.home,
      away_team:   p.away,
      match_date:  JORNADA_1_INICIO,
    }, token);
    console.log(`  ✓ ${p.home} vs ${p.away}`);
  }

  // 4. Jornada 2
  console.log('\nCreando Jornada 2...');
  const j2 = await post(`${BASE_URL}/competitions/admin/matchday`, {
    competition_id: COMPETITION_ID,
    name:           `${TORNEO} - Jornada 2`,
    season:         SEASON,
    torneo:         TORNEO,
    round_number:   2,
    start_date:     JORNADA_2_INICIO,
    end_date:       JORNADA_2_FIN,
  }, token);
  console.log(`✓ Jornada 2 creada (ID: ${j2.id})\n`);

  // 5. Partidos Jornada 2
  console.log('Creando partidos Jornada 2...');
  for (const p of PARTIDOS_J2) {
    await post(`${BASE_URL}/competitions/admin/match`, {
      matchday_id: j2.id,
      home_team:   p.home,
      away_team:   p.away,
      match_date:  JORNADA_2_INICIO,
    }, token);
    console.log(`  ✓ ${p.home} vs ${p.away}`);
  }

  console.log('\n✅ Todo listo. 2 jornadas y 10 partidos creados.');
  console.log(`   Jornada 1 ID: ${j1.id} | Jornada 2 ID: ${j2.id}`);
}

main().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
