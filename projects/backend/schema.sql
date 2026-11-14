CREATE TABLE IF NOT EXISTS figures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    clues_json TEXT NOT NULL,
    reveal TEXT NOT NULL,
    aliases_json TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS rounds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    figure_id INTEGER NOT NULL REFERENCES figures(id),
    status TEXT NOT NULL DEFAULT 'playing' CHECK (status IN ('playing', 'won', 'lost')),
    clues_revealed INTEGER NOT NULL DEFAULT 1 CHECK (clues_revealed BETWEEN 1 AND 6),
    guesses_json TEXT NOT NULL DEFAULT '[]',
    score INTEGER CHECK (score IS NULL OR score BETWEEN 0 AND 6),
    created_at TEXT NOT NULL,
    finished_at TEXT
);
