-- Islamic Learning Platform - PostgreSQL (Supabase) Schema
-- Run: node server/scripts/migrate_to_supabase.js  (creates tables + copies data from MySQL)

-- Keeps updated_at current on every UPDATE (replaces MySQL's ON UPDATE CURRENT_TIMESTAMP)
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- USERS
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'parent' CHECK (role IN ('admin', 'teacher', 'parent', 'child')),
  avatar VARCHAR(255) DEFAULT NULL,
  parent_id INT DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  address TEXT DEFAULT NULL,
  city VARCHAR(100) DEFAULT NULL,
  country VARCHAR(100) DEFAULT NULL,
  phone VARCHAR(30) DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  subscription_type VARCHAR(20) DEFAULT 'free' CHECK (subscription_type IN ('free', 'premium')),
  subscription_expires TIMESTAMP DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_parent_id ON users(parent_id);

-- ============================================
-- PROGRESS TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS progress (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  surah_number INT NOT NULL,
  surah_name VARCHAR(100),
  verses_memorized INT DEFAULT 0,
  total_verses INT NOT NULL,
  completion_pct DECIMAL(5,2) DEFAULT 0.00,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_surah UNIQUE (user_id, surah_number)
);

-- ============================================
-- ACHIEVEMENTS / BADGES
-- ============================================
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_name VARCHAR(100) NOT NULL,
  badge_icon VARCHAR(50) DEFAULT '🏆',
  description VARCHAR(255),
  earned_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);

-- ============================================
-- CERTIFICATES
-- ============================================
CREATE TABLE IF NOT EXISTS certificates (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  pdf_url VARCHAR(500) DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);

-- ============================================
-- GAMES
-- ============================================
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  type VARCHAR(20) DEFAULT 'quiz' CHECK (type IN ('quiz', 'matching', 'drag_drop', 'fill_blank')),
  difficulty VARCHAR(20) DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  thumbnail VARCHAR(500) DEFAULT NULL,
  config_json JSONB DEFAULT NULL,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  play_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_games_created_by ON games(created_by);

CREATE TABLE IF NOT EXISTS game_questions (
  id SERIAL PRIMARY KEY,
  game_id INT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'fill_blank', 'matching')),
  options_json JSONB DEFAULT NULL,
  correct_answer VARCHAR(500) NOT NULL,
  points INT DEFAULT 10,
  order_num INT DEFAULT 0,
  media_url VARCHAR(500) DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS idx_game_questions_game_id ON game_questions(game_id);

