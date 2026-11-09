#!/usr/bin/env bash
set -e

echo "================================================"
echo "🚀 PTPLAY MINI WAR ARENA V1.0 - GIT BASH LAUNCHER"
echo "================================================"

# 1. Check and install game dependencies if needed
if [ ! -d "node_modules/phaser" ]; then
  echo "📦 Installing Game dependencies..."
  npm install
fi

# 2. Check and install bridge dependencies if needed
if [ ! -d "ptplay-live-bridge/node_modules/ws" ]; then
  echo "📦 Installing Live Bridge dependencies..."
  npm install --prefix ptplay-live-bridge
fi

# 3. Start Live Bridge in background
echo "🔌 Starting PTPlay LIVE Bridge (Port 8088)..."
npm --prefix ptplay-live-bridge start &
BRIDGE_PID=$!

# Ensure Bridge process is cleaned up when user presses Ctrl+C
cleanup() {
  echo ""
  echo "🛑 Shutting down Live Bridge (PID $BRIDGE_PID)..."
  kill $BRIDGE_PID 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Give the bridge a moment to bind port 8088
sleep 2

# 4. Open browser tabs automatically on Windows
echo "🌐 Opening Game and Streamer Dashboard in browser..."
start "http://localhost:5173" 2>/dev/null || explorer.exe "http://localhost:5173" 2>/dev/null || true
start "http://127.0.0.1:8088/admin" 2>/dev/null || explorer.exe "http://127.0.0.1:8088/admin" 2>/dev/null || true

# 5. Start Vite Game Server (foreground)
echo "⚔️  Starting Mini War Arena (Vite on Port 5173)..."
npm run dev

