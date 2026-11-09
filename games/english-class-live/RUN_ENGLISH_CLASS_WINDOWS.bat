@echo off
setlocal EnableExtensions

:: 1. Detect Game Directory
set "GAME_DIR=%~dp0"
if not exist "%GAME_DIR%package.json" (
  if exist "C:\Workspace\PTPlay\games\english-class-live\package.json" (
    set "GAME_DIR=C:\Workspace\PTPlay\games\english-class-live\"
  )
)

cd /d "%GAME_DIR%"
title PTPlay - English Class LIVE [Lop Hoc Vui]

echo ========================================================
echo   PTPLAY ENGLISH CLASS LIVE - LOP HOC VUI V1.0
echo   Windows 1-Click Production Launcher
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

:: Locate PTPlay Monorepo Root or Live Bridge
set "BRIDGE_DIR="
if exist "%GAME_DIR%..\..\apps\bridge" (
  for %%I in ("%GAME_DIR%..\..\apps\bridge") do set "BRIDGE_DIR=%%~fI"
) else if exist "C:\Workspace\PTPlay\apps\bridge" (
  set "BRIDGE_DIR=C:\Workspace\PTPlay\apps\bridge"
)

if defined BRIDGE_DIR (
  echo [PTPlay] Found Live Bridge at: %BRIDGE_DIR%
  echo [PTPlay] Starting PTPlay Live Bridge on Port 8088...
  start "PTPlay Live Bridge [Port 8088]" /D "%BRIDGE_DIR%" cmd /k "npm start"
) else (
  echo [PTPlay] Note: Bridge directory not found. Game will run in standalone offline mode.
)

echo.
echo [PTPlay] Starting English Class LIVE on Port 5175...
echo [PTPlay] Opening browser at http://localhost:5175 and Admin Center at http://localhost:8080 ...
start "PTPlay Browser Launcher" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5175 && timeout /t 1 /nobreak >nul && start http://localhost:8080"

call npm run dev

pause
