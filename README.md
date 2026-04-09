# 🚀 TaskForge — Ultimate Project Management SaaS 🛠️

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**TaskForge** is an enterprise-grade, full-stack project management platform designed for modern teams. Organize your work, track tasks in real-time, and gain deep insights into your productivity with a seamless, high-performance UI.

---

## 🌐 Live Demo
You can access the production application at:
- **Frontend**: [https://www.task-forge.kandhal.tech](https://www.task-forge.kandhal.tech)
- **API Status**: [https://taskforge-backend-hgre.onrender.com/api](https://taskforge-backend-hgre.onrender.com/api)

---

## ✨ Key Features

> [!TIP]
> Use the **Command+K** (or Ctrl+K) shortcut in the dashboard to quickly search through all your tasks and projects!

- **📂 Multi-Workspace Management**: Organise different teams or departments into isolated contexts.
- **🏗️ Structured Projects**: Break down workspaces into specific projects with their own goals.
- **📋 Advanced Task System**:
    - **Kanban Board**: Drag-and-drop tasks across status columns.
    - **Rich Text Editor**: Support for Markdown and formatting in task descriptions.
    - **Custom Categories**: Color-coded categorization for high-level organization.
- **👥 Role-Based Collaboration**: 
    - **Admins**, **Members**, and **Viewers** roles.
    - **Real-time Member Search**: Easily invite and manage teammates.
- **📊 Interactive Analytics**: 
    - **Completion Rates**: Visualized in real-time.
    - **Burn-down Charts**: Track project progress.
- **⏳ Time Tracking**: *[Coming Soon]* - Log intervals on tasks for billing and productivity audits.

---

## 🎨 Design Aesthetics

TaskForge is crafted with a **Premium Dark Mode** focus:
- **Vivid Gradients**: Sleek, modern components with purple-to-blue primary accents.
- **Glassmorphism**: Subtle transparency and backdrop blurs for a clean feel.
- **Responsive Layout**: Designed for everything from large monitors to tablets.

---

## 🛠️ Technical Architecture

### 🌐 Frontend (The Engine)
- **Vite 5**: Blazing fast builds and HMR.
- **Zustand**: Lightweight, persistent store management.
- **Dnd-kit**: Robust drag-and-drop mechanics for Kanban.
- **Lucide Icons**: Crisp, professional iconography.

### ⚙️ Backend (The Core)
- **Django REST Framework (DRF)**: Scalable API architecture.
- **PostgreSQL**: Hosted on **Supabase** for high reliability.
- **SimpleJWT**: Secure authentication with token rotation.
- **WhiteNoise**: Efficient serving of static files.

---

## 🚀 Setting Up Locally

### 1. 📂 Clone the Project
```bash
git clone https://github.com/KandhalShakil/TaskForge.git
cd TaskForge
```

### 2. 🔌 Quick Start (Windows)
Simply run the included batch script to automate everything:
```bash
push.bat  :: *Note: Use start.bat to run locally*
```

### 3. 🐍 Manual Backend Setup
```bash
cd backend
python -m venv venv
# Activate venv: .\venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 4. ⚡ Manual Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](file:///c:/Users/kandh/OneDrive/Desktop/Takify/LICENSE) file for details.

---

## 🤝 Contributing

We welcome contributions! Feel free to open an issue or submit a pull request. 

**TaskForge** — Forge your productivity. 🛠️✨
