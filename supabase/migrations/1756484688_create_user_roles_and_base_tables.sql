-- Migration: create_user_roles_and_base_tables
-- Created at: 1756484688

-- Create custom enum types
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'parent', 'admin');
CREATE TYPE part_of_speech_type AS ENUM (
  'noun', 'verb', 'adjective', 'adverb', 'pronoun', 
  'preposition', 'conjunction', 'interjection'
);
CREATE TYPE learning_mode AS ENUM ('flashcards', 'quiz', 'spelling', 'review');
CREATE TYPE quiz_type AS ENUM ('multiple_choice', 'fill_blank', 'matching');
CREATE TYPE challenge_type AS ENUM ('daily', 'weekly', 'monthly', 'special');

-- 1. users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  grade_level INTEGER,
  date_of_birth DATE,
  parent_email TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- 2. vocabulary_lists table
CREATE TABLE vocabulary_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID,
  is_default BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  category TEXT NOT NULL,
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  target_grade_level INTEGER,
  word_count INTEGER DEFAULT 0,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- 3. vocabulary_words table
CREATE TABLE vocabulary_words (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL,
  word TEXT NOT NULL,
  part_of_speech part_of_speech_type,
  definition TEXT NOT NULL,
  simple_definition TEXT,
  example_sentence TEXT NOT NULL,
  example_context TEXT,
  synonyms TEXT[],
  antonyms TEXT[],
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  frequency_score INTEGER CHECK (frequency_score BETWEEN 1 AND 5),
  ssat_importance INTEGER CHECK (ssat_importance BETWEEN 1 AND 5),
  audio_url TEXT,
  image_url TEXT,
  pronunciation_guide TEXT,
  etymology TEXT,
  related_words TEXT[],
  usage_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sort_order INTEGER DEFAULT 0
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active, last_active);

CREATE INDEX idx_vocabulary_lists_created_by ON vocabulary_lists(created_by);
CREATE INDEX idx_vocabulary_lists_category ON vocabulary_lists(category);
CREATE INDEX idx_vocabulary_lists_difficulty ON vocabulary_lists(difficulty_level);
CREATE INDEX idx_vocabulary_lists_public ON vocabulary_lists(is_public, is_active);
CREATE INDEX idx_vocabulary_lists_tags ON vocabulary_lists USING GIN(tags);

CREATE INDEX idx_vocabulary_words_list_id ON vocabulary_words(list_id);
CREATE INDEX idx_vocabulary_words_word ON vocabulary_words(word);
CREATE INDEX idx_vocabulary_words_difficulty ON vocabulary_words(difficulty_level);
CREATE UNIQUE INDEX idx_vocabulary_words_unique ON vocabulary_words(list_id, word);;