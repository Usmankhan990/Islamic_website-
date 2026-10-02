-- Game levels: each question belongs to a level; kids progress level by level
-- Run: node server/scripts/run_migration.js ../database/migrations/003_game_levels.sql

ALTER TABLE game_questions ADD COLUMN IF NOT EXISTS level INT NOT NULL DEFAULT 1 CHECK (level >= 1);
CREATE INDEX IF NOT EXISTS idx_game_questions_game_level ON game_questions(game_id, level);

-- Which level a result was for, and whether it was won
ALTER TABLE game_results ADD COLUMN IF NOT EXISTS level INT NOT NULL DEFAULT 1;
ALTER TABLE game_results ADD COLUMN IF NOT EXISTS passed BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill: older results count as passed if they reached the game's pass percentage
UPDATE game_results gr SET passed = TRUE
FROM games g
WHERE gr.game_id = g.id AND gr.total_points > 0
  AND gr.score * 100.0 / gr.total_points >= g.pass_percentage;

CREATE INDEX IF NOT EXISTS idx_game_results_user_game ON game_results(user_id, game_id, level);
