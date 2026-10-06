@echo off
title Launching Workflow Studio PRO...
echo ========================================================
echo   Launching Workflow Studio PRO (Local Engine)...
echo ========================================================
echo.

cd /d "%~dp0"

start "" powershell -Command "Start-Sleep -Milliseconds 1200; Start-Process 'http://localhost:5173'"
npm run dev
