# Architecture Protocol
## System design, data modeling, and API design

---

## Phase 1 — Requirements Clarification

Before designing anything:

1. **Functional requirements**: What must the system do? (Verbs: store, retrieve, process, notify)
2. **Non-functional requirements**: Performance targets, availability SLA, consistency requirements, scale targets
3. **Constraints**: Technology stack, team skills, budget, time, existing systems to integrate with
4. **Unknowns**: What will you need to decide later that you can't decide now?

---

## Phase 2 — Data Modeling First

Data modeling is the most important architectural decision. Get this right.

1. Identify the core entities (the nouns in the domain)
2. Define the relationships: one-to-one, one-to-many, many-to-many
3. Define the cardinality and optionality of each relationship
4. Identify the natural key (business identifier) vs. surrogate key (system identifier) for each entity
5. Identify which data is mutable vs. immutable
6. Identify data that needs history / audit trail
7. Choose the storage model appropriate for the data shape:

| Data Shape | Storage Model |
|-----------|--------------|
| Structured, relational | Relational DB (Postgres, MySQL) |
| Documents, flexible schema | Document DB (MongoDB, Firestore) |
| Key-value, simple lookups | Redis, DynamoDB |
| Time series | TimescaleDB, InfluxDB |
| Graph relationships | Neo4j, or adjacency list in relational DB |
| Files / blobs | Object storage (S3, GCS) |

---

## Phase 3 — Interface Design

### API Design Principles
1. Design APIs for the caller's use case, not the implementer's convenience
2. Resources should be nouns, actions should be verbs on resources (REST)
3. Be consistent: naming, error formats, pagination, authentication — same everywhere
4. Version from day one if the API is public
5. Design for evolvability: additive changes are safe, breaking changes are not

### REST API Design
```
GET    /resources          → list (paginated)
GET    /resources/:id      → get one
POST   /resources          → create
PUT    /resources/:id      → replace
PATCH  /resources/:id      → partial update
DELETE /resources/:id      → delete

Nested: GET /users/:id/orders → orders belonging to user
Filter: GET /orders?status=pending&after=2024-01-01
```

### Error Response Standard
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "User with ID 123 was not found",
    "details": {}
  }
}
```

### Event-Driven Design
- Events represent facts that happened (past tense: `OrderPlaced`, `UserCreated`)
- Events are immutable after emission
- Consumers are decoupled from producers — they don't need to know about each other
- Event schema must be versioned and backwards-compatible

---

## Phase 4 — Component Architecture

### Layered Architecture (most common)
```
Presentation Layer    (HTTP handlers, GraphQL resolvers, CLI)
    ↓
Service / Use-Case Layer    (business logic, orchestration)
    ↓
Domain Layer    (entities, value objects, domain rules)
    ↓
Infrastructure Layer    (DB, cache, email, storage, external APIs)
```

Rules:
- Each layer only depends on the layer below it
- Domain layer has zero external dependencies
- Infrastructure layer is behind interfaces — swap implementations without changing business logic

### Module Boundaries
1. Group by domain/feature, not by technical layer
2. Define explicit public interfaces between modules
3. Minimize cross-module dependencies
4. Circular dependencies = design problem

---

## Phase 5 — Scalability Design

Only design for scale you can justify with real requirements.

| Concern | Solution |
|---------|---------|
| Read-heavy load | Read replicas, caching, CDN |
| Write-heavy load | Write-ahead log, event sourcing, queue buffering |
| CPU-bound processing | Horizontal scaling, worker pools |
| Large data volumes | Sharding, partitioning, archiving |
| High availability | Redundancy, health checks, graceful degradation |
| Global distribution | Multi-region, edge caching, data residency compliance |

### Caching Strategy
1. Cache at the right level: CDN → application cache → DB query cache
2. Define cache invalidation: time-based (TTL) or event-based
3. Plan for cache stampede on expiry (use staggered TTLs or locking)
4. Never cache security-sensitive data without careful access control

---

## Phase 6 — Security Architecture

1. **Authentication**: Who is making the request? (JWT, sessions, OAuth)
2. **Authorization**: What are they allowed to do? (RBAC, ABAC, policy engines)
3. **Data isolation**: Multi-tenant data — is row-level security enforced?
4. **Encryption**: In transit (TLS), at rest (encrypted columns/volumes for PII)
5. **Input validation**: At the boundary — reject before processing
6. **Secrets management**: Never in code or config files — use secret stores (Vault, AWS Secrets Manager)
7. **Rate limiting**: Prevent abuse at the API gateway or service level
8. **Audit logging**: Who did what, when, to which resource

---

## Architecture Decision Record (ADR) Format

For every significant architectural decision, document:

```markdown
## Context
What situation led to this decision?

## Options Considered
1. Option A — pros/cons
2. Option B — pros/cons
3. Option C — pros/cons

## Decision
We chose Option B because...

## Consequences
- What gets easier
- What gets harder
- What we're giving up
```

---

## Warning Signs in Architecture

| Signal | Problem |
|--------|---------|
| Everything calls everything | No layer boundaries — spaghetti architecture |
| Can't deploy one service without another | Wrong service boundaries |
| DB schema changes require all teams to coordinate | Too much coupling through the database |
| Business logic in the API handler | Missing service/domain layer |
| Duplicated business logic across services | Missing shared domain model |
| Config in code | Deployment inflexibility |
| No versioning on public APIs | Breaking changes will happen |
