# 🚀 TaskForge - Project Management Platform

> *A modern, full-stack project management platform designed for teams to collaborate, organize tasks, and communicate in real-time!*

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)
![Python](https://img.shields.io/badge/Python-3.13-yellow.svg?style=flat-square)
![React](https://img.shields.io/badge/React-18-cyan.svg?style=flat-square)

---

## 📌 Overview

TaskForge is a **comprehensive full-stack project management platform** built with cutting-edge technologies. Organize your workspace hierarchies, manage complex projects, track tasks with precision, and collaborate seamlessly with real-time chat!

```
🏢 Workspace → 📂 Projects/Spaces → 📋 Tasks → ✅ Subtasks
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🏢 **Workspace Management** | Create workspaces, manage members, control access |
| 📂 **Hierarchical Organization** | Spaces, folders, and projects with nested structure |
| ✅ **Advanced Task Management** | Full CRUD, filtering, bulk updates, real-time stats |
| 🎯 **Subtasks & Hierarchy** | Unlimited nested subtask support with parent tracking |
| 💬 **Comments & Attachments** | Collaborate with inline comments and file uploads |
| 🔄 **Real-time Chat** | Workspace, task, and direct messaging powered by Pusher |
| 🔔 **Smart Notifications** | Optimistic message sending with instant UI updates |
| 🔐 **Secure Authentication** | JWT tokens with refresh support and role-based access |
| 📊 **Analytics & Stats** | Task completion metrics and project insights |
| 🎨 **Responsive Design** | Mobile-first, fully responsive UI with Tailwind CSS |

---

## 🛠️ Tech Stack

### 🎨 Frontend

| Technology | Purpose |
|------------|---------|
| ⚛️ **React 18** | Modern UI component library |
| ⚡ **Vite 5** | Lightning-fast build tool & dev server |
| 🗺️ **React Router** | Client-side navigation |
| 🏪 **Zustand** | Lightweight state management |
| 🌐 **Axios** | HTTP client with interceptors |
| 🎯 **Tailwind CSS** | Utility-first CSS framework |
| 📡 **Pusher JS** | Real-time messaging client |

### 🔧 Backend

| Technology | Purpose |
|------------|---------|
| 🐍 **Python 3.13** | Core language |
| 🎯 **Django 4.2** | Web framework |
| 🚀 **Django REST Framework** | RESTful API toolkit |
| 🔐 **Simple JWT** | Token authentication |
| 🔍 **django-filter** | Advanced query filtering |
| 📦 **WhiteNoise** | Static file serving |
| 🍃 **MongoDB** | NoSQL database for app data & chat |
| 📢 **Pusher SDK** | Real-time message broadcasting |

---

## 📁 Project Structure

```
📦 Takify
├── 🔙 backend/
│   ├── 🎯 apps/
│   │   ├── 👤 users/          → Authentication & user management
│   │   ├── 🏢 workspaces/     → Workspace & member management
│   │   ├── 📂 projects/       → Projects, spaces, folders
│   │   ├── ✅ tasks/          → Tasks, subtasks, categories
│   │   ├── 💬 chat/           → Real-time chat system
│   │   └── 🔧 core/           → Shared utilities & permissions
│   ├── ⚙️ config/             → Django settings
│   ├── 📋 requirements.txt    → Python dependencies
│   └── 🗄️ db.sqlite3         → SQLite database
│
└── 🎨 frontend/
    ├── 📦 src/
    │   ├── 🌐 api/            → API integration layer
    │   ├── 🧩 components/     → Reusable React components
    │   ├── 📄 pages/          → Page-level components
    │   ├── 🏪 store/          → Zustand state stores
    │   └── 🛠️ utils/          → Helper functions
    ├── 📝 package.json        → JavaScript dependencies
    └── ⚙️ vite.config.js      → Vite configuration
```

---

## 🚀 Quick Start

### 📋 Prerequisites

- 🐍 Python 3.13+
- 📦 Node.js 18+
- 🍃 MongoDB Atlas account (or local MongoDB)
- 📡 Pusher account for real-time features

### 🔙 Backend Setup

```bash
# Clone and navigate to backend
cd backend

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
source .venv/bin/activate        # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Set up environment variables (create .env file)
# Copy from .env.example

# Run migrations
python manage.py migrate

# Start development server
python manage.py runserver

# Server runs on http://localhost:8000 🎉
```

### 🎨 Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Set up environment variables (create .env file)
# Copy from .env.example

# Start development server
npm run dev

# Frontend runs on http://localhost:5173 🎉
```

---

## 🔑 Environment Configuration

### 🔙 Backend `.env` File

```env
# ⚙️ Django Settings
DEBUG=True
SECRET_KEY=your-super-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# 🗄️ Database Configuration
# SQLite (Development)
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3

# PostgreSQL (Production)
# DATABASE_URL=postgresql://user:password@host:port/dbname
# OR
# DB_ENGINE=django.db.backends.postgresql
# DB_NAME=takify
# DB_USER=postgres
# DB_PASSWORD=your-password
# DB_HOST=localhost
# DB_PORT=5432

# 🍃 MongoDB (App & Chat Data)
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<db>
MONGO_DB_NAME=takify

# 📢 Pusher Real-time Configuration
PUSHER_APP_ID=your-pusher-app-id
PUSHER_KEY=your-pusher-key
PUSHER_SECRET=your-pusher-secret
PUSHER_CLUSTER=your-pusher-cluster
PUSHER_SSL=True

# 📧 Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-email-password
DEFAULT_FROM_EMAIL=noreply@taskforge.com
```

### 🎨 Frontend `.env` File

```env
# 🌐 API Configuration
VITE_API_URL=http://localhost:8000

# 📡 Pusher Configuration
VITE_PUSHER_KEY=your-pusher-key
VITE_PUSHER_CLUSTER=your-pusher-cluster
```

> ℹ️ **Tip:** Use `.env.example` files as your source of truth for required variables!

---

## 📚 API Documentation

### 🔐 Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup/` | Register new user |
| `POST` | `/api/auth/login/` | User login & get JWT token |
| `POST` | `/api/auth/token/refresh/` | Refresh JWT token |
| `POST` | `/api/auth/logout/` | User logout |
| `POST` | `/api/auth/otp/send/` | Send OTP via email |
| `POST` | `/api/auth/otp/verify/` | Verify OTP |

### 🏢 Workspace Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/workspaces/` | List user's workspaces |
| `POST` | `/api/workspaces/` | Create new workspace |
| `GET` | `/api/workspaces/{id}/` | Get workspace details |
| `PATCH` | `/api/workspaces/{id}/` | Update workspace |
| `DELETE` | `/api/workspaces/{id}/` | Delete workspace |
| `GET` | `/api/workspaces/{id}/members/` | List workspace members |
| `POST` | `/api/workspaces/{id}/members/` | Add member |

### 📂 Project Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/workspaces/{ws_id}/projects/` | List projects |
| `POST` | `/api/workspaces/{ws_id}/projects/` | Create project |
| `GET` | `/api/projects/{id}/` | Get project details |
| `PATCH` | `/api/projects/{id}/` | Update project |
| `DELETE` | `/api/projects/{id}/` | Delete project |

### ✅ Task Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/projects/{project_id}/tasks/` | List tasks |
| `POST` | `/api/projects/{project_id}/tasks/` | Create task |
| `GET` | `/api/tasks/{id}/` | Get task details |
| `PATCH` | `/api/tasks/{id}/` | Update task |
| `DELETE` | `/api/tasks/{id}/` | Delete task |
| `POST` | `/api/tasks/{id}/subtasks/` | Add subtask |
| `POST` | `/api/tasks/{id}/comments/` | Add comment |
| `GET` | `/api/tasks/{id}/attachments/` | List attachments |

### 💬 Chat Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/chat/workspace/{ws_id}/` | Get workspace messages |
| `POST` | `/api/chat/workspace/{ws_id}/` | Send workspace message |
| `GET` | `/api/chat/dm/{user_id}/` | Get direct messages |
| `POST` | `/api/chat/dm/{user_id}/` | Send direct message |
| `GET` | `/api/chat/task/{task_id}/` | Get task messages |
| `POST` | `/api/chat/task/{task_id}/` | Send task message |

> 📖 **Full API documentation available at:** `http://localhost:8000/api/docs/` (when running locally)

---

## 🎯 Key Architecture Patterns

### 🔄 Real-time Architecture

```
Frontend (React) ←→ Pusher WebSockets ←→ Backend (Django)
                         ↓
                    MongoDB (Persistence)
```

- **Optimistic UI Updates:** Messages appear instantly on send
- **Pusher Broadcasting:** Real-time sync across all clients
- **MongoDB Persistence:** All messages saved permanently
- **JWT Authentication:** Secure token-based access

### 🏗️ Data Hierarchy

```
🏢 Workspace
  ├── 👥 Members (with roles)
  ├── 📂 Spaces
  │   ├── 📂 Folders
  │   │   └── 📋 Projects
  │   │       ├── ✅ Tasks
  │   │       │   ├── ✓ Subtasks
  │   │       │   ├── 💬 Comments
  │   │       │   └── 📎 Attachments
  │   │       └── 💬 Project Chat
  │   └── 💬 Space Chat
  └── 💬 Workspace Chat
```

### 🔐 Security Features

- ✅ **JWT Authentication** with refresh tokens
- 🔒 **Role-Based Access Control** (RBAC)
- 🛡️ **CORS Protection** on backend
- 🔑 **Environment Variable Protection**
- 📦 **Dependency Vulnerability Scanning**

---

## 🧪 Testing & Quality

```bash
# Backend Tests
cd backend
pytest tests/

# Frontend Tests
cd frontend
npm run test

# Linting
npm run lint

# Build Check
npm run build
```

---

## 📊 Database Architecture

### SQLite (Development/SQLite Fallback)

```sql
-- Users, Workspaces, Projects
-- Tasks, Subtasks, Comments
-- Attachments & Categories
```

### PostgreSQL (Production)

```sql
-- Recommended for production deployments
-- Better concurrency & scalability
-- Configure via DATABASE_URL
```

### MongoDB (Real-time & Chat)

```javascript
// Collections
db.messages          // All chat messages
db.message_threads   // Message grouping
db.notifications     // User notifications
```

---

## 🚢 Deployment

### 📤 Frontend Deployment

```bash
# Build optimization
npm run build

# Deploy to:
# - Vercel (Recommended for Next.js/Vite)
# - Netlify
# - GitHub Pages
# - AWS S3 + CloudFront
```

### 🔙 Backend Deployment

```bash
# Production build
python manage.py collectstatic

# Deploy to:
# - Heroku
# - AWS EC2/Lambda
# - Render
# - Railway
# - PythonAnywhere
# - DigitalOcean
```

See [render.yaml](render.yaml) for Render.com deployment configuration.

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. 🍴 Fork the repository
2. 🌳 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. ✍️ Commit your changes (`git commit -m 'Add amazing feature'`)
4. 📤 Push to the branch (`git push origin feature/amazing-feature`)
5. 🔀 Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 💬 Support & Contact

- 💡 **Issues:** Report bugs and request features via [GitHub Issues](../../issues)
- 📧 **Email:** support@taskforge.com
- 🐦 **Twitter:** [@TaskForgeApp](https://twitter.com/taskforgeapp)
- 💼 **LinkedIn:** [TaskForge Team](https://linkedin.com/company/taskforge)

---

## 🎉 Made with ❤️ by the TaskForge Team

**Happy Collaborating!** 🚀

## 🔑 Environment Configuration

### 🔙 Backend `.env` File

```env
# ⚙️ Django Settings
DEBUG=True
SECRET_KEY=your-super-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# 🗄️ Database Configuration
# SQLite (Development)
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3

# PostgreSQL (Production)
# DATABASE_URL=postgresql://user:password@host:port/dbname
# OR
# DB_ENGINE=django.db.backends.postgresql
# DB_NAME=takify
# DB_USER=postgres
# DB_PASSWORD=your-password
# DB_HOST=localhost
# DB_PORT=5432

# 🍃 MongoDB (App & Chat Data)
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<db>
MONGO_DB_NAME=takify

# 📢 Pusher Real-time Configuration
PUSHER_APP_ID=your-pusher-app-id
PUSHER_KEY=your-pusher-key
PUSHER_SECRET=your-pusher-secret
PUSHER_CLUSTER=your-pusher-cluster
PUSHER_SSL=True

# 📧 Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-email-password
DEFAULT_FROM_EMAIL=noreply@taskforge.com
```

### 🎨 Frontend `.env` File

```env
# 🌐 API Configuration
VITE_API_URL=http://localhost:8000

# 📡 Pusher Configuration
VITE_PUSHER_KEY=your-pusher-key
VITE_PUSHER_CLUSTER=your-pusher-cluster
```

> ℹ️ **Tip:** Use `.env.example` files as your source of truth for required variables!

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
