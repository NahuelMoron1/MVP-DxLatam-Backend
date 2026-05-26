# Campaign Flow Builder - Technical Challenge

MVP de una plataforma de automatización de campañas con segmentación dinámica y canvas visual.

## Stack

Backend:

- MySQL
- Node JS
- Express
- Sequelize

Frontend (pendiente):

- Angular

---

# Arquitectura del proyecto

src/
├── controllers/
│ ├── Contact.ts
│ ├── Campaign.ts
│ ├── Audience.ts
│ └── Canvas.ts
│
├── routes/
│ ├── Contact.ts
│ ├── Campaign.ts
│ └── Audience.ts
│ └── Canvas.ts
│
├── helpers/
│ └── buildWhereClause.ts
│
├── models/
│ ├── MySQL
│ | ├── Associations.ts
│ | ├── Contact.ts
│ | ├── Campaign.ts
│ | ├── CanvasNode.ts
│ | ├── CanvasEdge.ts
│ ├── config.ts
│ ├── server.ts
│
├── db/
│ └── connection.ts
│
├── seed.ts
└── index.ts

---

# Base de datos

Tablas creadas:

### Contacts

Campos:

- id
- first_name
- last_name
- phone
- email (unique)
- country
- city
- status
- attributes (JSON)
- deleted_at (soft delete)

---

### Campaigns

Campos:

- id
- name
- description
- status

---

### CanvasNodes

Campos:

- id
- campaign_id
- type (segment | sms)
- x
- y
- config (JSON)

---

### CanvasEdges

Campos:

- id
- campaign_id
- source_node_id
- target_node_id

---

# Funcionalidades implementadas

## Contacts CRUD

Endpoints:

GET /contacts  
POST /contacts  
PUT /contacts/:id  
DELETE /contacts/:id

Características:

- validación email
- email único
- soft delete

---

## Campaigns CRUD

Endpoints:

GET /campaigns  
POST /campaigns  
GET /campaigns/:id  
PUT /campaigns/:id  
DELETE /campaigns/:id

---

## Canvas persistence

Endpoint:

PUT /campaigns/:id/canvas

Implementación:

- transacción SQL
- borra nodos y edges previos
- inserta nuevo canvas completo
- operación atómica

---

## Dynamic Filter Engine

Archivo:
helpers/buildWhereClause.ts

Soporta:

- eq
- neq
- gt
- gte
- lt
- lte
- in
- contains

Soporta:

- AND
- OR
- grupos anidados
- atributos dinámicos JSON

Ejemplo:

{
"op": "AND",
"conditions": [
{
"field": "country",
"operator": "eq",
"value": "AR"
},
{
"field": "attributes.age",
"operator": "gt",
"value": 18
}
]
}

Genera SQL parametrizado para evitar SQL injection.

---

## Audience preview

Endpoint:

POST /api/audience/:id/audience

Devuelve:

{
"count": number,
"contacts": []
}

---

# Seed

Generado con:
Faker JS

Comando:

npm run seed

Resultado:

- 100 contactos aleatorios
- múltiples países
- múltiples estados
- atributos dinámicos:
  - age
  - plan
  - last_purchase_days

---

# Testing con Postman

Herramienta:
Postman

## Test 1 — eq

POST /api/audience/1/audience

{
"field":"country",
"operator":"eq",
"value":"AR"
}

Resultado esperado:
count > 0

---

## Test 2 — JSON attribute

{
"field":"attributes.age",
"operator":"gt",
"value":30
}

Resultado esperado:
todos > 30

---

## Test 3 — AND

country = AR
AND
status = ACTIVE

Resultado esperado:
solo argentinos activos

---

## Test 4 — OR

country = GT
OR
country = MX

Resultado esperado:
GT o MX

---

## Test 5 — nested

country = AR
AND
(
plan = premium
OR
age > 50
)

Resultado esperado:
correcto

---

## Test 6 — contains

city contains "Mar"

Resultado esperado:
Mar del Plata

---

## Test 7 — IN

country IN ("AR","GT")

Resultado esperado:
AR y GT

---

## Test 8 — JSON IN

attributes.plan IN ("basic","premium")

Resultado esperado:
basic y premium

---

## Test 9 — empty result

country = "ZZZ"

Resultado esperado:
count = 0

---

## Test 10 — SQL injection

value:
'; DROP TABLE Contacts; --

Resultado esperado:
count = 0
sin romper DB

---

# Decisiones técnicas

1. Sequelize por rapidez de desarrollo.
2. MySQL por soporte nativo JSON.
3. Soft delete usando paranoid.
4. JSON attributes para soportar campos dinámicos.
5. SQL parametrizado para seguridad.
6. Canvas persistido en tablas separadas:
   - CanvasNodes
   - CanvasEdges

---

# Próximo paso

Implementación frontend con Angular:

- listado campaigns
- listado contacts
- canvas drag & drop
- configuración de nodos
- persistencia visual
