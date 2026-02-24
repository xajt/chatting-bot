import Database from 'better-sqlite3'
import * as path from 'node:path'
import * as fs from 'node:fs'

const DB_DIR = path.join(process.cwd(), 'data')
const DB_PATH = path.join(DB_DIR, 'chatbot.db')

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    // Ensure data directory exists
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true })
    }

    db = new Database(DB_PATH)

    // Enable WAL mode for better reliability
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')

    // Handle cleanup on exit
    process.on('exit', () => {
      db?.close()
    })
  }

  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

export const DB_PATH_EXPORT = DB_PATH
