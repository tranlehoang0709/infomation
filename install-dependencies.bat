@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed or is not on PATH.
  echo Install the Node.js version listed in docs\SETUP.md, then retry.
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm is not installed or is not on PATH.
  exit /b 1
)

if not exist "package-lock.json" (
  echo ERROR: Root package-lock.json was not found.
  exit /b 1
)
if not exist "backend\package-lock.json" (
  echo ERROR: backend\package-lock.json was not found.
  exit /b 1
)
if not exist "frontend\package-lock.json" (
  echo ERROR: frontend\package-lock.json was not found.
  exit /b 1
)

echo Installing root tools...
call npm ci
if errorlevel 1 goto :failed

echo Installing backend packages...
call npm ci --prefix backend
if errorlevel 1 goto :failed

echo Installing frontend packages...
call npm ci --prefix frontend
if errorlevel 1 goto :failed

echo Generating Prisma Client from the existing schema...
call npm run db:generate --prefix backend
if errorlevel 1 goto :failed

echo.
echo Dependencies installed successfully.
echo This script does not create or modify the MySQL database.
exit /b 0

:failed
echo.
echo ERROR: Installation did not complete. Review the error above and retry.
exit /b 1
