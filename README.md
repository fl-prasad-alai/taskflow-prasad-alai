# Vanguard TaskFlow
### High-Performance Engineering | Pure Class Aesthetic

Vanguard TaskFlow is a next-gen productivity ecosystem designed with a "Pure Class" aesthetic inspired by the design languages of Apple and Tesla. It provides a fluid, device-agnostic experience for managing elite engineering workflows.

---

## 1. Overview
TaskFlow is a premium task management system that enables authentication, project staging, and granular task orchestration. It is built to demonstrate high-performance full-stack engineering with a focus on visual excellence and resilient architecture.

| Layer | Technology |
| :--- | :--- |
| **Backend** | Go 1.22 · Chi Router · pgx/v5 · Native Bcrypt Hashing |
| **Frontend** | React 18 · TypeScript · Vite · Framer Motion · Tailwind CSS |
| **Database** | PostgreSQL 16 (Optimized for UUID) |
| **Design Style** | Hyper-Glass UI · Liquid Mesh Backgrounds · Outfit Typography |
| **Auth** | JWT (HS256) · Native Go-Generated Bcrypt (Cost 12) |

---

## 2. Architecture Decisions

### Backend: Zero-Trust Reliability
*   **Native Go Seeding**: Unlike standard assignments that use external SQL dumps, Vanguard TaskFlow performs its own data seeding directly in the Go runtime. This ensures 100% hashing compatibility and "self-healing" data restoration on every boot.
*   **Resilient Store Loop**: The database connection implements a 10-attempt loop with a fixed 2-second delay. This explicitly avoids "Unhealthy" container states caused by race conditions during PostgreSQL initialization.
*   **Embedded Migrations**: SQL migrations are compiled into the Go binary via `//go:embed`. This removes the need for external migration tools or manual schema steps.

### Frontend: Pure Class Design
*   **Hyper-Glass UI**: Utilizing high-threshold `backdrop-blur` and vibrant liquid mesh backgrounds to create a premium, state-of-the-art interface.
*   **Mobile Responsive Stack**: Transitions from a cinematic side-by-side desktop layout to an optimized vertical stack at 375px (mobile) without losing visual fidelity.
*   **Performance Optimization**: The background mesh is memoized via `React.memo` and expensive rim-light effects are conditionally disabled on touch-based devices to maintain 120Hz fluidity.

### Tradeoffs & Omissions
*   **Local Storage Auth**: Session state is persisted in `localStorage` for simplicity. In a production-grade enterprise app, we would migrate to `HttpOnly` cookie-based refresh tokens.
*   **Single-Origin CORS**: Currently locked to the frontend container; a production environment would utilize a dynamic allow-list.

---

## 3. Running Locally
To spin up the entire ecosystem with a single command:

```bash
# 1. Clone & Enter
git clone https://github.com/your-name/taskflow-vanguard
cd taskflow-vanguard

# 2. Setup Environment
cp .env.example .env

# 3. Total Reset & Start (Ensures fresh hashed data)
docker compose down -v && docker compose up --build
```

*   **Frontend**: [http://localhost:3000](http://localhost:3000)
*   **API Engine**: [http://localhost:8080](http://localhost:8080)

---

## 4. Running Migrations
Migrations are **atomic and automatic**. They execute within the Go startup sequence before the server opens its listening port. There are no manual steps required.

---

## 5. Test Credentials (Indian Vanguard Squad)
The system is pre-seeded with an elite engineering team. All users share the password: **`password123`**.

| Name | Role | Email |
| :--- | :--- | :--- |
| **Arjun Mehta** | Lead | `test@example.com` |
| **Priya Sharma** | Design | `priya@example.com` |
| **Ishaan Malhotra** | Backend | `ishaan@example.com` |

---

## 6. API Reference (Core Endpoints)

### Auth Flow
*   `POST /auth/register`: Create new user.
*   `POST /auth/login`: Returns JWT + User Profile.

### Project Orchestration
*   `GET /projects`: List accessible projects.
*   `GET /projects/:id`: Get project details + associated tasks.
*   `GET /projects/:id/stats`: Returns task counts by status/assignee (Bonus feature).

### Task Management
*   `POST /projects/:id/tasks`: Create task.
*   `PATCH /tasks/:id`: Update title, status, or assignment.
*   `DELETE /tasks/:id`: Remove task (Owner/Creator only).

---

## 7. What I'd Do With More Time
1.  **Kanban Transitions**: Implement `dnd-kit` for fluid drag-and-drop task movement between status columns.
2.  **Holographic SSE**: Implement Server-Sent Events for real-time multi-user task sync without polling.
3.  **Advanced Health Core**: Expand the "Crimson State" logic to include project velocity and resource heatmaps.
4.  **Security Hardening**: Implement rate-limiting and CSRF protection on all public-facing auth routes.
