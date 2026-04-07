# TaskForge Deployment Guide

A step-by-step guide to deploying TaskForge to production using Render for the backend and Vercel for the frontend.

## 1. Backend Deployment (Render)

### Step 1: Push your code to GitHub
Ensure all your changes are pushed to your GitHub repository: `https://github.com/KandhalShakil/TaskForge.git`.

### Step 2: Create a New Web Service in Render
1.  Log in to [Render](https://render.com/).
2.  Click **New +** and select **Web Service**.
3.  Connect your GitHub repository.
4.  Configure the service:
    - **Name**: `taskforge-backend`
    - **Root Directory**: `backend`
    - **Runtime**: `Python 3`
    - **Build Command**: `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput`
    - **Start Command**: `gunicorn config.wsgi:application`

### Step 3: Configure Environment Variables
In the Render dashboard for your service, click on **Environment** and add the following keys from your `.env` file:
- `SECRET_KEY`: (A long, random string)
- `DEBUG`: `False`
- `DB_NAME`: (From your Supabase dashboard)
- `DB_USER`: (From your Supabase dashboard)
- `DB_PASSWORD`: (From your Supabase dashboard)
- `DB_HOST`: (From your Supabase dashboard)
- `DB_PORT`: `6543` (usually)
- `JWT_SECRET`: (Another long, random string)
- `ALLOWED_HOSTS`: `taskforge-backend.onrender.com` (use your actual Render URL)
- `CORS_ALLOWED_ORIGINS`: `https://taskforge.vercel.app` (your actual frontend URL)

---

## 2. Frontend Deployment (Vercel)

### Step 1: Create a New Project in Vercel
1.  Log in to [Vercel](https://vercel.com/).
2.  Click **Add New...** and select **Project**.
3.  Import your GitHub repository.
4.  Configure the project:
    - **Framework Preset**: `Vite`
    - **Root Directory**: `frontend`

### Step 2: Configure Environment Variables
1.  Click on **Environment Variables**.
2.  Add:
    - `VITE_API_URL`: `https://taskforge-backend.onrender.com/api` (your backend URL with /api)

### Step 3: Deploy
1.  Click **Deploy**.
2.  Once complete, Vercel will give you a production URL (e.g., `https://taskforge.vercel.app`).
3.  **IMPORTANT**: Go back to your Render backend environment variables and update `CORS_ALLOWED_ORIGINS` to include this new URL.

---

## 3. Database Management (Supabase)
Ensure your Supabase project is active. You can manage migrations and raw SQL directly through the Supabase SQL Editor if needed, although `python manage.py migrate` on Render will handle most of it.
