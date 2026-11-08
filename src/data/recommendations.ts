import type { SQLiteDatabase } from "expo-sqlite";

export type Recommendation = {
  id: number;
  title: string;
  tip: string;
  city: string;
  list_id: number;
  photo_uri: string | null;
  created_at: string;
};
export type PlaceList = { id: number; name: string };
export type PlaceDraft = {
  title: string;
  tip: string;
  city: string;
  listId: number;
  photoUri?: string | null;
};

// Guest-only database. Authenticated sync must use a separate account-scoped database.
export async function initializeDatabase(db: SQLiteDatabase) {
  await db.execAsync("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS recommendations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 200),
        tip TEXT NOT NULL DEFAULT '' CHECK(length(tip) <= 500),
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );
      CREATE TABLE IF NOT EXISTS place_lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK(length(trim(name)) BETWEEN 1 AND 65)
      );
      INSERT OR IGNORE INTO place_lists (id, name) VALUES (1, 'Places to keep');
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    `);
    // Inspect columns so upgrading the original unversioned notebook is safe.
    const columns = await db.getAllAsync<{ name: string }>(
      "PRAGMA table_info(recommendations)",
    );
    if (!columns.some((c) => c.name === "list_id")) {
      // SQLite cannot add a non-null REFERENCES column with a default to populated
      // tables. Rebuild atomically so existing guest saves keep their IDs and tips.
      await db.execAsync(`
        CREATE TABLE recommendations_next (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 200),
          tip TEXT NOT NULL DEFAULT '' CHECK(length(tip) <= 500),
          created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
          city TEXT NOT NULL DEFAULT '' CHECK(length(city) <= 80),
          list_id INTEGER NOT NULL DEFAULT 1 REFERENCES place_lists(id),
          photo_uri TEXT
        );
        INSERT INTO recommendations_next (id, title, tip, created_at, city, list_id)
          SELECT id, title, tip, created_at, ${columns.some((c) => c.name === "city") ? "city" : "''"}, 1 FROM recommendations;
        DROP TABLE recommendations;
        ALTER TABLE recommendations_next RENAME TO recommendations;
      `);
    } else if (!columns.some((c) => c.name === "photo_uri")) {
      await db.execAsync(
        "ALTER TABLE recommendations ADD COLUMN photo_uri TEXT",
      );
    }
    await db.execAsync(
      "CREATE INDEX IF NOT EXISTS recommendations_list ON recommendations(list_id); PRAGMA user_version = 3;",
    );
  });
}

export function listRecommendations(db: SQLiteDatabase) {
  return db.getAllAsync<Recommendation>(
    "SELECT id, title, tip, city, list_id, photo_uri, created_at FROM recommendations ORDER BY id DESC",
  );
}

export function listPlaceLists(db: SQLiteDatabase) {
  return db.getAllAsync<PlaceList>(
    "SELECT id, name FROM place_lists ORDER BY id",
  );
}

export async function createPlaceList(db: SQLiteDatabase, name: string) {
  const value = name.trim();
  if (!value || value.length > 65)
    throw new Error("Choose a list name of 1–65 characters.");
  const existing = await listPlaceLists(db);
  if (
    existing.some(
      (list) => list.name.toLocaleLowerCase() === value.toLocaleLowerCase(),
    )
  ) {
    throw new Error("You already have a list with that name.");
  }
  const result = await db.runAsync(
    "INSERT INTO place_lists (name) VALUES (?)",
    value,
  );
  return Number(result.lastInsertRowId);
}

export async function savePlace(
  db: SQLiteDatabase,
  draft: PlaceDraft,
  id?: number,
) {
  const title = draft.title.trim(),
    tip = draft.tip.trim(),
    city = draft.city.trim();
  if (!title || title.length > 200)
    throw new Error("Enter a place name of 1–200 characters.");
  if (tip.length > 500) throw new Error("Keep your tip within 500 characters.");
  if (city.length > 80)
    throw new Error("Keep the city or area within 80 characters.");
  if (!Number.isSafeInteger(draft.listId) || draft.listId < 1)
    throw new Error("Choose a valid list.");
  const photoUri = draft.photoUri ?? null;
  if (photoUri && !photoUri.startsWith("file://"))
    throw new Error("Choose a photo stored on this device.");
  if (id !== undefined) {
    const result = await db.runAsync(
      "UPDATE recommendations SET title = ?, tip = ?, city = ?, list_id = ?, photo_uri = ? WHERE id = ?",
      title,
      tip,
      city,
      draft.listId,
      photoUri,
      id,
    );
    if (result.changes !== 1) throw new Error("This place could not be found.");
    return id;
  }
  const result = await db.runAsync(
    "INSERT INTO recommendations (title, tip, city, list_id, photo_uri) VALUES (?, ?, ?, ?, ?)",
    title,
    tip,
    city,
    draft.listId,
    photoUri,
  );
  return Number(result.lastInsertRowId);
}

// Keep the original notebook API for existing callers.
export async function saveRecommendation(
  db: SQLiteDatabase,
  title: string,
  tip = "",
) {
  return savePlace(db, { title, tip, city: "", listId: 1 });
}

export async function readTheme(
  db: SQLiteDatabase,
): Promise<"day" | "night" | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'theme'",
  );
  return row?.value === "day" || row?.value === "night" ? row.value : null;
}
export async function writeTheme(db: SQLiteDatabase, theme: "day" | "night") {
  await db.runAsync(
    "INSERT INTO settings (key, value) VALUES ('theme', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    theme,
  );
}
