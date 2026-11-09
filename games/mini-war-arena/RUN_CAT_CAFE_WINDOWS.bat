@echo off
setlocal EnableExtensions

:: 1. Detect Game Directory (Self location, or fallback if moved to Desktop or elsewhere)
set "GAME_DIR=%~dp0"
if not exist "%GAME_DIR%package.json" (
  if exist "C:\Workspace\PTPlay-Cat-Cafe\package.json" (
    set "GAME_DIR=C:\Workspace\PTPlay-Cat-Cafe\"
  ) else if exist "C:\Workspace\PTPlay-Mini-War-Arena\games\cat-cafe\package.json" (
    set "GAME_DIR=C:\Workspace\PTPlay-Mini-War-Arena\games\cat-cafe\"
  )
)

cd /d "%GAME_DIR%"
title PTPlay - Cat Cafe LIVE [Quan Meo Moe]

echo ========================================================
echo   PTPLAY CAT CAFE LIVE - QUAN MEO MOE V1.0
echo   Windows 1-Click Launcher
echo ========================================================
echo [PTPlay] Working directory: %CD%
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js and npm are not found on your system PATH!
  echo Please install Node.js LTS from https://nodejs.org/
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\phaser" (
  echo [PTPlay] Installing Cat Cafe dependencies...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed for Cat Cafe.
    pause
    exit /b 1
  )
)

:: Locate PTPlay Live Bridge directory
set "BRIDGE_DIR="
if exist "%GAME_DIR%..\PTPlay-Live-Bridge" (
  for %%I in ("%GAME_DIR%..\PTPlay-Live-Bridge") do set "BRIDGE_DIR=%%~fI"
) else if exist "C:\Workspace\PTPlay-Live-Bridge" (
  set "BRIDGE_DIR=C:\Workspace\PTPlay-Live-Bridge"
) else if exist "%GAME_DIR%..\PTPlay-Mini-War-Arena\ptplay-live-bridge" (
  for %%I in ("%GAME_DIR%..\PTPlay-Mini-War-Arena\ptplay-live-bridge") do set "BRIDGE_DIR=%%~fI"
) else if exist "%GAME_DIR%..\..\ptplay-live-bridge" (
  for %%I in ("%GAME_DIR%..\..\ptplay-live-bridge") do set "BRIDGE_DIR=%%~fI"
) else if exist "%GAME_DIR%..\ptplay-live-bridge" (
  for %%I in ("%GAME_DIR%..\ptplay-live-bridge") do set "BRIDGE_DIR=%%~fI"
) else if exist "%GAME_DIR%ptplay-live-bridge" (
  for %%I in ("%GAME_DIR%ptplay-live-bridge") do set "BRIDGE_DIR=%%~fI"
) else if exist "C:\Workspace\PTPlay-Mini-War-Arena\ptplay-live-bridge" (
  set "BRIDGE_DIR=C:\Workspace\PTPlay-Mini-War-Arena\ptplay-live-bridge"
)

if defined BRIDGE_DIR (
  echo [PTPlay] Found Live Bridge at: %BRIDGE_DIR%
  if not exist "%BRIDGE_DIR%\node_modules\ws" (
    echo [PTPlay] Installing Live Bridge dependencies...
    call npm install --prefix "%BRIDGE_DIR%"
  )
  echo [PTPlay] Starting PTPlay Live Bridge on Port 8088...
  start "PTPlay Live Bridge [Port 8088]" /D "%BRIDGE_DIR%" cmd /k "npm start"
) else (
  echo [PTPlay] Note: ptplay-live-bridge directory not found.
  echo [PTPlay] Game will run in standalone offline mode.
)

echo.
echo [PTPlay] Starting Cat Cafe LIVE on Port 5174...
echo [PTPlay] Opening browser at http://localhost:5174 and http://localhost:8088/admin ...
start "PTPlay Browser Launcher" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5174 && timeout /t 1 /nobreak >nul && start http://localhost:8088/admin"

call npm run dev

pause
