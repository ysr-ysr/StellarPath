-- Interview Coach tables for StellarPath
-- Run once: psql -U postgres -d stellarpath -f sql/interview_schema.sql

CREATE TABLE IF NOT EXISTS interview_sessions (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER NOT NULL,
  job_description TEXT NOT NULL,
  difficulty VARCHAR(50) NOT NULL DEFAULT 'beginner',
  total_questions INTEGER NOT NULL,
  score INTEGER,
  strengths TEXT,
  weaknesses TEXT,
  recommendations TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interview_messages (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('assistant', 'user')),
  message TEXT NOT NULL,
  is_acceptable BOOLEAN,
  feedback TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_candidate
  ON interview_sessions(candidate_id);

CREATE INDEX IF NOT EXISTS idx_interview_messages_session
  ON interview_messages(session_id);
