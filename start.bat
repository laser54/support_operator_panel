@echo off
REM Support Operator Panel - Quick Start Script (Windows)
REM This script helps you get the project running quickly

echo.
echo 🚀 Support Operator Panel - Quick Start
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Docker is not running. Please start Docker and try again.
    exit /b 1
)

echo ✅ Docker is running
echo.

REM Start services
echo 📦 Starting services (PostgreSQL, Backend, Frontend)...
docker-compose up -d

echo.
echo ⏳ Waiting for database to be ready...
timeout /t 5 /nobreak >nul

:wait_db
docker-compose exec -T db pg_isready -U postgres >nul 2>&1
if %errorlevel% neq 0 (
    echo    Waiting for PostgreSQL...
    timeout /t 2 /nobreak >nul
    goto wait_db
)

echo ✅ Database is ready
echo.

REM Run migrations inside Docker container
echo 🔄 Running database migrations...
docker-compose exec -T backend uv run alembic upgrade head

echo.
echo 📦 Loading test fixtures...
docker-compose exec -T backend uv run python load_fixtures.py

echo.
echo ✅ Setup complete!
echo.
echo 🌐 Services are running:
echo    - Backend API: http://localhost:8888
echo    - API Docs:    http://localhost:8888/docs
echo    - Frontend:    http://localhost:3001
echo.
echo 🔑 Test credentials:
echo    admin / admin (администратор)
echo    supervisor / supervisor123 (супервизор)
echo    operator1 / operator123 (оператор)
echo.
echo 📝 Useful commands:
echo    docker-compose down      - Stop all services
echo    docker-compose logs -f   - View logs
echo    docker-compose exec backend uv run python load_fixtures.py --force  - Reload fixtures
echo.
echo Happy coding! 🎉
echo.
pause
