@echo off
:: Ascend UPSC Application Starter

:: Navigate to the application directory (where this BAT file is located)
cd /d "%~dp0"

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Run the start script
node start-app.js

pause