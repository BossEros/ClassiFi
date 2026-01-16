-- Add gradebook columns to submissions and assignments tables
-- This migration adds support for grade overrides and late penalty configuration

-- Add grade override tracking columns to submissions table
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS is_grade_overridden BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS override_feedback TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS overridden_at TIMESTAMP WITH TIME ZONE;

-- Add late penalty configuration columns to assignments table
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS late_penalty_enabled BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS late_penalty_config JSONB;

-- Comment: is_grade_overridden indicates whether the grade was manually set by a teacher
-- Comment: override_feedback stores the teacher's feedback for the override
-- Comment: overridden_at records when the override occurred
-- Comment: late_penalty_enabled toggles whether late submissions receive a penalty
-- Comment: late_penalty_config stores the penalty tier structure as JSON
