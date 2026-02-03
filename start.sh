#!/bin/bash

# Support Operator Panel - Quick Start Script
# This script helps you get the project running quickly

set -e

echo "🚀 Support Operator Panel - Quick Start"
echo "========================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Start services
echo "📦 Starting services (PostgreSQL, Backend, Frontend)..."
docker-compose up -d

echo ""
echo "⏳ Waiting for database to be ready..."
sleep 5

# Check if database is ready
until docker-compose exec -T db pg_isready -U postgres > /dev/null 2>&1; do
    echo "   Waiting for PostgreSQL..."
    sleep 2
done

echo "✅ Database is ready"
echo ""

# Run migrations inside Docker container
echo "🔄 Running database migrations..."
docker-compose exec -T backend uv run alembic upgrade head

echo ""
echo "📦 Loading test fixtures..."
docker-compose exec -T backend uv run python load_fixtures.py

echo ""
echo "✅ Setup complete!"
echo ""
echo "🌐 Services are running:"
echo "   - Backend API: http://localhost:8888"
echo "   - API Docs:    http://localhost:8888/docs"
echo "   - Frontend:    http://localhost:3001"
echo ""
echo "🔑 Test credentials:"
echo "   admin / admin (администратор)"
echo "   supervisor / supervisor123 (супервизор)"
echo "   operator1 / operator123 (оператор)"
echo ""
echo "📝 Useful commands:"
echo "   docker-compose down      - Stop all services"
echo "   docker-compose logs -f   - View logs"
echo "   docker-compose exec backend uv run python load_fixtures.py --force  - Reload fixtures"
echo ""
echo "Happy coding! 🎉"
