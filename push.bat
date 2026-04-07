@echo off
setlocal

:: TaskForge GitHub Push Script

echo [TaskForge] Initializing Git repository...
git init

echo [TaskForge] Adding remote origin...
git remote add origin https://github.com/KandhalShakil/TaskForge.git

echo [TaskForge] Checking for branch...
git branch -M main

echo [TaskForge] Adding files (respecting .gitignore)...
git add .

echo [TaskForge] committing changes...
git commit -m "Initial commit: Rebranded to TaskForge with full-stack project management features"

echo [TaskForge] Pushing to GitHub...
echo [IMPORTANT] You may be prompted for your GitHub credentials in a separate window.
git push -u origin main

echo.
echo [TaskForge] Push completed! Check your repository: https://github.com/KandhalShakil/TaskForge.git
pause
