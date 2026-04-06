#!/bin/sh
set -e

echo "🚀 QuestLog — Starting up..."

# ── Apply pending migrations ──────────────────────────────────
echo "⏳ Running database migrations..."
npx prisma migrate deploy
echo "✅ Migrations applied."

# ── Start the Next.js server ─────────────────────────────────
echo "🎮 Starting QuestLog on port ${PORT:-3000}..."
exec node server.js
