# TaskFlow — Engineering Take-Home Assignment
### Mid-level Engineer · Full Stack / Frontend / Backend

## 📸 Implementation Preview (Original App Screenshots)
| **"Eco-Obsidian" Login** | **Biophilic Dashboard** |
| :---: | :---: |
| ![Login View](./screenshots/login-view.png) | ![Green Mode Dashboard](./screenshots/green-mode.png) |
| **Project Detail View** | **Mobile Floating Navigation** |
| ![Project Detail](./screenshots/project-detail.png) | ![Mobile Layout](./screenshots/mobile-view.png) |

---

## 🚀 Running Locally
Assume you have Docker installed:

```bash
# 1. Start the Environment
docker compose up --build -d

# 2. Seed the Indian Vanguard Team
docker exec -i [db-container-id] psql -U taskflow -d taskflow < backend/seed.sql
```

**Test Credentials:**
* **Email**: `test@example.com`
* **Password**: `password123`

---

## 🌿 The "UI Genius" Architecture
This implementation delivers a high-performance **Biophilic Glassmorphism** experience for the Zomato Greening India Initiative.
- **Tri-State Theme Engine**: Support for Greening India (Emerald), Obsidian Night, and Zomato Day.
- **Mobile Floating Pill**: Ergonomic theme controls pinned to bottom-center for zero brand overlap.
- **Holographic Vitality Core**: Real-time project health visualization.

---

## 📝 Original Instructions

### Overview
You're building TaskFlow — a minimal but real task management system. Users can register, log in, create projects, add tasks to those projects, and assign tasks to themselves or others.

This is not a to-do app demo. It's a small product with authentication, relational data, a REST API, and a polished UI. Scope is intentionally constrained so you can ship something complete.

On AI tools: Cursor, Copilot, and ChatGPT are permitted. We evaluate the quality of your decisions, not the volume of your code. A project with thoughtful architecture and honest tradeoffs outranks boilerplate AI output every time. Be prepared to discuss every part of your submission on a follow-up call.

### Who Builds What
Role	Backend (Go)	Frontend (React)	Docker + README
Full Stack Engineer	✅ Required	✅ Required	✅ Required
Backend Engineer	✅ Required	❌ Not required — include a Postman/Bruno collection or test suite instead	✅ Required
Frontend Engineer	❌ Not required — build against the mock API spec in Appendix A	✅ Required	✅ Required

### The Data Model
Design your schema around these entities. You may add fields, but do not remove any required ones.

**User**
  - id          uuid, primary key
  - name        string, required
  - email       string, unique, required
  - password    string, hashed (bcrypt), required
  - created_at  timestamp

**Project**
  - id          uuid, primary key
  - name        string, required
  - description string, optional
  - owner_id    uuid → User
  - created_at  timestamp

**Task**
  - id          uuid, primary key
  - title       string, required
  - description string, optional
  - status      enum: todo | in_progress | done
  - priority    enum: low | medium | high
  - project_id  uuid → Project
  - assignee_id uuid → User, nullable
  - due_date    date, optional
  - created_at  timestamp
  - updated_at  timestamp

Use PostgreSQL. Schema must be managed via migrations — not auto-migrate or ORM magic.

### Backend Requirements
Required for: Full Stack and Backend roles Language: Go (preferred).

**Authentication**
- Passwords must be hashed with bcrypt (cost ≥ 12)
- JWT expiry: 24 hours. Include user_id and email in claims.
- All non-auth endpoints require Authorization: Bearer <token>

**Projects API**
- GET	/projects	List projects the current user owns or has tasks in
- POST	/projects	Create a project (owner = current user)
- GET	/projects/:id	Get project details + its tasks
- PATCH	/projects/:id	Update name/description (owner only)
- DELETE	/projects/:id	Delete project and all its tasks (owner only)

**Tasks API**
- GET	/projects/:id/tasks	List tasks — support ?status= and ?assignee= filters
- POST	/projects/:id/tasks	Create a task
- PATCH	/tasks/:id	Update title, description, status, priority, assignee, due_date
- DELETE	/tasks/:id	Delete task (project owner or task creator only)

### Frontend Requirements
Required for: Full Stack and Frontend roles Framework: React (with TypeScript strongly preferred)

**UX & State**
- Use React Router for navigation
- Auth state must persist across page refreshes (localStorage or equivalent)
- Protected routes: redirect to /login if unauthenticated
- Loading and error states must be visible
- Optimistic UI for task status changes

**Design & Polish**
- Responsive: must work at 375px (mobile) and 1280px (desktop) widths
- No broken layouts, no console errors in the production build
- Sensible empty states

### Infrastructure Requirements
- **Docker**: docker-compose.yml must spin up the full stack.
- **Migrations**: Migrations must run automatically on container start.
- **Seed Data**: Include test credentials (test@example.com / password123).

---
*Created for the Zomato Engineering Take-Home.*
