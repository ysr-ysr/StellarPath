-- Recruitment Workflow Schema adjustments

-- Ensure the extension exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add company_id to existing jobs table, making it reference companies(id).
-- If the table doesn't exist yet (e.g. fresh DB), we should probably recreate it.
-- But since it's an existing table, we'll alter it.
-- We allow company_id to be NULL temporarily if there are old jobs, but typically it should be NOT NULL.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'applied',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Prevent candidate from applying to the same job multiple times
  UNIQUE (job_id, candidate_id)
);
