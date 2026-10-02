-- Users can ask for premium; admins see the request in the users list and grant it
-- Run: node server/scripts/run_migration.js ../database/migrations/004_premium_requests.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_requested_at TIMESTAMPTZ DEFAULT NULL;
