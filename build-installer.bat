@echo off
echo =============================================
echo Ascend UPSC Installer Build Script for Windows
echo =============================================

echo Checking if Node.js is installed...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Error: Node.js is not installed or not in PATH.
  echo Please install Node.js from https://nodejs.org/
  pause
  exit /b 1
)

echo Checking Node.js version...
node --version
if %ERRORLEVEL% NEQ 0 (
  echo Error checking Node.js version
  pause
  exit /b 1
)

echo Installing required dependencies...
npm install better-sqlite3 electron-builder esbuild --save-dev

echo Running database initialization if needed...
node initdb.cjs
if %ERRORLEVEL% NEQ 0 (
  echo Error initializing database
  pause
  exit /b 1
)

echo Converting icon files...
node convert-icon.js
if %ERRORLEVEL% NEQ 0 (
  echo Error converting icons
  pause
  exit /b 1
)

echo Starting the build process...
node build-installer.js
if %ERRORLEVEL% NEQ 0 (
  echo Build failed with error code %ERRORLEVEL%
  pause
  exit /b 1
)

pause