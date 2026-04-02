-- Islamic Learning Platform - Database Schema
-- Run this file to create all tables: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS islamic_platform;
USE islamic_platform;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'teacher', 'parent', 'child') DEFAULT 'parent',
  avatar VARCHAR(255) DEFAULT NULL,
  parent_id INT DEFAULT NULL,
  address TEXT DEFAULT NULL,
  city VARCHAR(100) DEFAULT NULL,
  country VARCHAR(100) DEFAULT NULL,
  phone VARCHAR(30) DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- PROGRESS TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  surah_number INT NOT NULL,
  surah_name VARCHAR(100),
  verses_memorized INT DEFAULT 0,
  total_verses INT NOT NULL,
  completion_pct DECIMAL(5,2) DEFAULT 0.00,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_surah (user_id, surah_number)
);

-- ============================================
-- ACHIEVEMENTS / BADGES
-- ============================================
CREATE TABLE IF NOT EXISTS achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  badge_name VARCHAR(100) NOT NULL,
  badge_icon VARCHAR(50) DEFAULT '🏆',
  description VARCHAR(255),
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- CERTIFICATES
-- ============================================
CREATE TABLE IF NOT EXISTS certificates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  pdf_url VARCHAR(500) DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- GAMES (Admin-created)
-- ============================================
CREATE TABLE IF NOT EXISTS games (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  type ENUM('quiz', 'matching', 'drag_drop', 'fill_blank') DEFAULT 'quiz',
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'easy',
  thumbnail VARCHAR(500) DEFAULT NULL,
  config_json JSON DEFAULT NULL,
  created_by INT,
  is_active BOOLEAN DEFAULT TRUE,
  play_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- GAME QUESTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS game_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  game_id INT NOT NULL,
  question_text TEXT NOT NULL,
  question_type ENUM('multiple_choice', 'true_false', 'fill_blank', 'matching') DEFAULT 'multiple_choice',
  options_json JSON DEFAULT NULL,
  correct_answer VARCHAR(500) NOT NULL,
  points INT DEFAULT 10,
  order_num INT DEFAULT 0,
  media_url VARCHAR(500) DEFAULT NULL,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- ============================================
-- GAME RESULTS
-- ============================================
CREATE TABLE IF NOT EXISTS game_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  game_id INT NOT NULL,
  user_id INT NOT NULL,
  score INT DEFAULT 0,
  total_points INT DEFAULT 0,
  correct_answers INT DEFAULT 0,
  total_questions INT DEFAULT 0,
  time_taken INT DEFAULT 0,
  played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- COMPETITIONS
-- ============================================
CREATE TABLE IF NOT EXISTS competitions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  type ENUM('recitation', 'quiz', 'hadith', 'general') DEFAULT 'quiz',
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  status ENUM('upcoming', 'live', 'completed', 'cancelled') DEFAULT 'upcoming',
  prize_description TEXT,
  max_participants INT DEFAULT 100,
  game_id INT DEFAULT NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- COMPETITION ENTRIES
-- ============================================
CREATE TABLE IF NOT EXISTS competition_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  competition_id INT NOT NULL,
  user_id INT NOT NULL,
  score INT DEFAULT 0,
  rank_position INT DEFAULT NULL,
  submission_url VARCHAR(500) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  judged_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_entry (competition_id, user_id)
);

-- ============================================
-- PRIZES / GIFTS
-- ============================================
CREATE TABLE IF NOT EXISTS prizes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  competition_id INT DEFAULT NULL,
  user_id INT NOT NULL,
  prize_name VARCHAR(200) NOT NULL,
  prize_description TEXT,
  shipping_status ENUM('pending', 'processing', 'shipped', 'delivered') DEFAULT 'pending',
  tracking_number VARCHAR(100) DEFAULT NULL,
  shipping_address TEXT DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- REVIEWS / FEEDBACK
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  rating INT DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  is_approved BOOLEAN DEFAULT FALSE,
  admin_response TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- LIVE CLASSES
-- ============================================
CREATE TABLE IF NOT EXISTS live_classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  teacher_name VARCHAR(100),
  description TEXT,
  platform ENUM('google_meet', 'zoom', 'teams', 'other') DEFAULT 'zoom',
  meeting_link VARCHAR(500) NOT NULL,
  meeting_id VARCHAR(100) DEFAULT NULL,
  scheduled_at DATETIME NOT NULL,
  duration_minutes INT DEFAULT 60,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_day ENUM('sunday','monday','tuesday','wednesday','thursday','friday','saturday') DEFAULT NULL,
  max_students INT DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- LESSONS
