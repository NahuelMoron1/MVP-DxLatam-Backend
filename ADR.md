# ADR-lite — Campaign Flow Builder

## 1. Librería de canvas (frontend)

**Decisión:** `@foblex/flow`

Angular-native, compatible con standalone components y Signals (v17+). Evita wrappers sobre librerías JS vanilla y expone una API declarativa que encaja con el estado reactivo del frontend.

Alternativas descartadas: jsPlumb (requiere wrapper manual, sin tipos Angular), rete.js (API más compleja, comunidad chica), Angular CDK + SVG custom (viable pero mayor costo de desarrollo en 2 días).

---

## 2. Modelado de atributos dinámicos

**Decisión:** columna `attributes JSON` en la tabla `Contacts`

Los atributos son arbitrarios por diseño — no hay esquema fijo. MySQL soporta JSON nativo con `JSON_EXTRACT` y `JSON_UNQUOTE`, lo que permite filtrar valores dinámicos sin columnas adicionales ni migraciones por cada nuevo atributo.

Trade-off aceptado: no hay type-safety a nivel DB y los índices sobre JSON son parciales. En producción, si ciertos atributos se estabilizan (ej. `age`, `plan`), migrarlos a columnas propias con índices B-tree es la mejora natural.

---

## 3. Prevención de inyección SQL

**Decisión:** SQL parametrizado con `?` placeholders vía `db.query(sql, { replacements })`

El motor de filtros (`buildWhereClause.ts`) construye el árbol WHERE recursivamente pero **nunca concatena valores del usuario al string SQL**. Todos los valores van como `replacements`, que Sequelize pasa al driver MySQL como prepared statements.

El riesgo residual es el campo `field` del filtro (nombre de columna), que actualmente se interpola directamente. Para producción: agregar whitelist de campos permitidos en el endpoint de audiencia antes de llamar a `buildWhereClause`.

Los tests en `BuildWhereClause.test.ts` verifican explícitamente que inputs maliciosos quedan en `replacements` y no en el string SQL.

---

## 4. ORM: Sequelize

**Decisión:** Sequelize v6 sobre Knex o Prisma

Motivos: madurez probada con MySQL, `paranoid: true` para soft delete nativo, transacciones simples con rollback automático, y familiaridad que reduce tiempo de desarrollo en una ventana de 2 días.

Knex habría dado más control sobre el SQL dinámico pero mayor boilerplate. Prisma tiene mejor DX pero su soporte para queries raw con placeholders dinámicos (necesario para el motor de filtros) requiere más workarounds.

---

## 5. Persistencia del canvas en tablas separadas

**Decisión:** `CanvasNodes` + `CanvasEdges` como tablas relacionales, no un JSON plano por campaña

Permite integridad referencial, consultas por tipo de nodo, y base para analítica futura (ej. cuántas campañas usan segmentos con cierto filtro). El guardado es atómico via transacción: se eliminan edges y nodos previos, luego se insertan los nuevos en bloque.

---

## 6. Mejoras para producción (fuera del alcance del MVP)

| Área | Mejora |
|---|---|
| Seguridad | Whitelist de campos en filtros dinámicos |
| Seguridad | Rate limiting en `POST /segments/:id/audience` (query costosa) |
| Seguridad | Autenticación JWT en todos los endpoints |
| Performance | Índices JSON funcionales sobre `attributes.plan`, `attributes.age` |
| Performance | Caché Redis (TTL breve) para audiencias de segmentos grandes |
| Operación | Migraciones versionadas con Sequelize CLI en lugar del `.sql` plano |
| Operación | Paginación en el endpoint de audiencia (actualmente devuelve todos los contactos) |
| Escalabilidad | Cola de trabajos (BullMQ) para resolver audiencias grandes de forma asíncrona |
