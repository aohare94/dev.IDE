@echo off
REM Navigate to the directory containing the git repository
cd /d "C:\Users\Austin\Desktop\dev.IDE\devide"

REM Add all changes to the staging area
git add .

REM Commit changes with a fixed message
git commit -m "Auto commit"

REM Push changes to the remote repository
git push origin main

REM Optional: Pause the script to see the output
pause
