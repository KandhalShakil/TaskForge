# 🚀 TaskForge (Takify)

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
![Python](https://img.shields.io/badge/Python-3.11%2B-blue)
![Django](https://img.shields.io/badge/Django-4.2-0C4B33)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Vite](https://img.shields.io/badge/Vite-5-646CFF)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248)  
![Redis](https://img.shields.io/badge/Cache-Redis-DC382D)
![Realtime](https://img.shields.io/badge/Realtime-Socket.IO-010101)

Your all-in-one team collaboration and project management platform with high-performance caching, real-time chat, and automated background workflows.

## 📌 Table of Contents

- ✨ What is TaskForge?
- 🧱 Core Features
- 🏗️ Architecture
- 🛠️ Tech Stack
- 📂 Project Structure
- ⚡ Quick Start
- 🔐 Environment Variables
- 🌐 API Reference Map
- 🚢 Deployment
- 📄 License

## ✨ What is TaskForge?

TaskForge is a professional-grade productivity platform designed for teams that require speed and reliability. It organizes work into a clear hierarchy:

**Workspace -> Space -> Folder -> Project -> Task -> Subtask**

Key performance pillars:
- **Ultra-Fast Data Access**: Powered by **Redis** caching and MongoDB indexing.
- **Real-time Collaboration**: Dedicated **Socket.IO** server for instant messaging and presence.
- **Non-blocking Workflows**: Asynchronous background processing for emails and heavy tasks.
- **Premium UX**: Modern React interface with glassmorphism aesthetics and smooth animations.

## 🧱 Core Features

- 👥 **Company-based RBAC**: Multi-tenant architecture with "Owner" and "Employee" roles.
- 🏢 **Workspace Management**: Hierarchical organization with granular member permissions.
- ✅ **Advanced Task Engine**: Subtasks, rich-text comments, categories, and real-time analytics.
- 💬 **Integrated Chat**: Real-time room-based messaging with file attachments and read-states.
- ⚡ **High-Performance**: Server-side caching (Redis), field projection, and composite indexing.
- 🔐 **Security-First**: JWT Authentication, OTP verification, and rate-limiting (Throttling).
- 🔄 **Async Processing**: Background email delivery and notification handling.

## 🏗️ Architecture

```text
       ┌───────────────────┐
       │   React Frontend  │
       └─────────┬─────────┘
                 │
      ┌──────────┴──────────┐
      │                     │
┌─────▼─────┐         ┌─────▼──────────┐
│ Django API│ <─────> │ Socket Server  │
└─────┬─────┘         └──────────┬─────┘
      │                          │
┌─────▼─────┐              ┌─────▼─────┐
│  MongoDB  │ <──────────> │   Redis   │
└───────────┘              └───────────┘
```

## 🛠️ Tech Stack

### 🔙 Backend
- **Framework**: Django 4.2 + REST Framework
- **Auth**: Simple JWT + OTP Verification
- **Database**: MongoDB (via MongoEngine)
- **Cache**: Redis (via django-redis)
- **Queue/Async**: Concurrent ThreadPool Executor
- **Static**: WhiteNoise

### 🎨 Frontend
- **Framework**: React 18 + Vite 5
- **State**: Zustand (with TTL Caching)
- **Styling**: Vanilla CSS (Premium Custom Design)
- **Icons**: Lucide React
- **Charts**: Recharts

### ⚡ Real-time
- **Engine**: Socket.IO
- **Server**: Node.js / Express

## 📂 Project Structure

```text
Takify/
  backend/           # Django REST API
    apps/
      users/         # Auth, profiles, security
      companies/     # Multi-tenant logic
      workspaces/    # Workspace management
      tasks/         # Core task engine & stats
      chat/          # Message persistence
      core/          # Middleware & caching
  frontend/          # React SPA
  socket-server/     # Node.js Socket.IO server
  push.bat           # Automated deployment script
```

## ⚡ Quick Start

1. Clone the repository.
2. Open **three** separate terminal windows.

### Terminal 1: Redis & Backend
```bash
# Start your local Redis server first!
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
python manage.py ensure_mongo_indexes
python manage.py runserver
```

### Terminal 2: Socket Server
```bash
cd socket-server
npm install
npm start
```

### Terminal 3: Frontend
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## 🔐 Environment Variables

### Backend (`backend/.env`) 🔙

These keys match the variables currently read by Django settings.

```env
SECRET_KEY=your-secret
DEBUG=True
MONGO_URI=mongodb+srv://...
MONGO_DB_NAME=takify
REDIS_URL=redis://127.0.0.1:6379/1
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=...
EMAIL_HOST_PASSWORD=...
```

### Frontend (`frontend/.env`) 🎨

```env
VITE_API_URL=http://localhost:8000
VITE_SOCKET_URL=http://localhost:3001
```

## 🌐 API Reference Map

Base route groups:

- /api/auth/
- /api/workspaces/
- /api/projects/
- /api/tasks/
- /api/categories/
- /api/chat/

### 🔑 Auth

- POST /api/auth/register/
- POST /api/auth/register/verify/
- POST /api/auth/register/resend-otp/
- POST /api/auth/login/
- POST /api/auth/refresh/
- POST /api/auth/logout/
- GET /api/auth/me/

### 🏢 Workspaces

- GET /api/workspaces/
- POST /api/workspaces/
- GET /api/workspaces/{workspaceId}/
- GET /api/workspaces/{workspaceId}/members/
- POST /api/workspaces/{workspaceId}/members/add/
- DELETE /api/workspaces/{workspaceId}/members/{userId}/remove/

### 📁 Projects and Hierarchy

- GET /api/projects/
- POST /api/projects/
- GET /api/projects/hierarchy/
- GET /api/projects/spaces/
- GET /api/projects/folders/

### ✅ Tasks

- GET /api/tasks/
- POST /api/tasks/
- PATCH /api/tasks/bulk-update/
- GET /api/tasks/stats/
- GET /api/tasks/{taskId}/subtasks/
- POST /api/tasks/{taskId}/comments/

### 💬 Chat

- GET /api/chat/context/
- GET /api/chat/threads/
- GET /api/chat/messages/
- POST /api/chat/send-message/
- POST /api/chat/messages/read/
- POST /api/chat/upload/

## 💻 Useful Commands

### Frontend

```bash
cd frontend
npm run dev
npm run lint
npm run build
npm run preview
```

### Backend

```bash
cd backend
python manage.py runserver
python manage.py check
python manage.py migrate
python manage.py collectstatic --no-input
```

## 🚢 Deployment

- Render blueprint is included in render.yaml
- Vercel SPA rewrite config is included in frontend/vercel.json

Production backend command pattern:

```bash
cd backend
python manage.py migrate
python manage.py collectstatic --no-input
gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
```

## 🧪 Quality and Validation

Before pushing changes:

- Run frontend lint and build
- Run backend system checks
- Verify auth, workspace, task, and chat flows manually

Recommended quick validation:

1. User can register/login and load profile.
2. Workspace and project hierarchy can be created.
3. Tasks and subtasks can be created/updated.
4. Chat messages send/receive correctly.

## 🐞 Troubleshooting

- App starts but login fails:
  - Verify SECRET_KEY and JWT_SECRET values.
- Chat not updating in real time:
  - Verify VITE_SOCKET_URL and ensure the `socket-server` is running.
- CORS errors in browser:
  - Confirm CORS_ALLOWED_ORIGINS contains frontend URL.
- Email OTP not sending:
  - Validate EMAIL_HOST_USER and EMAIL_HOST_PASSWORD.
- Frontend cannot reach backend:
  - Check VITE_API_URL and backend server port.

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make focused, tested changes.
4. Open a pull request with clear details.

## 📄 License

This project is licensed under the MIT License. See LICENSE.
