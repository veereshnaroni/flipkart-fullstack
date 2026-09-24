#!/bin/bash

echo "======================================================="
echo "       FLIPKART FULL-STACK E-COMMERCE PLATFORM"
echo "       Frontend + Node/Express Backend + SQLite"
echo "======================================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/backend"

if [ ! -d "node_modules" ]; then
    echo "[Setup] Installing backend dependencies..."
    npm install
fi

if [ ! -f "database/flipkart.sqlite" ]; then
    echo "[Setup] Initializing and seeding Flipkart SQLite database..."
    node database/seed.js
fi

echo ""
echo "[Starting] Launching Flipkart Server on http://localhost:5000"
echo ""

# Try opening in browser
if which xdg-open > /dev/null; then
    xdg-open "http://localhost:5000" &
elif which open > /dev/null; then
    open "http://localhost:5000" &
fi

node server.js
