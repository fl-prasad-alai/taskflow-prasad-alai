# TaskFlow

A minimal but complete task management system with authentication, projects, and tasks.

---

## 1. Overview

TaskFlow lets users register, log in, create projects, add tasks to those projects, and assign tasks to themselves or teammates.

| Layer     | Technology                                              |
|-----------|---------------------------------------------------------|
| Backend   | Go 1.22 · chi router · pgx/v5 · golang-migrate          |
| Frontend  | React 18 · TypeScript · Vite · TanStack Query · Tailwind CSS |
| Database  | PostgreSQL 16                                           |
| Component lib | Radix UI primitives + Tailwind CSS (custom components) |
| Auth      | JWT (HS256, 24-hour expiry) · bcrypt cost 12            |

---

## 2. Architecture Decisions

### Backend

**Layered structure without an ORM**
The backend is split into `config → store → auth → handler → middleware`. SQL is written by hand using `pgx/v5`. No ORM was used — the schema is simple enough that raw SQL is faster to write and easier to review, and it avoids the "magic" that makes debugging harder in take-home contexts.

**Embedded migrations**
Migration SQL files are embedded in the binary via `//go:embed`. The server runs `migrate.Up()` at startup with an idempotent no-op if there is nothing to do. This means there is literally zero manual step required to set up the schema.

**Store retry loop**
`store.New()` retries the database connection up to 10 times (with linear back-off). This handles the inevitable race between the Go container starting and PostgreSQL being ready, without needing a `wait-for-it.sh` script.

**Optimistic partial updates**
`PATCH /tasks/:id` accepts a raw `map[string]json.RawMessage` so it can distinguish "field absent" (keep existing value) from "field sent as null" (clear the value). This is the correct REST PATCH behaviour and it avoids overwriting fields the client did not touch.

**Users endpoint**
A `GET /users` endpoint returns all users (id, name, email) so the frontend can populate the assignee picker. In a real product this would be scoped to project members; the simplification is noted below.

**Tradeoffs / omissions**
- No refresh tokens — the 24-hour JWT is the only token. A production system would add short-lived access tokens plus refresh tokens in HttpOnly cookies.
- No rate-limiting on auth endpoints.
- `GET /users` returns all users instead of scoping to project members. Acceptable for a small team tool; would need RLS or a members table at scale.
- CORS origin is a single allowed origin; a production setup would allow a list.

### Frontend

**TanStack Query for server state**
All remote data lives in the query cache. Mutations call `invalidateQueries` on success so the UI always reflects the latest server state. Optimistic updates are used for task status changes: the cache is updated immediately and reverted if the API call fails.

**Auth in localStorage**
The JWT and user object are persisted in `localStorage` so the session survives page refreshes. The tradeoff vs. HttpOnly cookies is XSS exposure; accepted here for simplicity — noted as a "more time" item.

**Relative API URLs + proxy**
All `fetch()` calls use relative paths (`/auth/login`, `/projects`, etc.). Vite's dev server proxies these to `http://localhost:8080`. In production (Docker), nginx does the same proxy. This means no base-URL config is required — the same build artifact works in both environments.

**Component library choice**
Custom components built on Tailwind CSS + a small set of Radix UI primitives (no full framework). This avoids the heavyweight setup that shadcn/ui requires via its CLI, while still using accessible, headless primitives where needed.

---

## 3. Running Locally

**Prerequisites:** Docker Desktop (or Docker Engine + Compose plugin). Nothing else.

```bash
git clone https://github.com/your-name/taskflow
cd taskflow
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:3000
- API:      http://localhost:8080

The backend runs migrations automatically on start. The `seed` service loads test data once the API is healthy.

---

## 4. Running Migrations

Migrations are **automatic** — they run inside the Go binary every time the backend starts. There is no manual step.

To roll back manually (if needed):

```bash
# Install golang-migrate CLI
brew install golang-migrate   # macOS

# Roll back one migration
migrate -path ./backend/migrations \
        -database "postgres://taskflow:changeme@localhost:5432/taskflow?sslmode=disable" \
        down 1
