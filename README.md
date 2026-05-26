# Campaign Flow Builder — Backend API

MVP of a campaign automation platform with dynamic contact segmentation and visual flow canvas.

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
│   ├── Audience.ts     — Segment audience resolution
│   ├── Campaign.ts     — Campaign CRUD
│   ├── Canvas.ts       — Canvas persistence (transactional)
│   └── Contact.ts      — Contact CRUD + pagination/search/filters
├── helpers/
│   └── BuildWhereClause.ts   — Dynamic SQL filter engine
│   └── BuildWhereClause.test.ts
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
`id`, `name`, `description`, `status` (draft/active), `created_at`, `deleted_at`

### CanvasNodes
`id`, `campaign_id` (FK), `type` (segment/sms), `x`, `y`, `config` (JSON)

### CanvasEdges
`id`, `campaign_id` (FK), `source_node_id` (FK → CanvasNodes), `target_node_id` (FK → CanvasNodes)

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

### Segments
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/segments/:id/audience` | Resolve dynamic filters, return matching contacts |

Body: filter tree (see filter engine section). Falls back to the segment node's stored config if body is empty.

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

---

## What was left out and why

| Feature | Reason |
|---|---|
| Real SMS sending | Out of scope per spec — message config is stored in `CanvasNode.config` and ready to plug in a provider (Twilio, etc.) |
| Authentication/authorization | Out of scope per spec — can be added as Express middleware (JWT + guard) |
| `{{name}}` dynamic variables in SMS | Bonus B2, not required for the core |
| Multi-tenancy, queues, scheduler | Explicitly out of scope per spec |
| Field whitelist in audience endpoint | Documented as production improvement in ADR — acceptable for MVP |

See [ADR.md](./ADR.md) for architecture decisions and production improvement roadmap.

The Angular frontend is fully implemented — see `../MVP-Campaign/README.md`.
