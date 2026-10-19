@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed or is not on PATH.
  exit /b 1
)

if not exist ".env" (
  echo ERROR: .env was not found.
  echo Copy .env.example to .env and configure DATABASE_URL, JWT_SECRET,
  echo PORTFOLIO_SLUG, FRONTEND_ORIGIN, and NEXT_PUBLIC_API_URL first.
  exit /b 1
)

if not exist "node_modules\concurrently\dist\bin\concurrently.js" (
  echo ERROR: Project packages are missing. Run install-dependencies.bat first.
  exit /b 1
)
if not exist "backend\node_modules\@nestjs\core\nest-factory.js" if not exist "backend\node_modules\@nestjs\core\index.js" (
  echo ERROR: Backend packages are missing. Run install-dependencies.bat first.
  exit /b 1
)
if not exist "frontend\node_modules\next\package.json" (
  echo ERROR: Frontend packages are missing. Run install-dependencies.bat first.
  exit /b 1
)

echo Starting NestJS API and Next.js frontend...
echo Frontend: http://localhost:3000
echo API:      http://localhost:4000/api
echo Press Ctrl+C to stop both services.
call npm run dev
exit /b %errorlevel%
