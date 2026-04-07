# TaskForge Setup & Deployment Guide

This guide will help you install dependencies and run TaskForge on your local machine.

## Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **Git**

## Quick Start (Windows)

We have provided a convenient batch script to automatically install dependencies, run database migrations, and start both the frontend and backend servers.

1. Double-click the `start.bat` file in the root of the project.
2. Wait for the terminal to finish installing Python and Node packages.
3. Two new command prompt windows will open (one for the Backend, one for the Frontend).
4. The frontend will be available at `http://localhost:5173`.
5. The backend will be available at `http://localhost:8000`.

---

## Manual Setup

If you prefer to run things manually or are on macOS/Linux, follow these steps:

### 1. Backend Setup (Django)

Open a terminal and navigate to the `backend` folder:

```bash
cd backend
```

Create and activate a Python virtual environment:

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

Install the required Python packages:

```bash
pip install -r requirements.txt
```

Run database migrations to initialize your Supabase PostgreSQL database:

```bash
python manage.py migrate
```

Start the Django development server:

```bash
python manage.py runserver
```

*(The backend will now be running at `http://localhost:8000`)*

### 2. Frontend Setup (React)

Open a new terminal window and navigate to the `frontend` folder:

```bash
cd frontend
```

Install the Node modules:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

*(The frontend will now be running at `http://localhost:5173`)*

---

## Deployment Information

Refer to `DEPLOYMENT.md` for detailed instructions on how to deploy TaskForge to production.
