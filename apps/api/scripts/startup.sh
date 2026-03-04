#!/bin/sh

# Startup script for Diagnova
# This script initializes the database

set -e

echo "🏥 Diagnova - Startup"
echo "=========================================="

# Wait for database to be ready
echo "⏳ Waiting for PostgreSQL..."
until PGPASSWORD=$POSTGRES_PASSWORD psql -h "postgres" -U "medassist_user" -d "medassist" -c '\q' 2>/dev/null; do
  sleep 1
done
echo "✅ PostgreSQL is ready"

# Run database migrations
echo "📊 Running database migrations..."
cd /app
alembic upgrade head
echo "✅ Database migrations complete"

echo ""
echo "✅ Startup complete!"
echo "🚀 API ready at http://localhost:8000"
echo "📖 API docs at http://localhost:8000/docs"
echo ""
