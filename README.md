# TaskForge (Takify) 🚀

<p align="center">
    <img alt="License" src="https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge">
    <img alt="Frontend" src="https://img.shields.io/badge/Frontend-React%2018-38bdf8?style=for-the-badge&logo=react&logoColor=white">
    <img alt="Backend" src="https://img.shields.io/badge/Backend-Django%204.2-166534?style=for-the-badge&logo=django&logoColor=white">
    <img alt="API" src="https://img.shields.io/badge/API-DRF-f97316?style=for-the-badge">
    <img alt="Database" src="https://img.shields.io/badge/Database-PostgreSQL-0ea5e9?style=for-the-badge&logo=postgresql&logoColor=white">
    <img alt="Build Tool" src="https://img.shields.io/badge/Build-Vite%205-a855f7?style=for-the-badge&logo=vite&logoColor=white">
</p>

<p align="center">
    <b>Plan smarter. Collaborate faster. Ship work with confidence.</b>
</p>

TaskForge is a full-stack team collaboration and project management platform built with React + Django REST Framework.
It supports multi-workspace organization, role-based collaboration, project/task tracking, drag-and-drop Kanban flows, comments, subtasks, and analytics.

This README is intentionally comprehensive so new contributors can understand the architecture and run the project end-to-end without reverse-engineering the codebase.

> [!NOTE]
> This is a production-oriented monorepo with a React SPA frontend and a Django REST backend. The backend currently runs locally, while frontend local startup may require dependency cleanup if npm fails.

## 🌐 Live URLs

- Frontend: https://www.task-forge.kandhal.tech
- API base: https://taskforge-backend-hgre.onrender.com/api

## ⚡ Quick Start Snapshot

| Service | Local URL | Command |
|---|---|---|
| Backend API | http://localhost:8000 | python manage.py runserver |
| Frontend App | http://localhost:5173 | npm run dev |

## 🧭 Navigation

