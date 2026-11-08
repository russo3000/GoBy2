const { test } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const ts = require("typescript");
const fs = require("node:fs");
const Module = require("node:module");
const source = fs.readFileSync("src/data/recommendations.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const mod = new Module("recommendations");
mod._compile(compiled, "recommendations.js");
const {
  initializeDatabase,
  saveRecommendation,
  listRecommendations,
  createPlaceList,
  listPlaceLists,
  savePlace,
  readTheme,
  writeTheme,
} = mod.exports;

function adapter(database) {
  return {
    withTransactionAsync: async (fn) => {
      database.exec("BEGIN");
      try {
        await fn();
        database.exec("COMMIT");
      } catch (e) {
        database.exec("ROLLBACK");
        throw e;
      }
    },
    getFirstAsync: async (sql, ...params) =>
      database.prepare(sql).get(...params),
    execAsync: async (sql) => database.exec(sql),
    runAsync: async (sql, ...params) => {
      const result = database.prepare(sql).run(...params);
      return {
        changes: result.changes,
        lastInsertRowId: result.lastInsertRowid,
      };
    },
    getAllAsync: async (sql, ...params) => database.prepare(sql).all(...params),
  };
}

test("offline saves preserve personal tips and safely store quoted titles", async () => {
  const database = new DatabaseSync(":memory:");
  try {
    const db = adapter(database);
    await initializeDatabase(db);
    await initializeDatabase(db);
    await saveRecommendation(
      db,
      "  Friend's bakery  ",
      "  Ask for the omelette.  ",
    );
    await saveRecommendation(db, "'); DROP TABLE recommendations; --");
    const items = await listRecommendations(db);
    assert.equal(items.length, 2);
    assert.equal(items[1].title, "Friend's bakery");
    assert.equal(items[1].tip, "Ask for the omelette.");
    assert.equal(items[0].tip, "");
    await assert.rejects(saveRecommendation(db, "  "));
    await assert.rejects(saveRecommendation(db, "x".repeat(201)));
    await assert.rejects(saveRecommendation(db, "Valid spot", "x".repeat(501)));
    assert.equal((await listRecommendations(db)).length, 2);
  } finally {
    database.close();
  }
});

test("upgrades the original notebook without losing saves and enforces list references locally", async () => {
  const database = new DatabaseSync(":memory:");
  try {
    database.exec(
      "CREATE TABLE recommendations (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, tip TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT '2026-11-08T00:00:00Z'); INSERT INTO recommendations (title, tip) VALUES ('Sunset bench', 'Bring a blanket')",
    );
    const db = adapter(database);
    await initializeDatabase(db);
    await initializeDatabase(db);
    let places = await listRecommendations(db);
    assert.equal(places[0].tip, "Bring a blanket");
    assert.equal(places[0].list_id, 1);
    assert.equal(places[0].city, "");
    assert.equal(places[0].photo_uri, null);
    const listId = await createPlaceList(db, "  Sunday wandering  ");
    await assert.rejects(createPlaceList(db, "sunday WANDERING"));
    await assert.rejects(createPlaceList(db, "  "));
    await assert.rejects(
      savePlace(db, { title: "Cafe", city: "", tip: "", listId: 999 }),
    );
    const id = await savePlace(db, {
      title: "Baker's corner",
      city: " Barcelona ",
      tip: " Omelette! ",
      listId,
      photoUri: "file:///photos/bakery.jpg",
    });
    await savePlace(
      db,
      { title: "The bakery", city: "Barcelona", tip: "Ask nicely", listId: 1 },
      id,
    );
    places = await listRecommendations(db);
    assert.equal(places.length, 2);
    assert.equal(places[0].title, "The bakery");
    assert.equal(places[0].list_id, 1);
    assert.equal(places[0].photo_uri, null);
    assert.equal((await listPlaceLists(db)).length, 2);
    await assert.rejects(
      savePlace(db, { title: "Cafe", city: "x".repeat(81), tip: "", listId }),
    );
    await assert.rejects(
      savePlace(db, {
        title: "Cafe",
        city: "",
        tip: "",
        listId,
        photoUri: "https://example.com/a.jpg",
      }),
    );
    await assert.rejects(
      savePlace(db, { title: "Cafe", city: "", tip: "", listId }, 999),
    );
    assert.equal(await readTheme(db), null);
    await writeTheme(db, "night");
    await writeTheme(db, "day");
    assert.equal(await readTheme(db), "day");
  } finally {
    database.close();
  }
});

test("places and lists survive closing and reopening the database", async () => {
  const os = require("node:os"),
    path = require("node:path");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "goby-"));
  const filename = path.join(dir, "notebook.db");
  let database = new DatabaseSync(filename);
  try {
    await initializeDatabase(adapter(database));
    const listId = await createPlaceList(adapter(database), "Weekend");
    await savePlace(adapter(database), {
      title: "My quiet spot",
      city: "Girona",
      tip: "Before sunrise",
      listId,
    });
    database.close();
    database = new DatabaseSync(filename);
    await initializeDatabase(adapter(database));
    const places = await listRecommendations(adapter(database));
    assert.equal(places[0].city, "Girona");
    assert.equal(places[0].tip, "Before sunrise");
    assert.equal((await listPlaceLists(adapter(database)))[1].name, "Weekend");
  } finally {
    database.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
