import type { SQLiteDatabase } from 'expo-sqlite';

export type Recommendation = { id: number; title: string; tip: string; created_at: string };

// Local guest notebook only. Account data must use an account-scoped sync database.
export async function initializeDatabase(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 200),
      tip TEXT NOT NULL DEFAULT '' CHECK(length(tip) <= 500),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `);
}

export function listRecommendations(db: SQLiteDatabase) {
  return db.getAllAsync<Recommendation>(
    'SELECT id, title, tip, created_at FROM recommendations ORDER BY id DESC',
  );
}

export async function saveRecommendation(db: SQLiteDatabase, title: string, tip = '') {
  const trimmed = title.trim();
  if (!trimmed || trimmed.length > 200) throw new Error('Enter a title of 1–200 characters.');
  if (tip.trim().length > 500) throw new Error('Keep your tip within 500 characters.');
  await db.runAsync('INSERT INTO recommendations (title, tip) VALUES (?, ?)', trimmed, tip.trim());
}