- [Project Overview](#1-project-overview)
- [Feature Set](#2-feature-set)
- [Tech Stack](#3-tech-stack)
- [Repository Structure](#4-repository-structure)
- [System Architecture](#5-system-architecture)
- [Domain Model](#6-domain-model)
- [API Reference](#7-api-reference)
- [Authentication and Authorization](#8-authentication-and-authorization)
- [Local Development Setup](#9-local-development-setup)
- [Environment Variables](#10-environment-variables)
- [Build and Deployment](#11-build-and-deployment)
- [Troubleshooting](#12-troubleshooting)
- [Security Notes](#13-security-notes)
- [Roadmap Ideas](#14-roadmap-ideas)
- [License](#15-license)

## Table of Contents

1. Project Overview
2. Feature Set
3. Tech Stack
4. Repository Structure
5. System Architecture
6. Domain Model
7. API Reference
8. Authentication and Authorization
9. Local Development Setup
10. Environment Variables
11. Build and Deployment
12. Troubleshooting
13. Security Notes
14. Roadmap Ideas
15. License

## 1) Project Overview 🏗️

TaskForge is designed around workspaces:

- A user joins one or more workspaces.
- Each workspace contains projects.
- Tasks can belong to a workspace and optionally a project.
- Workspace and project memberships define who can view/edit resources.
- JWT authentication secures all API requests.

The frontend is a single-page app (SPA) powered by Vite and React Router.
The backend exposes a REST API with Django REST Framework and PostgreSQL.

## 2) Feature Set ✨

### Core collaboration features 🤝

- Workspace creation and management
- Workspace invitations and invite response flow (accept/decline)
- Workspace roles: `admin`, `member`, `viewer`
- Project lifecycle support: `active`, `archived`, `completed`
- Project-level member management

### Task management features ✅

- Task CRUD with rich filtering and search
- Kanban-compatible status model
- Drag-and-drop bulk task status/order update endpoint
- Priority levels (`urgent` to `no_priority`)
- Categories scoped by workspace
- Comments on tasks
- Subtasks per task
- Overdue detection logic

### Analytics features 📊

- Task totals and completion rate
- Aggregation by status and priority
- Overdue counts
- Daily task creation series for recent trend visualization

### UX features (frontend) 🎨

- Command palette for fast workspace/project navigation
- Persisted auth state using Zustand middleware
- Automatic token refresh on `401`
- Global loading state handling for API calls
- Responsive app shell with routed pages

## 3) Tech Stack 🧰

### Frontend 🌐

- React 18
- Vite 5
- React Router 6
- Zustand
- Tailwind CSS
- Axios
- DnD Kit (`@dnd-kit/*`)
- Recharts
- React Big Calendar
- Framer Motion
- React Hook Form + Zod

### Backend ⚙️

- Python 3.11+
- Django 4.2
- Django REST Framework
- djangorestframework-simplejwt (JWT + blacklist)
- django-filter
- django-cors-headers
- WhiteNoise
- PostgreSQL driver via `psycopg[binary]`

### Infrastructure and deployment 🚢

- Render (backend)
- Vercel-friendly SPA rewrite config in frontend
- Supabase-hosted PostgreSQL (as configured in settings comments)

## 4) Repository Structure 🗂️

```text
.
|-- backend/
|   |-- apps/
|   |   |-- core/           # Shared pagination and permission classes
|   |   |-- users/          # Custom user model, auth, OTP registration flow
|   |   |-- workspaces/     # Workspace + workspace membership
|   |   |-- projects/       # Project + project membership
|   |   |-- tasks/          # Task, category, comments, subtasks, analytics
|   |-- config/
|   |   |-- settings/
|   |   |   |-- base.py
|   |   |   |-- development.py
|   |   |   |-- production.py
|   |   |-- urls.py
|   |-- templates/emails/otp_email.html
|   |-- requirements.txt
|   |-- manage.py
|
|-- frontend/
|   |-- src/
|   |   |-- api/            # Axios instance + endpoint wrappers
|   |   |-- components/     # Shared and domain-specific UI
|   |   |-- pages/          # Route-level pages
|   |   |-- store/          # Zustand stores
|   |   |-- utils/
|   |   |-- App.jsx
|   |-- package.json
|   |-- vite.config.js
|   |-- vercel.json
|
|-- render.yaml
|-- LICENSE
|-- README.md
```

## 5) System Architecture 🧠

### High-level flow 🔄

1. Frontend authenticates user via `/api/auth/login/` or OTP registration flow.
2. Backend returns JWT access/refresh tokens.
3. Frontend stores tokens in local storage and persisted Zustand auth state.
4. Axios interceptor attaches `Authorization: Bearer <access_token>` automatically.
5. On token expiration, interceptor requests `/api/auth/refresh/` and retries failed calls.
6. Domain APIs (workspaces, projects, tasks, categories) are then available according to role permissions.

### Backend API organization 🧩

- `/api/auth/*` -> auth, registration, profile, user listing
- `/api/workspaces/*` -> workspace and workspace member operations
- `/api/projects/*` -> project and project member operations
- `/api/tasks/*` -> tasks, bulk update, stats, comments, subtasks
- `/api/categories/*` -> category endpoints (mapped from tasks app)

## 6) Domain Model 🧱

The project uses UUID primary keys for all core entities.

### User 👤

- Email-based authentication (`USERNAME_FIELD = email`)
- Custom user types:
    - `admin`
    - `company`
    - `employee`

### Workspace 🏢

- Owned by one user
- Supports color/icon branding fields
- Membership status model:
    - `pending`
    - `accepted`
    - `declined`

### Project 📁

- Belongs to a workspace
- Has owner, status, optional start/end dates
- Has a separate `ProjectMember` table with role model (`manager`, `member`, `viewer`)

### Task 📝

- Belongs to a workspace and optionally to a project
- Status values:
    - `todo`
    - `in_progress`
    - `in_review`
    - `done`
    - `cancelled`
- Priority values:
    - `urgent`
    - `high`
    - `medium`
    - `low`
    - `no_priority`
- Supports category, assignee, due/start dates, estimated hours, and ordering index

### Category, Comment, SubTask 💬

- Categories are unique by `(workspace, name)`
- Comments are attached to tasks with author tracking
- Subtasks are attached to tasks and include completion state

## 7) API Reference 🔌

Base URL (development):

- Backend root: `http://localhost:8000`
- API base: `http://localhost:8000/api`

### Auth endpoints 🔐

- `POST /api/auth/register/` -> stage registration and send OTP
- `POST /api/auth/register/verify/` -> verify OTP and create user
- `POST /api/auth/register/resend-otp/` -> resend OTP
- `POST /api/auth/login/` -> obtain access/refresh token pair
- `POST /api/auth/refresh/` -> refresh access token
- `POST /api/auth/logout/` -> blacklist refresh token
- `GET /api/auth/me/` -> current authenticated user
- `GET /api/auth/users/` -> user list (restricted by user type)

### Workspace endpoints 🏢

- `GET/POST /api/workspaces/`
- `GET/PATCH/DELETE /api/workspaces/{workspace_id}/`
- `GET /api/workspaces/{workspace_id}/members/`
- `POST /api/workspaces/{workspace_id}/members/add/`
- `DELETE /api/workspaces/{workspace_id}/members/{user_id}/remove/`
- `PATCH /api/workspaces/{workspace_id}/members/{user_id}/role/`
- `GET /api/workspaces/invitations/`
- `POST /api/workspaces/invitations/{member_id}/respond/`

### Project endpoints 📁

- `GET/POST /api/projects/`
- `GET/PATCH/DELETE /api/projects/{project_id}/`
- `GET /api/projects/{project_id}/members/`
- `POST /api/projects/{project_id}/members/add/`
- `DELETE /api/projects/{project_id}/members/{user_id}/remove/`

### Task endpoints 📝

- `GET/POST /api/tasks/`
- `PATCH /api/tasks/bulk-update/`
- `GET /api/tasks/stats/`
- `GET/PATCH/DELETE /api/tasks/{task_id}/`
- `GET/POST /api/tasks/{task_id}/comments/`
- `GET/PATCH/DELETE /api/tasks/{task_id}/comments/{comment_id}/`
- `GET/POST /api/tasks/{task_id}/subtasks/`
- `GET/PATCH/DELETE /api/tasks/subtasks/{subtask_id}/`

### Category endpoints 🏷️

- `GET/POST /api/categories/`
- `GET/PATCH/DELETE /api/categories/{category_id}/`

### Task filtering and sorting 🎯

Supported query params on `GET /api/tasks/` include:

- `workspace`
- `project`
- `status`
- `priority`
- `assignee`
- `category`
- `due_date_from`
- `due_date_to`
- `overdue` (`true/false`)
- `search` (title/description)
- `ordering` (`created_at`, `updated_at`, `due_date`, `priority`, `order`)

## 8) Authentication and Authorization 🛡️

### JWT strategy 🔑

- Access token lifetime: 1 hour
- Refresh token lifetime: 7 days
- Refresh token rotation enabled
- Blacklisting enabled after rotation/logout

### Permission rules (important) 🚦

- Read operations require accepted workspace membership.
- Write operations in workspace-scoped resources are limited to workspace `admin` or `member`.
- Workspace `viewer` has read-only behavior.
- Only workspace owners can delete a workspace.
- Only workspace admins can add/remove workspace members and update roles.
- Project creation requires workspace admin/member role.

### OTP registration flow ✉️

- Registration payload is temporarily cached server-side.
- OTP is emailed using configured SMTP backend.
- OTP expiry is configured in settings (`OTP_EXPIRY`, default 15 minutes).

## 9) Local Development Setup 🧪

### Prerequisites 📋

- Python 3.11+
- Node.js 18+
- npm 9+
- PostgreSQL database (local or hosted)

### Backend setup 🐍

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend runs at `http://localhost:8000` by default.

### Frontend setup ⚛️

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` by default.

### Full local run order ▶️

1. Start backend first (`python manage.py runserver`).
2. Start frontend (`npm run dev`).
3. Open `http://localhost:5173`.

## 10) Environment Variables 🔧

Create your environment configuration for backend settings (for example via a `.env` in `backend/` if using `python-decouple` defaults in your setup).

### Backend variables 🗄️

Required/important settings parsed in code:

- `SECRET_KEY`
- `DEBUG`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT` (default: `6543`)
- `JWT_SECRET` (optional fallback to `SECRET_KEY`)
- `CORS_ALLOWED_ORIGINS` (comma-separated)
- `EMAIL_HOST` (default: `smtp.gmail.com`)
- `EMAIL_PORT` (default: `587`)
- `EMAIL_USE_TLS` (default: `True`)
- `EMAIL_HOST_USER`
- `EMAIL_HOST_PASSWORD`
- `DEFAULT_FROM_EMAIL`

Example backend `.env`:

```env
SECRET_KEY=replace-with-a-secure-secret
DEBUG=True

DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

JWT_SECRET=replace-with-jwt-secret
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=you@example.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@taskforge.local
```

### Frontend variables 🌍

- `VITE_API_URL` (optional; defaults to `http://localhost:8000`)

Example frontend `.env`:

```env
VITE_API_URL=http://localhost:8000
```

## 11) Build and Deployment 🚀

### Frontend build 🏗️

```bash
cd frontend
npm run build
npm run preview
```

### Backend production serving 🛰️

Gunicorn entrypoint (as used by Render config):

```bash
gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
```

### Render blueprint notes ☁️

Current `render.yaml` executes:

- Build command: run migrations + collectstatic
- Start command: Gunicorn
- Environment: Python 3.11.2

Make sure your Render environment contains all required DB/email/JWT secrets.

### Vercel routing (frontend) 🧭

`frontend/vercel.json` rewrites all routes to `index.html`, which is required for client-side React Router paths.

## 12) Troubleshooting 🩺

### npm run dev fails in frontend

- Confirm Node.js version is modern (`node -v`, preferably 18+).
- Reinstall dependencies:

```bash
cd frontend
rm -r node_modules package-lock.json
npm install
npm run dev
```

On Windows PowerShell, remove with:

```powershell
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json -Force
```

### Login works but API calls fail with 401

- Check if refresh token exists in local storage.
- Verify backend JWT settings and signing key.
- Ensure browser time is correct (large clock drift can break token validation).

### CORS issues in development

- Confirm frontend origin is included in `CORS_ALLOWED_ORIGINS`.
- If using `development.py`, note that `CORS_ALLOW_ALL_ORIGINS = True` is currently enabled.

### OTP email not delivered

- Validate SMTP credentials and app-password setup.
- Check spam folder.
- For local debugging, temporarily use console email backend in development settings.

### Database connection errors

- Re-check `DB_*` variables and SSL requirements.
- If connecting to local PostgreSQL, you may need to adjust SSL options in settings.

## 13) Security Notes 🔒

- Do not commit real secrets or production credentials.
- Use a strong `SECRET_KEY` and `JWT_SECRET` in production.
- Production settings enforce secure cookies and HTTPS redirects.
- Review CORS and trusted origin values before launch.
- Consider adding rate limiting for auth/OTP endpoints for abuse protection.

## 14) Roadmap Ideas 🛣️

Potential next enhancements:

- Add automated test coverage for API permissions and auth flows.
- Add CI pipeline for lint + test + build checks.
- Add audit trail for membership and permission changes.
- Add task attachments endpoint and storage policy documentation.
- Improve API docs with OpenAPI/Swagger schema generation.

## 15) License 📜

This repository is licensed under the MIT License.
See the `LICENSE` file in the project root.
