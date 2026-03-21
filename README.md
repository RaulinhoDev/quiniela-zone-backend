# Quiniela CA — Backend v2

Plataforma de quinielas deportivas para Centroamérica.
Stack: NestJS + TypeORM + MySQL

---

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
copy .env.example .env
# Editar .env con tus credenciales

# 3. Crear base de datos
mysql -u root -p -e "CREATE DATABASE quiniela_ca_v2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 4. Arrancar (crea tablas automáticamente en development)
npm run start:dev

# 5. Cargar competencias iniciales (en otra terminal)
npm run seed
```

---

## Flujo principal

### 1. Como admin — sincronizar una temporada completa
```bash
# Primero hacer login con cuenta ADMIN
POST /api/v1/auth/login

# Luego sincronizar (trae todas las jornadas y partidos de la temporada)
POST /api/v1/competitions/admin/sync
{
  "competition_api_id": 239,   # Liga Nacional de Honduras
  "season": "2025"
}
```
Esto importa automáticamente todas las jornadas y partidos desde API-Football.

### 2. Como usuario — crear una quiniela
```bash
POST /api/v1/quinielas
{
  "name": "Clausura 2026 — Grupo del trabajo",
  "competition_id": 1,
  "season": "2025",
  "is_paid": false,
  "scoring": {
    "exact_score_pts": 3,
    "correct_winner_pts": 1
  }
}
# Respuesta incluye invite_code para compartir con amigos
```

### 3. Amigos se unen
```bash
POST /api/v1/quinielas/unirse/codigo
{ "invite_code": "ABC123" }

# IMPORTANTE: Solo se pueden unir mientras la quiniela está en status ESPERANDO
# Una vez que el owner abre la primera jornada, no se aceptan nuevos participantes
```

### 4. Owner abre cada jornada
```bash
POST /api/v1/quinielas/:id/jornadas
{
  "matchday_id": 5,           # ID de la jornada en nuestra BD
  "closes_at": "2026-01-24T19:45:00"  # hasta cuándo aceptar predicciones
}
```

### 5. Participantes envían predicciones
```bash
POST /api/v1/quinielas/:id/jornadas/:jornadaId/predicciones
{
  "predicciones": [
    { "match_id": 1, "home_pred": 2, "away_pred": 1 },
    { "match_id": 2, "home_pred": 0, "away_pred": 0 },
    { "match_id": 3, "home_pred": 1, "away_pred": 3 }
  ]
}
```

### 6. Resultados se actualizan automáticamente
El job corre cada 5 minutos y actualiza resultados desde API-Football.
Para ligas manuales, el admin ingresa el resultado:
```bash
POST /api/v1/competitions/admin/match/:id/result
{ "home_score": 2, "away_score": 1 }
```

### 7. Ver ranking acumulado
```bash
GET /api/v1/quinielas/:id/ranking
# Devuelve ranking de participantes con puntos acumulados de TODAS las jornadas
```

---

## Cómo hacer un usuario ADMIN

Por ahora se hace directo en la BD:
```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'tu@email.com';
```

---

## IDs de competencias útiles (API-Football)

| Competencia | ID |
|---|---|
| Liga Nacional Honduras | 239 |
| Liga Promerica Costa Rica | 238 |
| Liga Mayor Guatemala | 240 |
| Primera División El Salvador | 241 |
| Liga Panameña de Fútbol | 242 |
| Champions League | 2 |
| Copa Mundial FIFA | 1 |
| Eliminatoria CONCACAF | 31 |
| Copa Oro | 22 |

---

## Diferencias vs v1

| v1 | v2 |
|---|---|
| Quiniela = una jornada | Quiniela = torneo completo |
| Puntos por jornada separados | Puntos acumulados en ranking único |
| Sin roles de usuario | Roles ADMIN / USER |
| Sync reactivo | Sync completo de temporada |
| Todo en español mezclado | Español consistente en entidades |
