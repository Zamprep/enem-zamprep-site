CREATE TABLE questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_text TEXT NOT NULL,
  correct_answers TEXT NOT NULL,
  distractor_answers TEXT NOT NULL,
  difficulty_level INTEGER NOT NULL,
  approved INTEGER DEFAULT 0,
  times_used INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
