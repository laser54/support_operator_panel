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

REM Run migrations
echo 🔄 Running database migrations...
cd backend
uv run alembic upgrade head
cd ..

echo.
echo 👤 Creating test user (admin/admin)...

REM Create test user
docker-compose exec -T db psql -U postgres -d support_panel -c "INSERT INTO users (username, email, hashed_password, role) VALUES ('admin', 'admin@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqVr/1jrYK', 'admin') ON CONFLICT (username) DO NOTHING;"

echo.
echo ✅ Setup complete!
echo.
echo 🌐 Services are running:
echo    - Backend API: http://localhost:8000
echo    - API Docs:    http://localhost:8000/docs
echo    - Frontend:    http://localhost:5173
echo.
echo 🔑 Test credentials:
echo    Username: admin
echo    Password: admin
echo.
echo 📝 Useful commands:
echo    make down      - Stop all services
echo    make db-shell  - Connect to database
echo    make lint      - Check code quality
echo.
echo Happy coding! 🎉
echo.
pause
