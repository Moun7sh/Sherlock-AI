#!/bin/bash
set -e

echo ""
echo "  🔍 Sherlock AI — First-time setup"
echo ""

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "  ✗ Node.js is required but not installed."; exit 1; }
echo "  ✓ Node.js $(node -v)"

# Check for PostgreSQL
if command -v psql >/dev/null 2>&1; then
  echo "  ✓ PostgreSQL client found"
else
  echo "  ⚠ PostgreSQL client not found — using Docker or ensure DATABASE_URL is set"
fi

# Install dependencies
echo ""
echo "  Installing dependencies..."
npm install

# Generate Prisma client
echo ""
echo "  Generating Prisma client..."
npx prisma generate --schema prisma/schema.prisma

# Check if DATABASE_URL is reachable
echo ""
echo "  Checking database connection..."
if npx prisma migrate deploy --schema prisma/schema.prisma 2>/dev/null; then
  echo "  ✓ Database connected, migrations applied"
else
  echo "  ⚠ Database not reachable. Options:"
  echo "    1. Start PostgreSQL: docker compose up -d db"
  echo "    2. Set DATABASE_URL in .env"
  echo "    Then run: npm run db:migrate"
fi

# Seed
echo ""
echo "  Seeding database..."
if npm run db:seed 2>/dev/null; then
  echo "  ✓ Seed complete"
else
  echo "  ⚠ Seed skipped (database may not be ready)"
fi

echo ""
echo "  ✅ Setup complete!"
echo ""
echo "  To start:  npm run dev"
echo "  Login:     KSP-4471 / sherlock2026"
echo ""