CREATE TABLE IF NOT EXISTS game_results (
  id SERIAL PRIMARY KEY,
  game_id INT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INT DEFAULT 0,
  total_points INT DEFAULT 0,
  correct_answers INT DEFAULT 0,
  total_questions INT DEFAULT 0,
  time_taken INT DEFAULT 0,
  played_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_game_results_game_id ON game_results(game_id);
CREATE INDEX IF NOT EXISTS idx_game_results_user_id ON game_results(user_id);

-- ============================================
-- COMPETITIONS
-- ============================================
CREATE TABLE IF NOT EXISTS competitions (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  type VARCHAR(20) DEFAULT 'quiz' CHECK (type IN ('recitation', 'quiz', 'hadith', 'general')),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed', 'cancelled')),
  prize_description TEXT,
  max_participants INT DEFAULT 100,
  game_id INT DEFAULT NULL REFERENCES games(id) ON DELETE SET NULL,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS competition_entries (
  id SERIAL PRIMARY KEY,
  competition_id INT NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INT DEFAULT 0,
  rank_position INT DEFAULT NULL,
  submission_url VARCHAR(500) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  judged_at TIMESTAMPTZ DEFAULT NULL,
  audio_url VARCHAR(500) DEFAULT NULL,
  CONSTRAINT unique_entry UNIQUE (competition_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_competition_entries_user_id ON competition_entries(user_id);

CREATE TABLE IF NOT EXISTS competition_votes (
  id SERIAL PRIMARY KEY,
  entry_id INT NOT NULL REFERENCES competition_entries(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_vote UNIQUE (entry_id, user_id)
);

-- ============================================
-- PRIZES
-- ============================================
CREATE TABLE IF NOT EXISTS prizes (
  id SERIAL PRIMARY KEY,
  competition_id INT DEFAULT NULL REFERENCES competitions(id) ON DELETE SET NULL,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prize_name VARCHAR(200) NOT NULL,
  prize_description TEXT,
  shipping_status VARCHAR(20) DEFAULT 'pending' CHECK (shipping_status IN ('pending', 'processing', 'shipped', 'delivered')),
  tracking_number VARCHAR(100) DEFAULT NULL,
  shipping_address TEXT DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REVIEWS
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  rating INT DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  is_approved BOOLEAN DEFAULT FALSE,
  admin_response TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LIVE CLASSES
-- ============================================
CREATE TABLE IF NOT EXISTS live_classes (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  teacher_name VARCHAR(100),
  description TEXT,
  platform VARCHAR(20) DEFAULT 'zoom' CHECK (platform IN ('google_meet', 'zoom', 'teams', 'other')),
  meeting_link VARCHAR(500) NOT NULL,
  meeting_id VARCHAR(100) DEFAULT NULL,
  scheduled_at TIMESTAMP NOT NULL,
  duration_minutes INT DEFAULT 60,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_day VARCHAR(10) DEFAULT NULL CHECK (recurrence_day IN ('sunday','monday','tuesday','wednesday','thursday','friday','saturday')),
  max_students INT DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS class_requests (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  topic VARCHAR(255) DEFAULT NULL,
  preferred_time VARCHAR(100) DEFAULT NULL,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_response TEXT,
  meeting_link VARCHAR(500) DEFAULT NULL,
  schedule_time TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LESSONS
-- ============================================
CREATE TABLE IF NOT EXISTS lessons (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'general',
  content_html TEXT,
  media_url VARCHAR(500) DEFAULT NULL,
  game_id INT DEFAULT NULL REFERENCES games(id) ON DELETE SET NULL,
  order_num INT DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AI KNOWLEDGE BASE
-- ============================================
CREATE TABLE IF NOT EXISTS ai_knowledge_base (
  id SERIAL PRIMARY KEY,
  category VARCHAR(20) NOT NULL CHECK (category IN ('hadith', 'quran', 'fiqh', 'dua', 'general')),
  question TEXT,
  answer TEXT NOT NULL,
  source VARCHAR(255) DEFAULT NULL,
  reference_id VARCHAR(100) DEFAULT NULL,
  keywords TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WEEKLY LEARNING
-- ============================================
CREATE TABLE IF NOT EXISTS weekly_topics (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  content_type VARCHAR(20) DEFAULT 'quran' CHECK (content_type IN ('quran', 'hadith', 'custom')),
  content_data JSONB NOT NULL,
  target_audience VARCHAR(20) DEFAULT 'all' CHECK (target_audience IN ('kids', 'adults', 'all')),
  difficulty VARCHAR(20) DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weekly_quizzes (
  id SERIAL PRIMARY KEY,
  topic_id INT NOT NULL REFERENCES weekly_topics(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  quiz_type VARCHAR(20) DEFAULT 'practice' CHECK (quiz_type IN ('practice', 'live_final')),
  time_limit_minutes INT DEFAULT 15,
  is_active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weekly_quiz_questions (
  id SERIAL PRIMARY KEY,
  quiz_id INT NOT NULL REFERENCES weekly_quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options_json JSONB NOT NULL,
  correct_answer VARCHAR(500) NOT NULL,
  explanation TEXT,
  points INT DEFAULT 10,
  order_num INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS weekly_quiz_results (
  id SERIAL PRIMARY KEY,
  quiz_id INT NOT NULL REFERENCES weekly_quizzes(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INT DEFAULT 0,
  total_points INT DEFAULT 0,
  correct_count INT DEFAULT 0,
  total_questions INT DEFAULT 0,
  time_taken INT DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_attempt UNIQUE (quiz_id, user_id)
);

-- ============================================
-- updated_at triggers
-- ============================================
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_progress_updated_at ON progress;
CREATE TRIGGER trg_progress_updated_at BEFORE UPDATE ON progress FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_games_updated_at ON games;
CREATE TRIGGER trg_games_updated_at BEFORE UPDATE ON games FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_prizes_updated_at ON prizes;
CREATE TRIGGER trg_prizes_updated_at BEFORE UPDATE ON prizes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_lessons_updated_at ON lessons;
CREATE TRIGGER trg_lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- Row Level Security
-- The Express backend connects as the postgres role (bypasses RLS).
-- Enabling RLS with no policies blocks Supabase's public REST API (anon key)
-- from reading tables like users.password_hash.
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_quiz_results ENABLE ROW LEVEL SECURITY;

-- ============================================
-- COINS + MINI GAMES (same as migrations/002_coins_and_mini_games.sql)
-- ============================================
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

-- ============================================
-- GAME LEVELS (same as migrations/003_game_levels.sql)
-- ============================================
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

-- PREMIUM REQUESTS (same as migrations/004_premium_requests.sql)
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_requested_at TIMESTAMPTZ DEFAULT NULL;
