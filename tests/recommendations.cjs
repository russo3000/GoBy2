const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const ts = require('typescript');
const fs = require('node:fs');
const Module = require('node:module');
const source = fs.readFileSync('src/data/recommendations.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const mod = new Module('recommendations');
mod._compile(compiled, 'recommendations.js');
const { initializeDatabase, saveRecommendation, listRecommendations } = mod.exports;

function adapter(database) {
  return {
    execAsync: async sql => database.exec(sql),
    runAsync: async (sql, ...params) => database.prepare(sql).run(...params),
    getAllAsync: async (sql, ...params) => database.prepare(sql).all(...params),
  };
}

test('offline saves preserve personal tips and safely store quoted titles', async () => {
  const database = new DatabaseSync(':memory:');
  try {
    const db = adapter(database);
    await initializeDatabase(db);
    await initializeDatabase(db);
    await saveRecommendation(db, "  Friend's bakery  ", '  Ask for the omelette.  ');
    await saveRecommendation(db, "'); DROP TABLE recommendations; --");
    const items = await listRecommendations(db);
    assert.equal(items.length, 2);
    assert.equal(items[1].title, "Friend's bakery");
    assert.equal(items[1].tip, 'Ask for the omelette.');
    assert.equal(items[0].tip, '');
    await assert.rejects(saveRecommendation(db, '  '));
    await assert.rejects(saveRecommendation(db, 'x'.repeat(201)));
    await assert.rejects(saveRecommendation(db, 'Valid spot', 'x'.repeat(501)));
    assert.equal((await listRecommendations(db)).length, 2);
  } finally { database.close(); }
});
