#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PATH="$SCRIPT_DIR/.node/bin:$PATH"

echo "========================================================"
echo "🚀 Starting SMS - Self Management System Backend Server"
echo "📡 Server URL: http://localhost:3000"
echo "💾 SQLite DB:  $SCRIPT_DIR/backend/sms_system.db"
echo "========================================================"

node "$SCRIPT_DIR/backend/server.js"
