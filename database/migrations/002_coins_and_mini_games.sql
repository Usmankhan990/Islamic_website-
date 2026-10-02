-- Coins reward system + new mini game types (true/false, memory match, word jumble)
-- Run: node server/scripts/run_migration.js database/migrations/002_coins_and_mini_games.sql

-- Each user's coin balance
ALTER TABLE users ADD COLUMN IF NOT EXISTS coins INT NOT NULL DEFAULT 0;

-- Per-game reward settings, chosen by the admin
ALTER TABLE games ADD COLUMN IF NOT EXISTS coin_reward INT NOT NULL DEFAULT 10 CHECK (coin_reward >= 0);
ALTER TABLE games ADD COLUMN IF NOT EXISTS pass_percentage INT NOT NULL DEFAULT 80 CHECK (pass_percentage BETWEEN 1 AND 100);

-- New mini game types
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_type_check;
ALTER TABLE games ADD CONSTRAINT games_type_check
  CHECK (type IN ('quiz', 'matching', 'drag_drop', 'fill_blank', 'true_false', 'memory', 'word_jumble'));

-- Coins earned in each play
ALTER TABLE game_results ADD COLUMN IF NOT EXISTS coins_earned INT NOT NULL DEFAULT 0;

-- History of every coin change (for audit / showing kids where coins came from)
CREATE TABLE IF NOT EXISTS coin_transactions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  reason VARCHAR(255),
  game_id INT DEFAULT NULL REFERENCES games(id) ON DELETE SET NULL,
  game_result_id INT DEFAULT NULL REFERENCES game_results(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id);
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
