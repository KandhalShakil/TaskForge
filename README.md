# 🚀 TaskForge (Takify)

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
![Python](https://img.shields.io/badge/Python-3.11%2B-blue)
![Django](https://img.shields.io/badge/Django-4.2-0C4B33)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Vite](https://img.shields.io/badge/Vite-5-646CFF)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248)  
![Realtime](https://img.shields.io/badge/Realtime-Pusher-300D4F)

Your all-in-one team collaboration and project management platform with real-time chat, structured workspaces, and powerful task workflows.

## 📌 Table of Contents

- ✨ What is TaskForge?
- 🧱 Core Features
- 🏗️ Architecture
- 🛠️ Tech Stack
- 📂 Project Structure
- ⚡ Start in 5 Minutes
- 🖼️ Screenshots and Demo
- ⚡ Quick Start
- 🔐 Environment Variables
- 🌐 API Reference Map
- 💻 Useful Commands
- 🚢 Deployment
- 🧪 Quality and Validation
- 🐞 Troubleshooting
- 🤝 Contributing
- 📄 License

## ✨ What is TaskForge?

TaskForge is a full-stack productivity platform for teams to plan, execute, and communicate in one place.

Core work hierarchy:

Workspace -> Space -> Folder -> Project -> Task -> Subtask

It combines:

- Fast frontend UX with React + Vite
- Secure Django REST APIs with JWT auth
- Mongo-backed app data
- Realtime messaging via Pusher

## 🧱 Core Features

- 👥 Workspace management with member roles and invitations
- 🗂️ Space, folder, and project hierarchy support
- ✅ Task CRUD with subtasks, comments, categories, and stats
- 🔄 Bulk task updates for faster operations
- 🔐 JWT authentication + OTP-based registration verification
- 💬 Realtime chat threads with read-state handling
- 📎 Chat attachment upload support
- 📱 Responsive frontend experience

## 🏗️ Architecture

```text
Frontend (React + Vite)
        |
        |  HTTP (JWT)
        v
Backend API (Django + DRF)
        |
        |  persistence
        v
MongoDB

Realtime path:
Frontend <-> Pusher Channels <-> Backend Chat Service
```

## 🛠️ Tech Stack

### 🔙 Backend

- Python
- Django 4.2
- Django REST Framework
- django-filter
- Simple JWT
- MongoEngine + Django MongoEngine
- Pusher Python SDK
- WhiteNoise

### 🎨 Frontend

- React 18
- Vite 5
- React Router
- Zustand
- Axios
- Tailwind CSS
- Pusher JS

## 📂 Project Structure

```text
Takify/
  backend/
    apps/
      users/         # auth and profile APIs
      workspaces/    # workspace + members
      projects/      # spaces, folders, projects
      tasks/         # tasks, subtasks, comments, categories
      chat/          # chat context, threads, messages
      core/          # shared middleware/utils
    config/
      settings/
        base.py
        development.py
        production.py
    manage.py
    requirements.txt

  frontend/
    src/
      api/
      components/
      pages/
      store/
      utils/
    package.json
    vite.config.js
    vercel.json

  render.yaml
```

## ⚡ Start in 5 Minutes

Use this if you want the app running as fast as possible.

1. Clone the repo and open two terminals.
2. Configure backend env in backend/.env.
3. Configure frontend env in frontend/.env.
4. Start backend.
5. Start frontend and open the app.

### Terminal 1 (Backend)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Terminal 2 (Frontend)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## ⚡ Quick Start

### 📋 Prerequisites

- Python 3.11+
- Node.js 18+
- npm
- MongoDB Atlas or local MongoDB

Pusher credentials are required only if you want realtime chat events during local development.

### 1. Backend Setup 🔙

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend: http://localhost:8000

### 2. Frontend Setup 🎨

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

## 🔐 Environment Variables

### Backend (.env in backend/) 🔙

These keys match the variables currently read by Django settings.

```env
SECRET_KEY=replace-with-a-secure-secret
DEBUG=True

MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/?retryWrites=true&w=majority
MONGO_DB_NAME=takify

PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
PUSHER_SSL=True

JWT_SECRET=optional-separate-signing-secret

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@example.com
EMAIL_HOST_PASSWORD=your-app-password
```

Notes:

- JWT_SECRET is optional. If omitted, SECRET_KEY is used.
- DEFAULT_FROM_EMAIL is derived from EMAIL_HOST_USER.

### Frontend (.env in frontend/) 🎨

```env
VITE_API_URL=http://localhost:8000
VITE_PUSHER_KEY=
VITE_PUSHER_CLUSTER=
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
  - Check PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER.
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
