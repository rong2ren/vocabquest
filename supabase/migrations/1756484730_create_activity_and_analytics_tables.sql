-- Migration: create_activity_and_analytics_tables
-- Created at: 1756484730

-- 10. learning_sessions table (track study sessions)
CREATE TABLE learning_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  mode learning_mode NOT NULL,
  words_studied INTEGER DEFAULT 0,
  words_correct INTEGER DEFAULT 0,
  accuracy_percentage DECIMAL(5,2),
  points_earned INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. quiz_attempts table (detailed quiz tracking)
CREATE TABLE quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID,
  word_id UUID NOT NULL,
  quiz_type quiz_type NOT NULL,
  question TEXT NOT NULL,
  user_answer TEXT,
  correct_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_taken_seconds INTEGER,
  hint_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. spelling_attempts table (spelling mode tracking)
CREATE TABLE spelling_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID,
  word_id UUID NOT NULL,
  user_spelling TEXT NOT NULL,
  correct_spelling TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  attempts_count INTEGER DEFAULT 1,
  hints_used INTEGER DEFAULT 0,
  time_taken_seconds INTEGER,
  mistake_analysis JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. user_word_lists table (user's assigned/custom word lists)
CREATE TABLE user_word_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  list_id UUID NOT NULL,
  assigned_by UUID,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  words_mastered INTEGER DEFAULT 0,
  last_studied TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. daily_goals table (daily learning goals)
CREATE TABLE daily_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_date DATE NOT NULL,
  target_words INTEGER DEFAULT 10,
  target_minutes INTEGER DEFAULT 20,
  target_accuracy DECIMAL(5,2) DEFAULT 80.00,
  words_completed INTEGER DEFAULT 0,
  minutes_completed INTEGER DEFAULT 0,
  current_accuracy DECIMAL(5,2) DEFAULT 0.00,
  is_completed BOOLEAN DEFAULT FALSE,
  bonus_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. activity_log table (comprehensive activity tracking)
CREATE TABLE activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  activity_data JSONB DEFAULT '{}',
  points_earned INTEGER DEFAULT 0,
  session_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for activity and analytics tables
CREATE INDEX idx_learning_sessions_user_id ON learning_sessions(user_id);
CREATE INDEX idx_learning_sessions_start ON learning_sessions(session_start);
CREATE INDEX idx_learning_sessions_mode ON learning_sessions(mode);
CREATE INDEX idx_learning_sessions_user_date ON learning_sessions(user_id, session_start);

CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_word_id ON quiz_attempts(word_id);
CREATE INDEX idx_quiz_attempts_session_id ON quiz_attempts(session_id);
CREATE INDEX idx_quiz_attempts_created_at ON quiz_attempts(created_at);

CREATE INDEX idx_spelling_attempts_user_id ON spelling_attempts(user_id);
CREATE INDEX idx_spelling_attempts_word_id ON spelling_attempts(word_id);
CREATE INDEX idx_spelling_attempts_session_id ON spelling_attempts(session_id);
CREATE INDEX idx_spelling_attempts_created_at ON spelling_attempts(created_at);

CREATE INDEX idx_user_word_lists_user_id ON user_word_lists(user_id);
CREATE INDEX idx_user_word_lists_list_id ON user_word_lists(list_id);
CREATE INDEX idx_user_word_lists_active ON user_word_lists(is_active);
CREATE UNIQUE INDEX idx_user_word_lists_unique ON user_word_lists(user_id, list_id);

CREATE INDEX idx_daily_goals_user_id ON daily_goals(user_id);
CREATE INDEX idx_daily_goals_date ON daily_goals(goal_date);
CREATE INDEX idx_daily_goals_user_date ON daily_goals(user_id, goal_date);

CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_type ON activity_log(activity_type);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at);
CREATE INDEX idx_activity_log_user_created ON activity_log(user_id, created_at);;