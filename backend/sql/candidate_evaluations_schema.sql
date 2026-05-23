-- Candidate Evaluation & Email Notification
-- Run once: psql -U postgres -d stellarpath -f sql/candidate_evaluations_schema.sql

CREATE TABLE IF NOT EXISTS candidate_evaluations (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER NOT NULL,
  job_id INTEGER NOT NULL,
  skills_score INTEGER NOT NULL,
  projects_score INTEGER NOT NULL,
  interview_score INTEGER NOT NULL,
  overall_score INTEGER NOT NULL,
  recommendation VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidate_evaluations_job
  ON candidate_evaluations(job_id);

CREATE INDEX IF NOT EXISTS idx_candidate_evaluations_candidate
  ON candidate_evaluations(candidate_id);
