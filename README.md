
# TaskForge
TaskForge – A full-stack project management SaaS application inspired by ClickUp, built with React (Vite), Django REST Framework, and PostgreSQL. Supports workspaces, projects, tasks, Kanban boards, analytics, and JWT authentication.
# Takify — Project Management SaaS

Takify is a powerful, full-stack project management application similar to ClickUp. It allows teams to manage workspaces, projects, and tasks using multiple dynamic views including Kanban boards, Calendars, and Timelines.

## Tech Stack

### Frontend
- **Framework:** React + Vite
- **Styling:** Tailwind CSS v3
- **State Management:** Zustand
- **Routing:** React Router v6
- **Data Fetching:** Axios (with JWT interceptors)
- **Forms & Validation:** React Hook Form + Zod
- **Drag & Drop:** `@dnd-kit/core`
- **Charts/Analytics:** Recharts
- **Calendar:** React Big Calendar

### Backend
- **Framework:** Django 4.2 + Django REST Framework (DRF)
- **Database:** PostgreSQL (configured for Supabase)
- **Authentication:** JWT (`djangorestframework-simplejwt`)
- **API Architecture:** RESTful endpoints organized by domains (users, workspaces, projects, tasks)

## Core Features

1. **Robust Authentication:** Secure JWT-based login/registration.
2. **Workspace Management:** Create workspaces, invite members, and assign role-based access (Admin/Member/Viewer).
3. **Project Tracking:** Group tasks into active, completed, or archived projects.
4. **Advanced Task Views:** 
   - **List View:** Sortable, detailed table.
   - **Kanban Board:** Drag-and-drop tasks across status columns.
   - **Calendar View:** Visualize task due dates.
   - **Timeline View:** Gantt-style chart for long-term project planning.
5. **Analytics Dashboard:** Real-time metrics, completion rates, and visual charts summarizing workspace productivity.

## Getting Started

Please refer to the `SETUP.md` file for detailed instructions on how to install dependencies and run the application locally.
