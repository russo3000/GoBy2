import type { SQLiteDatabase } from "expo-sqlite";

export type Recommendation = {
  id: number;
  title: string;
  tip: string;
  city: string;
  list_id: number;
  sort_order: number;
  photo_uri: string | null;
  created_at: string;
};
export type PlaceList = { id: number; name: string; position: number };
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
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );
      CREATE TABLE IF NOT EXISTS place_lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK(length(trim(name)) BETWEEN 1 AND 65),
        position INTEGER NOT NULL DEFAULT 0
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
          sort_order INTEGER NOT NULL DEFAULT 0,
          photo_uri TEXT
        );
        INSERT INTO recommendations_next (id, title, tip, created_at, city, list_id, sort_order)
          SELECT id, title, tip, created_at, ${columns.some((c) => c.name === "city") ? "city" : "''"}, 1, ${columns.some((c) => c.name === "sort_order") ? "sort_order" : "0"} FROM recommendations;
        DROP TABLE recommendations;
        ALTER TABLE recommendations_next RENAME TO recommendations;
      `);
    } else if (!columns.some((c) => c.name === "photo_uri")) {
      await db.execAsync(
        "ALTER TABLE recommendations ADD COLUMN photo_uri TEXT",
      );
    }
    const updatedColumns = await db.getAllAsync<{ name: string }>(
      "PRAGMA table_info(recommendations)",
    );
    if (!updatedColumns.some((c) => c.name === "sort_order")) {
      await db.execAsync(
        "ALTER TABLE recommendations ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0",
      );
    }
    const listColumns = await db.getAllAsync<{ name: string }>(
      "PRAGMA table_info(place_lists)",
    );
    if (!listColumns.some((c) => c.name === "position")) {
      await db.execAsync(`
        ALTER TABLE place_lists ADD COLUMN position INTEGER NOT NULL DEFAULT 0;
        UPDATE place_lists SET position = id;
      `);
    }
    await db.execAsync(
      "CREATE INDEX IF NOT EXISTS recommendations_list ON recommendations(list_id); PRAGMA user_version = 3;",
    );
  });
}

export function listRecommendations(db: SQLiteDatabase) {
  return db.getAllAsync<Recommendation>(
    "SELECT id, title, tip, city, list_id, sort_order, photo_uri, created_at FROM recommendations ORDER BY sort_order, id DESC",
  );
}

export function listPlaceLists(db: SQLiteDatabase) {
  return db.getAllAsync<PlaceList>(
    "SELECT id, name, position FROM place_lists ORDER BY position, id",
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
    "INSERT INTO place_lists (name, position) VALUES (?, COALESCE((SELECT MAX(position) + 1 FROM place_lists), 0))",
    value,
  );
  return Number(result.lastInsertRowId);
}

export async function renamePlaceList(
  db: SQLiteDatabase,
  id: number,
  name: string,
) {
  if (!Number.isSafeInteger(id) || id < 1)
    throw new Error("Choose a valid list.");
  const value = name.trim();
  if (!value || value.length > 65)
    throw new Error("Choose a list name of 1–65 characters.");
  const existing = await listPlaceLists(db);
  if (!existing.some((list) => list.id === id))
    throw new Error("This list could not be found.");
  if (
    existing.some(
      (list) =>
        list.id !== id &&
        list.name.toLocaleLowerCase() === value.toLocaleLowerCase(),
    )
  ) {
    throw new Error("You already have a list with that name.");
  }
  const result = await db.runAsync(
    "UPDATE place_lists SET name = ? WHERE id = ?",
    value,
    id,
  );
  if (result.changes !== 1) throw new Error("This list could not be found.");
}

function assertOrder(current: number[], ordered: number[], label: string) {
  if (
    ordered.length !== current.length ||
    new Set(ordered).size !== current.length ||
    ordered.some((id) => !current.includes(id))
  ) {
    throw new Error(`Choose a valid order for your ${label}.`);
  }
}

export async function setPlaceListOrder(
  db: SQLiteDatabase,
  orderedIds: number[],
) {
  const lists = await listPlaceLists(db);
  assertOrder(
    lists.map((list) => list.id),
    orderedIds,
    "lists",
  );
  await db.withTransactionAsync(async () => {
    for (const [position, id] of orderedIds.entries()) {
      await db.runAsync(
        "UPDATE place_lists SET position = ? WHERE id = ?",
        position,
        id,
      );
    }
  });
}

export async function setPlaceOrder(
  db: SQLiteDatabase,
  listId: number,
  orderedIds: number[],
) {
  if (!Number.isSafeInteger(listId) || listId < 1)
    throw new Error("Choose a valid list.");
  const places = await db.getAllAsync<{ id: number }>(
    "SELECT id FROM recommendations WHERE list_id = ? ORDER BY sort_order, id DESC",
    listId,
  );
  assertOrder(
    places.map((place) => place.id),
    orderedIds,
    "places",
  );
  await db.withTransactionAsync(async () => {
    for (const [sortOrder, id] of orderedIds.entries()) {
      await db.runAsync(
        "UPDATE recommendations SET sort_order = ? WHERE id = ? AND list_id = ?",
        sortOrder,
        id,
        listId,
      );
    }
  });
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
      "UPDATE recommendations SET title = ?, tip = ?, city = ?, list_id = ?, sort_order = CASE WHEN list_id = ? THEN sort_order ELSE 0 END, photo_uri = ? WHERE id = ?",
      title,
      tip,
      city,
      draft.listId,
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
