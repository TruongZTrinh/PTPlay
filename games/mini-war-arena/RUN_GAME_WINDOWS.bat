@echo off
setlocal
cd /d "%~dp0"
title PTPlay - Mini War Arena V1.0 Full Release + Live Bridge Launcher

where npm >nul 2>nul
if errorlevel 1 (
  echo [PTPlay] Please install Node.js LTS from https://nodejs.org/
  pause
  exit /b 1
)

if not exist "node_modules\phaser" (
  echo [PTPlay] Installing Game dependencies. Internet required once...
  call npm install
  if errorlevel 1 (
    echo [PTPlay] npm install failed for Game. Check your Internet connection.
    pause
    exit /b 1
  )
)

if not exist "ptplay-live-bridge\node_modules\ws" (
  echo [PTPlay] Installing Live Bridge dependencies...
  call npm install --prefix ptplay-live-bridge
  if errorlevel 1 (
    echo [PTPlay] npm install failed for Live Bridge.
    pause
    exit /b 1
  )
)

echo [PTPlay] Starting PTPlay Live Bridge (Port 8088)...
start "PTPlay Live Bridge" cmd /c "cd /d \"%~dp0ptplay-live-bridge\" && npm start"

echo [PTPlay] Starting Mini War Arena V1.0 (Port 5173)...
start "PTPlay Game Browser" cmd /c "timeout /t 3 /nobreak >nul & start \"\" http://localhost:5173 & timeout /t 1 /nobreak >nul & start \"\" http://localhost:8088/admin"
call npm run dev
pause
