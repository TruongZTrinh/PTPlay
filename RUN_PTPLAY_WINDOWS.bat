@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title PTPlay Platform - Master Multi-Game Launcher

echo ========================================================
echo   PTPLAY PLATFORM - MASTER MULTI-GAME LAUNCHER
echo   Scalable TikTok LIVE Interactive Gaming Suite
echo ========================================================
echo [PTPlay] Root Directory: %CD%
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js / npm not found in system PATH.
  echo Please install Node.js LTS from https://nodejs.org/
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [PTPlay] First-time setup: Linking monorepo workspaces and dependencies...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
)

echo [PTPlay] Validating game registry...
call node scripts/validate-games.mjs
if errorlevel 1 (
  echo [ERROR] Game validation failed!
  pause
  exit /b 1
)

echo.
echo Select the game you want to launch with PTPlay:
echo [1] Mini War Arena (Port 5173 - Red vs Blue Battle)
echo [2] Cafe Moe (Port 5174 - Interactive Cozy Cat Cafe)
echo [3] English Class LIVE (Port 5175 - Bilingual Classroom & Trivia)
echo [4] PTPlay Quiz Show (Port 5176 - Do Vui Co Thuong Neon Gameshow)
echo [5] Duoi Hinh Bat Chu (Port 5177 - Vietnamese Rebus Word Puzzle)
echo [6] Platform Infrastructure Only (Bridge 8088 + Admin 8080)
echo.

set /p CHOICE="Enter your choice [1, 2, 3, 4, 5, or 6] (Default: 4): "
if "%CHOICE%"=="" set CHOICE=4

if "%CHOICE%"=="1" (
  echo [PTPlay] Starting Platform with Mini War Arena...
  start "PTPlay Browser" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:8080 & start http://localhost:5173"
  call npm run start:miniwar
) else if "%CHOICE%"=="2" (
  echo [PTPlay] Starting Platform with Cafe Moe...
  start "PTPlay Browser" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:8080 & start http://localhost:5174"
  call npm run start:catcafe
) else if "%CHOICE%"=="3" (
  echo [PTPlay] Starting Platform with English Class LIVE...
  start "PTPlay Browser" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:8080 & start http://localhost:5175"
  call npm run start:english
) else if "%CHOICE%"=="4" (
  echo [PTPlay] Starting Platform with PTPlay Quiz Show...
  start "PTPlay Browser" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:8080 & start http://localhost:5176"
  call npm run start:quiz
) else if "%CHOICE%"=="5" (
  echo [PTPlay] Starting Platform with Duoi Hinh Bat Chu...
  start "PTPlay Browser" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:8080 & start http://localhost:5177"
  call npm run start:rebus
) else (
  echo [PTPlay] Starting Platform Infrastructure (Bridge + Admin)...
  start "PTPlay Browser" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:8080"
  call npm run start
)

pause