-- ============================================
CREATE TABLE IF NOT EXISTS lessons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'general',
  content_html LONGTEXT,
  media_url VARCHAR(500) DEFAULT NULL,
  game_id INT DEFAULT NULL,
  order_num INT DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- SEED DATA
-- ============================================

-- Admin user (password: admin123)
INSERT INTO users (name, email, password_hash, role) VALUES
('Admin', 'admin@islamicplatform.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Demo teacher
INSERT INTO users (name, email, password_hash, role) VALUES
('Teacher Ahmad', 'teacher@islamicplatform.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher');

-- Demo game
INSERT INTO games (title, description, type, difficulty, created_by, is_active) VALUES
('Surah Al-Fatiha Quiz', 'Test your knowledge of Surah Al-Fatiha', 'quiz', 'easy', 1, TRUE),
('Pillars of Islam', 'Learn the five pillars of Islam', 'quiz', 'easy', 1, TRUE),
('Prophet Stories Match', 'Match prophets with their stories', 'matching', 'medium', 1, TRUE);

-- Demo questions for Surah Al-Fatiha Quiz
INSERT INTO game_questions (game_id, question_text, question_type, options_json, correct_answer, points, order_num) VALUES
(1, 'How many verses are in Surah Al-Fatiha?', 'multiple_choice', '["5", "6", "7", "8"]', '7', 10, 1),
(1, 'Surah Al-Fatiha is also known as?', 'multiple_choice', '["The Opening", "The Cow", "The Light", "The Star"]', 'The Opening', 10, 2),
(1, 'Al-Fatiha is recited in every unit of?', 'multiple_choice', '["Fasting", "Prayer", "Hajj", "Zakat"]', 'Prayer', 10, 3),
(1, 'What does "Bismillah" mean?', 'multiple_choice', '["In the name of Allah", "Praise be to Allah", "Allah is Great", "Peace be upon you"]', 'In the name of Allah', 10, 4),
(1, 'Surah Al-Fatiha was revealed in which city?', 'multiple_choice', '["Madinah", "Makkah", "Taif", "Jerusalem"]', 'Makkah', 10, 5);

-- Demo questions for Pillars of Islam
INSERT INTO game_questions (game_id, question_text, question_type, options_json, correct_answer, points, order_num) VALUES
(2, 'What is the first pillar of Islam?', 'multiple_choice', '["Prayer", "Fasting", "Shahada", "Zakat"]', 'Shahada', 10, 1),
(2, 'How many times a day must a Muslim pray?', 'multiple_choice', '["3", "4", "5", "7"]', '5', 10, 2),
(2, 'In which month do Muslims fast?', 'multiple_choice', '["Shaban", "Ramadan", "Muharram", "Rajab"]', 'Ramadan', 10, 3),
(2, 'Zakat is what percentage of savings?', 'multiple_choice', '["1.5%", "2%", "2.5%", "5%"]', '2.5%', 10, 4),
(2, 'Hajj is performed in which city?', 'multiple_choice', '["Madinah", "Makkah", "Jerusalem", "Cairo"]', 'Makkah', 10, 5);

-- Demo live class
INSERT INTO live_classes (title, teacher_name, description, platform, meeting_link, scheduled_at, duration_minutes, created_by) VALUES
('Quran Recitation - Beginners', 'Teacher Ahmad', 'Learn basic Quran recitation with proper Tajweed', 'zoom', 'https://zoom.us/j/example', DATE_ADD(NOW(), INTERVAL 2 DAY), 60, 1),
('Islamic Stories for Kids', 'Teacher Ahmad', 'Fun and engaging stories of the Prophets', 'google_meet', 'https://meet.google.com/example', DATE_ADD(NOW(), INTERVAL 3 DAY), 45, 1);

-- Demo reviews
INSERT INTO reviews (user_id, content, rating, is_approved) VALUES
(2, 'Amazing platform for teaching children about Islam. My kids love the games!', 5, TRUE),
(2, 'The Quran reader with multiple languages is incredibly helpful. JazakAllah Khair!', 5, TRUE);
