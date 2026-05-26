# Campaign Flow Builder — Backend API

MVP of a campaign automation platform with dynamic contact segmentation and visual flow canvas.

**Production API:** https://api.mvpcampaign.online · **Frontend:** https://www.mvpcampaign.online

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js LTS |
| Framework | Express |
| ORM | Sequelize v6 |
| Database | MySQL |
| Language | TypeScript (strict mode) |

---

## Installation

**Prerequisites:** Node.js >= 18 LTS, MySQL >= 8.0

```bash
# 1. Install dependencies
npm install

# 2. Create the database
mysql -u root -p -e "CREATE DATABASE campaign_flow_builder;"

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your MySQL credentials

# 4. Run migrations
npm run db:migrate

# 5. Load seed data (~100 contacts)
npm run seed

# 6. Start the server
npm start
```

---

## Environment variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `3000` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | `yourpassword` |
| `DB_NAME` | Database name | `campaign_flow_builder` |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `http://localhost:4200` |
| `GITHUB_USERNAME` | GitHub username for webhook deploys | `NahuelMoron1` |
| `GITHUB_TOKEN` | GitHub personal access token for webhook deploys | `ghp_...` |
| `SSH_IP` | IP of the frontend host (for FE webhook deploy) | `123.45.67.89` |
| `SSH_PASSWORD` | SSH password for the frontend host | `yourpassword` |

---

## Available scripts

| Script | Description |
|---|---|
| `npm start` | Start server from compiled JS |
| `npm run dev` | Start with ts-node (development) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm test` | Run filter engine tests (18 tests) |
| `npm run seed` | Insert ~100 seed contacts |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:migrate:undo` | Rollback all migrations |

---

## Architecture

```
src/
├── controllers/
│   ├── Audience.ts     — Segment audience resolution + template preview
│   ├── Campaign.ts     — Campaign CRUD
│   ├── Canvas.ts       — Canvas persistence (transactional)
│   └── Contact.ts      — Contact CRUD + pagination/search/filters
├── helpers/
│   ├── BuildWhereClause.ts        — Dynamic SQL filter engine
│   ├── BuildWhereClause.test.ts   — 18 unit tests
│   └── resolveTemplate.ts         — {{name}}/{{country}}/{{city}} resolver + XSS sanitizer
├── models/
│   ├── mysql/
│   │   ├── Associations.ts
│   │   ├── Campaign.ts
│   │   ├── CanvasEdge.ts
│   │   ├── CanvasNode.ts
│   │   └── Contact.ts
│   ├── config.ts
│   └── server.ts
├── routes/
│   ├── Audience.ts
│   ├── Campaign.ts
│   └── Contact.ts
├── db/
│   ├── connection.ts
│   └── sequelize-config.js
├── webhook.ts      — Backend auto-deploy via GitHub webhook
├── FEwebhook.ts    — Frontend auto-deploy via GitHub webhook
└── seed.ts
migrations/
├── 20240101000001-create-contacts.js
├── 20240101000002-create-campaigns.js
├── 20240101000003-create-canvas-nodes.js
└── 20240101000004-create-canvas-edges.js
```

---

## Database schema

### Contacts
| Field | Type | Notes |
|---|---|---|
| id | VARCHAR(36) PK | UUID |
| first_name | VARCHAR(255) | Required |
| last_name | VARCHAR(255) | Required |
| phone | VARCHAR(50) | Format validated (`/^\+?[\d\s\-(). ]{6,20}$/`) |
| email | VARCHAR(255) | Unique, format validated |
| country | VARCHAR(100) | Indexed |
| city | VARCHAR(100) | — |
| status | ENUM('ACTIVE','INACTIVE') | Indexed |
| attributes | JSON | Dynamic fields (age, plan, last_purchase_days, etc.) |
| created_at | DATETIME | Indexed |
| deleted_at | DATETIME | Soft delete via Sequelize `paranoid` |

### Campaigns
| Field | Type | Notes |
|---|---|---|
| id | VARCHAR(36) PK | UUID |
| name | VARCHAR(255) | Required |
| description | TEXT | Optional |
| status | ENUM('draft','active') | Indexed |
| created_at | DATETIME | Indexed |
| deleted_at | DATETIME | Soft delete via Sequelize `paranoid` |

### CanvasNodes
`id`, `campaign_id` (FK → Campaigns), `type` ENUM('segment','sms'), `x`, `y`, `config` (JSON), `created_at`

### CanvasEdges
`id`, `campaign_id` (FK → Campaigns), `source_node_id` (FK → CanvasNodes), `target_node_id` (FK → CanvasNodes), `created_at`

---

## API endpoints

