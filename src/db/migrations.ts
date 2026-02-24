import { getDatabase, DB_PATH_EXPORT } from './database'

const SCHEMA = `
-- Fans table
CREATE TABLE IF NOT EXISTS fans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nickname TEXT,
  current_phase INTEGER DEFAULT 1,
  engagement_score INTEGER DEFAULT 0,
  power_dynamic TEXT DEFAULT 'neutral',
  preferences TEXT,
  discounts_offered TEXT DEFAULT '[]',
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  fan_id TEXT NOT NULL REFERENCES fans(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('fan', 'bot')),
  content TEXT NOT NULL,
  phase INTEGER NOT NULL,
  score_at_message INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- PPV Scripts table
CREATE TABLE IF NOT EXISTS ppv_scripts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content_text TEXT NOT NULL,
  price INTEGER NOT NULL,
  category TEXT,
  tags TEXT DEFAULT '[]',
  preview_text TEXT,
  cta_type TEXT DEFAULT 'soft',
  times_used INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  fan_id TEXT NOT NULL REFERENCES fans(id) ON DELETE CASCADE,
  ppv_id TEXT NOT NULL REFERENCES ppv_scripts(id) ON DELETE CASCADE,
  price_paid INTEGER NOT NULL,
  discount_applied INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_fan_id ON conversations(fan_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_purchases_fan_id ON purchases(fan_id);
CREATE INDEX IF NOT EXISTS idx_purchases_ppv_id ON purchases(ppv_id);
`

export function runMigrations(): void {
  const db = getDatabase()

  console.log(`Creating database at: ${DB_PATH_EXPORT}`)

  // Run schema
  db.exec(SCHEMA)

  console.log('Database schema created successfully')

  // Verify tables
  const tables = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`
    )
    .all() as { name: string }[]

  console.log('Tables created:', tables.map((t) => t.name).join(', '))
}

// Run migrations if called directly
if (process.argv[1]?.endsWith('migrations.ts')) {
  runMigrations()
  console.log('Migrations completed successfully')
}
