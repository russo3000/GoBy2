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
  renamePlaceList,
  setPlaceListOrder,
  setPlaceOrder,
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

test("lists can be renamed and reordered without losing their places", async () => {
  const database = new DatabaseSync(":memory:");
  try {
    const db = adapter(database);
    await initializeDatabase(db);
    const first = await createPlaceList(db, "First");
    const second = await createPlaceList(db, "Second");
    await renamePlaceList(db, first, "  Weekend  ");
    await assert.rejects(renamePlaceList(db, first, "Second"), /already have/);
    await assert.rejects(renamePlaceList(db, first, "  "));
    await assert.rejects(renamePlaceList(db, 999, "Missing"));

    await setPlaceListOrder(db, [second, first, 1]);
    let lists = await listPlaceLists(db);
    assert.deepEqual(lists.map((list) => list.id), [second, first, 1]);
    assert.equal(lists[1].name, "Weekend");
    await assert.rejects(setPlaceListOrder(db, [first, first, second]));

    const firstPlace = await savePlace(db, {
      title: "First place",
      tip: "",
      city: "",
      listId: first,
    });
    const secondPlace = await savePlace(db, {
      title: "Second place",
      tip: "",
      city: "",
      listId: first,
    });
    await setPlaceOrder(db, first, [firstPlace, secondPlace]);
    let items = (await listRecommendations(db)).filter(
      (place) => place.list_id === first,
    );
    assert.deepEqual(
      items.map((place) => place.id),
      [firstPlace, secondPlace],
    );
    await assert.rejects(setPlaceOrder(db, first, [firstPlace, firstPlace]));
    items = (await listRecommendations(db)).filter(
      (place) => place.list_id === first,
    );
    assert.deepEqual(
      items.map((place) => place.id),
      [firstPlace, secondPlace],
    );
  } finally {
    database.close();
  }
});

test("upgrades existing lists and places with ordering columns in place", async () => {
  const database = new DatabaseSync(":memory:");
  try {
    database.exec(`
      CREATE TABLE place_lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK(length(trim(name)) BETWEEN 1 AND 65)
      );
      INSERT INTO place_lists (id, name) VALUES (1, 'Places to keep'), (8, 'Weekend');
      CREATE TABLE recommendations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        tip TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT '2026-11-08T00:00:00Z',
        city TEXT NOT NULL DEFAULT '',
        list_id INTEGER NOT NULL DEFAULT 1 REFERENCES place_lists(id),
        photo_uri TEXT
      );
      INSERT INTO recommendations (id, title, tip, city, list_id, photo_uri)
        VALUES (12, 'Quiet cafe', 'Before noon', 'Girona', 8, 'file:///cafe.jpg');
    `);
    const db = adapter(database);
    await initializeDatabase(db);
    const lists = await listPlaceLists(db);
    assert.deepEqual(
      lists.map((list) => [list.id, list.name, list.position]),
      [
        [1, "Places to keep", 1],
        [8, "Weekend", 8],
      ],
    );
    const place = (await listRecommendations(db))[0];
    assert.equal(place.id, 12);
    assert.equal(place.tip, "Before noon");
    assert.equal(place.city, "Girona");
    assert.equal(place.list_id, 8);
    assert.equal(place.sort_order, 0);
    assert.equal(place.photo_uri, "file:///cafe.jpg");
    const newList = await createPlaceList(db, "Later");
    assert.equal((await listPlaceLists(db)).at(-1).id, newList);
  } finally {
    database.close();
  }
});
