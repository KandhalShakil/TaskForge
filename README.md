# TaskForge

TaskForge is a full-stack project management platform built with Django REST Framework, React, Vite, MongoDB, and Pusher. It supports workspaces, projects, tasks, subtasks, comments, analytics, and real-time chat.

## Overview

The app is organized around workspaces. Users join workspaces, workspaces contain projects, and projects contain tasks and subtasks. Chat is powered by Pusher and persisted through the Django API, with optimistic UI updates on the frontend.

## Features

- Workspace creation and membership management
- Project organization with spaces and folders
- Task CRUD, filtering, bulk updates, and stats
- Subtasks with nested hierarchy support
# TaskForge

TaskForge is a full-stack project management platform built with Django REST Framework, React, Vite, MongoDB, and Pusher. It supports workspaces, projects, tasks, subtasks, comments, analytics, and real-time chat.

## Overview

The app is organized around workspaces. Users join workspaces, workspaces contain projects, and projects contain tasks and subtasks. Chat is powered by Pusher and persisted through the Django API, with optimistic UI updates on the frontend.

## Features

- Workspace creation and membership management
- Project organization with spaces and folders
- Task CRUD, filtering, bulk updates, and stats
- Subtasks with nested hierarchy support
- Comments and attachments on tasks
- Real-time chat for workspace, task, and direct messages
- Pusher-backed notifications and optimistic message sending
- JWT-based authentication with refresh support

## Tech Stack

### Frontend

- React 18
- Vite 5
- React Router
- Zustand
- Axios
- Tailwind CSS
- Pusher JS

### Backend

- Python 3.13
- Django 4.2
- Django REST Framework
- Simple JWT
- django-filter
- WhiteNoise
- MongoDB for app data sync and chat persistence
- Pusher server SDK for real-time messaging

## Project Structure

```text
backend/
  apps/
  core/
  users/
  workspaces/
  projects/
  tasks/
  chat/
  config/
  requirements.txt

frontend/
  src/
  api/
  components/
  pages/
  store/
  utils/
```

## Installation

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Create a backend `.env` file with values like these:

```env
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1

DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3

MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<db>
MONGO_DB_NAME=takify

PUSHER_APP_ID=your-pusher-app-id
PUSHER_KEY=your-pusher-key
PUSHER_SECRET=your-pusher-secret
PUSHER_CLUSTER=your-pusher-cluster
PUSHER_SSL=True
```

Create a frontend `.env` file with values like these:

```env
VITE_API_URL=http://localhost:8000
VITE_PUSHER_KEY=your-pusher-key
VITE_PUSHER_CLUSTER=your-pusher-cluster
```

Use the matching `.env.example` files as the source of truth for required variable names.

For production PostgreSQL, set either `DATABASE_URL` or `DB_ENGINE=django.db.backends.postgresql` with the matching `DB_NAME`, `DB_USER`, `DB_PASSWORD`, and `DB_HOST` values. If no production database is configured, the app safely falls back to SQLite.

## Important API Endpoints

### Auth

- `POST /api/auth/register/`
- `POST /api/auth/register/verify/`
- `POST /api/auth/login/`
- `POST /api/auth/refresh/`
- `POST /api/auth/logout/`
- `GET /api/auth/me/`

### Workspaces

- `GET /api/workspaces/`
- `POST /api/workspaces/`
- `GET /api/workspaces/{id}/members/`
- `POST /api/workspaces/{id}/members/add/`
- `DELETE /api/workspaces/{id}/members/{userId}/remove/`

### Projects

- `GET /api/projects/`
- `POST /api/projects/`
- `GET /api/projects/{id}/`
- `GET /api/projects/hierarchy/`
- `GET /api/projects/spaces/`
- `GET /api/projects/folders/`

### Tasks

- `GET /api/tasks/`
- `POST /api/tasks/`
- `GET /api/tasks/{id}/`
- `PATCH /api/tasks/{id}/`
- `DELETE /api/tasks/{id}/`
- `GET /api/tasks/stats/`
- `PATCH /api/tasks/bulk-update/`
- `GET /api/tasks/{taskId}/subtasks/`
- `POST /api/tasks/{taskId}/subtasks/`

### Chat

- `GET /api/chat/context/`
- `GET /api/chat/threads/`
- `POST /api/chat/send-message/`
- `GET /api/chat/messages/`
- `POST /api/chat/messages/read/`
- `PATCH /api/chat/messages/{messageId}/`
- `DELETE /api/chat/messages/{messageId}/`
- `POST /api/chat/upload/`

## Chat System

Chat uses a Pusher channel named `chat-channel`. The frontend subscribes to the channel and renders optimistic messages immediately. The backend validates room access, persists the message, sanitizes message content, and broadcasts the final payload back through Pusher.

### Chat flow

1. User types a message and presses Enter.
2. The frontend appends an optimistic message with `sending` status.
3. The message is sent to `/api/chat/send-message/` with a `clientMessageId`.
4. Django validates the room, stores the message, and broadcasts a `new-message` event.
5. The frontend reconciles the optimistic message with the saved payload.

## Deployment

### Backend

```bash
cd backend
python manage.py migrate
python manage.py collectstatic --noinput
gunicorn config.wsgi:application
```

### Frontend

```bash
cd frontend
npm run build
```

## Security Notes

- Do not commit `.env` files.
- Never place API keys or passwords in documentation.
- Use separate values for development and production.
- Restrict backend hosts and CORS settings appropriately.

## Notes for Contributors

- Keep the codebase free of unused files, duplicate helpers, and stale documentation.
- Prefer the existing API and store patterns when adding new features.
- Run the frontend build and Django system checks after refactors.
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