```

---

## 5. Test Credentials

The seed job creates three users, all with the same password:

| Name       | Email                | Password    |
|------------|----------------------|-------------|
| Test User  | test@example.com     | password123 |
| Alice Smith| alice@example.com    | password123 |
| Bob Jones  | bob@example.com      | password123 |

Log in immediately at http://localhost:3000/login with `test@example.com` / `password123`.

The seed also creates one project ("Website Redesign") with three tasks in different statuses.

---

## 6. API Reference

All endpoints (except `/auth/*`) require `Authorization: Bearer <token>`.

### Auth

```
POST /auth/register
Body: { "name": "Jane", "email": "jane@example.com", "password": "secret123" }
201:  { "token": "...", "user": { "id", "name", "email", "created_at" } }
400:  { "error": "validation failed", "fields": { "email": "is required" } }

POST /auth/login
Body: { "email": "jane@example.com", "password": "secret123" }
200:  { "token": "...", "user": { ... } }
401:  { "error": "invalid credentials" }
```

### Users

```
GET /users
200: { "users": [{ "id", "name", "email" }, ...] }
```

### Projects

```
GET    /projects            → 200 { "projects": [...] }
POST   /projects            → 201 project object
GET    /projects/:id        → 200 project + tasks
PATCH  /projects/:id        → 200 updated project   (owner only)
DELETE /projects/:id        → 204                   (owner only)
GET    /projects/:id/stats  → 200 { total, by_status, by_assignee }
```

### Tasks

```
GET    /projects/:id/tasks?status=todo&assignee=<uuid>  → 200 { "tasks": [...] }
POST   /projects/:id/tasks                              → 201 task object
PATCH  /tasks/:id                                       → 200 updated task
DELETE /tasks/:id                                       → 204  (owner or creator)
```

**Task object shape:**
```json
{
  "id": "uuid",
  "title": "Design homepage",
  "description": "...",
  "status": "in_progress",
  "priority": "high",
  "project_id": "uuid",
  "assignee_id": "uuid",
  "assignee": { "id": "uuid", "name": "Alice", "email": "alice@example.com" },
  "created_by": "uuid",
  "due_date": "2026-04-15",
  "created_at": "2026-04-01T10:00:00Z",
  "updated_at": "2026-04-09T15:30:00Z"
}
```

**Error shape (all non-2xx):**
```json
{ "error": "not found" }
{ "error": "validation failed", "fields": { "title": "is required" } }
```

---

## 7. What I'd Do With More Time

**Security**
- Replace single long-lived JWT with short-lived access tokens + HttpOnly refresh token cookies. The current localStorage approach is vulnerable to XSS.
- Add rate-limiting on `/auth/register` and `/auth/login` to prevent brute-force.
- CORS allow-list instead of single origin.

**Product features**
- Drag-and-drop to reorder tasks or move them between status columns (Kanban view).
- Real-time task updates via Server-Sent Events — the backend already handles concurrent DB access safely so this would mainly be a SSE handler + `EventSource` on the frontend.
- Dark mode (Tailwind `dark:` classes are already available, just needs a toggle that writes to `localStorage`).
- Pagination on list endpoints (the backend already has `ListTasksFilter.Page/Limit` plumbed — just need to wire up the UI).
- Project members concept — right now `GET /users` returns everyone. A `project_members` join table would scope the assignee picker properly.
- Task comments / activity log.

**Code quality**
- Integration tests for the auth and task flows (I'd use `testcontainers-go` to spin up a real PostgreSQL instance per test run).
- Frontend E2E tests with Playwright covering the happy path.
- Move validation into a dedicated package / use a validation library to reduce repetition in handlers.
- `created_by` is stored but not exposed on the task's response object in a human-readable form. Would add `creator: { id, name }` analogous to `assignee`.

**Operations**
- Structured request/response logging with correlation IDs for tracing.
- `/healthz` and `/readyz` endpoints for Kubernetes probes.
- Docker image pinning (currently using `golang:1.22-alpine` floating tag).
- CI pipeline (GitHub Actions): lint → test → build → push image.
