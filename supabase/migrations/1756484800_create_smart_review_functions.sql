-- Migration: create_smart_review_functions
-- Created at: 1756484800

-- Function to get words that need review based on spaced repetition algorithm
CREATE OR REPLACE FUNCTION get_words_for_review(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    list_id UUID,
    word TEXT,
    part_of_speech TEXT,
    definition TEXT,
    simple_definition TEXT,
    example_sentence TEXT,
    example_context TEXT,
    synonyms TEXT[],
    antonyms TEXT[],
    difficulty_level INTEGER,
    frequency_score INTEGER,
    ssat_importance INTEGER,
    audio_url TEXT,
    image_url TEXT,
    pronunciation_guide TEXT,
    etymology TEXT,
    related_words TEXT[],
    usage_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    sort_order INTEGER,
    -- Progress fields
    current_level INTEGER,
    next_review TIMESTAMP WITH TIME ZONE,
    success_rate DECIMAL(5,2),
    is_learned BOOLEAN
)
LANGUAGE SQL
AS $$
SELECT 
    vw.id,
    vw.list_id,
    vw.word,
    vw.part_of_speech,
    vw.definition,
    vw.simple_definition,
    vw.example_sentence,
    vw.example_context,
    vw.synonyms,
    vw.antonyms,
    vw.difficulty_level,
    vw.frequency_score,
    vw.ssat_importance,
    vw.audio_url,
    vw.image_url,
    vw.pronunciation_guide,
    vw.etymology,
    vw.related_words,
    vw.usage_notes,
    vw.created_at,
    vw.updated_at,
    vw.sort_order,
    COALESCE(up.current_level, 0) as current_level,
    COALESCE(up.next_review, NOW()) as next_review,
    COALESCE(up.success_rate, 0.0) as success_rate,
    COALESCE(up.is_learned, FALSE) as is_learned
FROM vocabulary_words vw
LEFT JOIN user_progress up ON vw.id = up.word_id AND up.user_id = p_user_id
WHERE 
    -- Include words that need review (next_review is due or no progress exists)
    (up.next_review IS NULL OR up.next_review <= NOW())
ORDER BY 
    -- New words first (no progress)
    (up.id IS NULL) DESC,
    -- Then words with lower success rates
    COALESCE(up.success_rate, 0) ASC,
    -- Then words with lower levels
    COALESCE(up.current_level, 0) ASC,
    -- Then by difficulty and importance
    vw.difficulty_level ASC,
    vw.ssat_importance DESC,
    -- Random factor for variety
    RANDOM()
LIMIT p_limit;
$$;

-- Function to get daily learning statistics for a user
CREATE OR REPLACE FUNCTION get_daily_learning_stats(
    p_user_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE SQL
AS $$
SELECT json_build_object(
    'words_reviewed', (
        SELECT COUNT(*)
        FROM activity_log
        WHERE user_id = p_user_id
        AND DATE(created_at) = p_date
        AND activity_type LIKE '%_attempt'
    ),
    'words_learned_today', (
        SELECT COUNT(*)
        FROM user_progress
        WHERE user_id = p_user_id
        AND DATE(first_learned) = p_date
        AND is_learned = true
    ),
    'accuracy_today', (
        SELECT COALESCE(
            ROUND(
                (SUM(CASE WHEN (activity_data->>'is_correct')::boolean THEN 1 ELSE 0 END) * 100.0) / 
                NULLIF(COUNT(*), 0), 
                2
            ),
            0
        )
        FROM activity_log
        WHERE user_id = p_user_id
        AND DATE(created_at) = p_date
        AND activity_type LIKE '%_attempt'
        AND activity_data->>'is_correct' IS NOT NULL
    ),
    'points_earned_today', (
        SELECT COALESCE(SUM(points_earned), 0)
        FROM activity_log
        WHERE user_id = p_user_id
        AND DATE(created_at) = p_date
    ),
    'streak_count', (
        SELECT current_streak
        FROM user_gamification
        WHERE user_id = p_user_id
    )
);
$$;

-- Add missing columns to existing tables for Smart Review compatibility
-- Add is_completed column to learning_sessions if it doesn't exist
ALTER TABLE learning_sessions 
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

-- Update existing learning_sessions records
UPDATE learning_sessions 
SET is_completed = (session_end IS NOT NULL)
WHERE is_completed IS NULL;

-- Update user_progress table for better precision in spaced repetition
-- Change interval_days from INTEGER to DECIMAL(8,2) for more precision
ALTER TABLE user_progress 
ALTER COLUMN interval_days TYPE DECIMAL(8,2) USING interval_days::DECIMAL(8,2);

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_progress_next_review ON user_progress(user_id, next_review);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_date ON activity_log(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_completed ON learning_sessions(user_id, is_completed, session_start);
