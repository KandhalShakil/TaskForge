@echo off
setlocal
echo [TaskForge] Initializing Git repository...
git init 
git remote add origin https://github.com/KandhalShakil/TaskForge.git 2>nul
if %errorlevel% neq 0 (
    git remote set-url origin https://github.com/KandhalShakil/TaskForge.git
)
git branch -M main
git add .
git commit -m "Final polish: Fixed member role update bug and completed TaskForge rebranding" 2>nul
git pull origin main --no-edit --allow-unrelated-histories
git push -u origin main
echo [TaskForge] Auto-push finished!
