-- Add selected_profile_template column to jobs table
-- This stores the AI-generated candidate profile template selected by the client during job submission

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS selected_profile_template JSONB;

COMMENT ON COLUMN jobs.selected_profile_template IS 'AI-generated candidate profile template selected by client to guide sourcer search';













