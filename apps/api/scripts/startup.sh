#!/bin/sh

# Startup script for Diagnova

set -e

echo "Diagnova - Startup"
echo "=========================================="

# Wait for database using Python (works with any DATABASE_URL format)
echo "Waiting for PostgreSQL..."
python - << 'PYEOF'
import asyncio, os, sys, time

async def wait_for_db():
    import asyncpg
    raw_url = os.environ.get("DATABASE_URL", "")
    # asyncpg needs postgresql:// not postgresql+asyncpg://
    url = raw_url.replace("postgresql+asyncpg://", "postgresql://").replace("postgres://", "postgresql://")
    for attempt in range(30):
        try:
            conn = await asyncpg.connect(url)
            await conn.close()
            print("PostgreSQL is ready")
            return
        except Exception as e:
            print(f"  Waiting... attempt {attempt + 1}/30")
            await asyncio.sleep(2)
    print("Could not connect to PostgreSQL after 30 attempts")
    sys.exit(1)

asyncio.run(wait_for_db())
PYEOF

# Run database migrations
echo "Running database migrations..."
cd /app
alembic upgrade head
echo "Migrations complete"

echo ""
echo "Startup complete!"
echo ""
