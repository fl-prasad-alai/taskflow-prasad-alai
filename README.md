# TaskFlow — Engineering Take-Home Assignment
### Mid-level Engineer · Full Stack / Frontend / Backend

## 📸 Implementation Preview (The "Biophilic Vanguard")

### 🖥️ Desktop Experience (Dual-Theme Orchestration)
| **"Greening India" (Emerald Mode)** | **"Obsidian Night" (Dark Mode)** |
| :--- | :--- |
| ![Green Mode Dashboard](./screenshots/green-mode.png) | ![Dark Mode Dashboard](./screenshots/dark-mode.png) |
| ![Green Mode Detail](./screenshots/project-detail.png) | ![Dark Mode Detail](./screenshots/dark-mode-detail.png) |

### 📱 Mobile & Micro-Interactions
| **Ergonomic Floating Pill** | **Eco-Obsidian Login** | **Tri-State Glow Capsule** |
| :---: | :---: | :---: |
| ![Mobile Layout](./screenshots/mobile-view.png) | ![Login View](./screenshots/login-view.png) | ![Toggle Close-up](./screenshots/toggle-capsule.png) |

### 🎬 Holographic Walkthrough
A dynamic preview of the Biophilic Vanguard ecosystem, showcasing seamless theme transitions and project orchestration.
![Vanguard Demo Walkthrough](./screenshots/demo-recording.webp)

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
- **Tri-State Theme Engine**: Seamlessly switch between Greening India (Emerald), Obsidian Night, and Zomato Day.
- **Mobile Floating Pill**: Ergonomic theme controls pinned to bottom-center for zero brand overlap on mobile devices.
- **Holographic Vitality Core**: Adaptive visualization of project health and team velocity.

---

## 📝 Original Instructions

### Overview
You're building TaskFlow — a minimal but real task management system. Users can register, log in, create projects, add tasks to those projects, and assign tasks to themselves or others.

This is not a to-do app demo. It's a small product with authentication, relational data, a REST API, and a polished UI. Scope is intentionally constrained so you can ship something complete.

On AI tools: Cursor, Copilot, and ChatGPT are permitted. We evaluate the quality of your decisions, not the volume of your code. A project with thoughtful architecture and honest tradeoffs outranks boilerplate AI output every time. Be prepared to discuss every part of your submission on a follow-up call.

### Who Builds What
Role	Backend (Go)	Frontend (React)	Docker + README
Full Stack Engineer	✅ Required	✅ Required	✅ Required

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
- **Authentication**: Bcrypt (cost 12), JWT (24h expiry), zero-trust bearer token protection.
- **Projects & Tasks API**: Full CRUD orchestration with specific status/assignee filtering.

### Frontend Requirements
- **UX & State**: Persistent theme/auth, Protected routes, Optimistic UI updates.
- **Design**: Biophilic Glassmorphism, 120Hz calibration, fully responsive (375px to 1280px).

### Infrastructure Requirements
- **Docker**: Full stack containerization with multi-stage builds.
- **Migrations**: Automated atomic schema management on container boot.

---
*Created with "UI Genius" specifications for the Zomato Engineering Take-Home.*
