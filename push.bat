@echo off
setlocal

:: TaskForge GitHub Push Script

echo [TaskForge] Initializing Git repository...
git init

echo [TaskForge] Configuring remote origin...
:: Use set-url if it exists, otherwise add it. 
git remote add origin https://github.com/KandhalShakil/TaskForge.git 2>nul
if %errorlevel% neq 0 (
    git remote set-url origin https://github.com/KandhalShakil/TaskForge.git
)

echo [TaskForge] Checking for branch...
git branch -M main

echo [TaskForge] Adding files (respecting .gitignore)...
git add .

echo [TaskForge] Committing changes...
git commit -m "Add SubTask functionality" 2>nul

echo [TaskForge] Pulling remote changes (to avoid push rejection)...
:: This handles cases where the github repo was created with a README or LICENSE
git pull origin main --allow-unrelated-histories --no-edit

echo [TaskForge] Pushing to GitHub...
echo [IMPORTANT] You may be prompted for your GitHub credentials in a separate window.
git push -u origin main

echo.
echo [TaskForge] Push completed! Check your repository: https://github.com/KandhalShakil/TaskForge.git
pause