### Contacts
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/contacts` | Paginated list with search and filters |
| `POST` | `/api/contacts` | Create — 201 / 409 on duplicate email |
| `PUT` | `/api/contacts/:id` | Update |
| `DELETE` | `/api/contacts/:id` | Soft delete |

Query params for `GET /api/contacts`:
- `page` (default: 1), `pageSize` (default: 20, max: 100)
- `search` — matches first_name, last_name, email
- `country`, `status`
- `created_after` — ISO date string (e.g. `2025-04-26`), filters contacts created on or after that date

### Campaigns
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/campaigns` | Paginated list with search/status filter |
| `POST` | `/api/campaigns` | Create |
| `GET` | `/api/campaigns/:id` | Get with full canvas (nodes + edges) |
| `PUT` | `/api/campaigns/:id` | Update |
| `DELETE` | `/api/campaigns/:id` | Delete |
| `PUT` | `/api/campaigns/:id/canvas` | Save canvas (atomic transaction) |

`GET /api/campaigns` includes a `node_count` virtual field per campaign computed via subquery.

### Segments
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/segments/:id/audience` | Resolve dynamic filters, return matching contacts |

**Request body:** filter tree (see filter engine section). Falls back to the segment node's stored config if body is empty.

Optional field `preview_message` (string): if provided, the response includes `preview_messages` — an array of up to 3 resolved messages where `{{name}}`, `{{country}}`, and `{{city}}` are substituted with real contact data and sanitized against XSS.

```json
{
  "op": "AND",
  "conditions": [...],
  "preview_message": "Hola {{name}}, tienes una oferta en {{country}}"
}
```

Response:
```json
{
  "count": 42,
  "contacts": [...],
  "preview_messages": ["Hola María, tienes una oferta en GT", "..."]
}
```

### Webhooks (CI/CD)
| Method | Path | Description |
|---|---|---|
| `POST` | `/webhook/github-webhook` | Pull + build + restart backend on push to main |
| `POST` | `/fewebhook/github-webhook` | SSH into frontend host + pull + build frontend on push to main |

Both endpoints are registered in GitHub as webhook receivers. On every push to `main` they automate the full deploy pipeline, keeping production always in sync with the repository.

### Response contracts

All list endpoints:
```json
{ "data": [...], "page": 1, "pageSize": 20, "total": 100 }
```

All errors:
```json
{ "error": { "code": "ERROR_CODE", "message": "Human readable message" } }
```

HTTP status codes: `201` create · `400` validation · `404` not found · `409` duplicate email · `500` server error

---

## Dynamic filter engine

`src/helpers/BuildWhereClause.ts` — converts a JSON filter tree into parameterized SQL. User values are **never** concatenated into SQL strings; they always travel as `replacements` (prepared statement parameters).

**Supported operators:** `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`, `contains`

**Supports:** `AND`/`OR` logical groups, nested groups, dynamic JSON attributes (`attributes.age`, `attributes.plan`, etc.)

**Field whitelist:** before the filter tree reaches `buildWhereClause`, the `Audience` controller validates every `field` value against an explicit allowlist (`first_name`, `last_name`, `phone`, `email`, `country`, `city`, `status`, `created_at`) plus the pattern `/^attributes\.[a-zA-Z_][a-zA-Z0-9_]*$/`. Any unlisted field returns `400 INVALID_FILTERS`.

**Example:**
```json
{
  "op": "AND",
  "conditions": [
    { "field": "country", "operator": "eq", "value": "GT" },
    { "field": "status", "operator": "eq", "value": "ACTIVE" },
    {
      "op": "OR",
      "conditions": [
        { "field": "attributes.plan", "operator": "eq", "value": "premium" },
        { "field": "attributes.age", "operator": "gt", "value": 18 }
      ]
    }
  ]
}
```

Run `npm test` — 18 tests covering all operators, nested AND/OR, JSON attribute paths, and SQL injection safety.

---

## Completed levels

| # | Description | Status |
|---|---|---|
| 1 | Secure dynamic filter engine + audience endpoint | ✅ |
| 2 | Canvas persistence with atomic transaction | ✅ |
| 3 | Campaign CRUD + paginated/filterable contact list | ✅ |
| 4 | SMS node config (stored in canvas node `config` JSON) | ✅ |
| 5 | Filter engine tests (18 tests) + ADR.md | ✅ |

**Bonus implemented:**
- B2 · `{{name}}`, `{{country}}`, `{{city}}` resolved via `resolveTemplate.ts` + XSS sanitization ✅

---

## What was left out and why

| Feature | Reason |
|---|---|
| Real SMS sending | Out of scope per spec — message config is stored in `CanvasNode.config` and ready to plug in a provider (Twilio, etc.) |
| Authentication/authorization | Out of scope per spec — can be added as Express middleware (JWT + guard) |
| Multi-tenancy, queues, scheduler | Explicitly out of scope per spec |

See [ADR.md](./ADR.md) for architecture decisions and production improvement roadmap.

The Angular frontend is fully implemented — see `../MVP-Campaign/README.md`.
