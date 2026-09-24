@echo off
TITLE Flipkart Full-Stack E-Commerce Platform
COLOR 0B

echo =======================================================
echo          FLIPKART FULL-STACK E-COMMERCE PLATFORM
echo          Frontend + Node/Express Backend + SQLite
echo =======================================================
echo.

cd /d "%~dp0\backend"

IF NOT EXIST "node_modules\" (
    echo [Setup] Installing backend dependencies...
    call npm install
)

IF NOT EXIST "database\flipkart.sqlite" (
    echo [Setup] Initializing and seeding Flipkart SQLite database...
    call node database\seed.js
)

echo.
echo [Starting] Launching Flipkart Full-Stack Server on port 5000...
echo [Info] Server URL: http://localhost:5000
echo.

start "" "http://localhost:5000"
node server.js

pause
