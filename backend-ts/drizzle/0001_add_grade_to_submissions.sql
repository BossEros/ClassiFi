    -- Add grade column to submissions table
    -- This column stores the auto-calculated grade based on test case results
    ALTER TABLE submissions ADD COLUMN IF NOT EXISTS grade INTEGER;

    -- Comment: Grade is calculated as floor((passed_tests / total_tests) * total_score)
    -- where total_score comes from the assignment's totalScore field
