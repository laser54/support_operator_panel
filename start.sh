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

# Run migrations
echo "🔄 Running database migrations..."
cd backend && uv run alembic upgrade head && cd ..

echo ""
echo "👤 Creating test user (admin/admin)..."

# Create test user
docker-compose exec -T db psql -U postgres -d support_panel << EOF
INSERT INTO users (username, email, hashed_password, role) 
VALUES (
  'admin', 
  'admin@example.com', 
  '\$2b\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqVr/1jrYK',
  'admin'
) ON CONFLICT (username) DO NOTHING;
EOF

echo ""
echo "✅ Setup complete!"
echo ""
echo "🌐 Services are running:"
echo "   - Backend API: http://localhost:8000"
echo "   - API Docs:    http://localhost:8000/docs"
echo "   - Frontend:    http://localhost:5173"
echo ""
echo "🔑 Test credentials:"
echo "   Username: admin"
echo "   Password: admin"
echo ""
echo "📝 Useful commands:"
echo "   make down      - Stop all services"
echo "   make db-shell  - Connect to database"
echo "   make lint      - Check code quality"
echo ""
echo "Happy coding! 🎉"
