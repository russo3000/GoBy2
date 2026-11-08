const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { once } = require("node:events");
const { createReviewServer } = require("../scripts/review-server.cjs");

test("project gateway isolates builds, preserves SQLite headers, and reloads the project registry", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "goby-gateway-"));
  const config = path.join(root, "projects.json");
  fs.mkdirSync(path.join(root, "goby"));
  fs.writeFileSync(path.join(root, "goby", "index.html"), "<h1>Goby</h1>");
  fs.writeFileSync(path.join(root, "goby", "engine.wasm"), "wasm");
  fs.writeFileSync(path.join(root, "secret"), "not public");
  fs.symlinkSync(path.join(root, "secret"), path.join(root, "goby", "leak"));
  fs.writeFileSync(config, JSON.stringify({ Goby2: "./goby" }));
  const server = createReviewServer(config);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = "http://127.0.0.1:" + server.address().port;
  try {
    const index = await fetch(base + "/");
    assert.match(await index.text(), /href="\/Goby2\/"/);
    const redirect = await fetch(base + "/Goby2", { redirect: "manual" });
    assert.equal(redirect.status, 302);
    assert.equal(redirect.headers.get("location"), "/Goby2/");
    const page = await fetch(base + "/Goby2/");
    assert.equal(await page.text(), "<h1>Goby</h1>");
    assert.equal(page.headers.get("cross-origin-opener-policy"), "same-origin");
    assert.equal(
      page.headers.get("cross-origin-embedder-policy"),
      "require-corp",
    );
    const wasm = await fetch(base + "/Goby2/engine.wasm");
    assert.equal(wasm.headers.get("content-type"), "application/wasm");
    assert.equal((await fetch(base + "/Other/")).status, 404);
    assert.equal((await fetch(base + "/Goby2/leak")).status, 403);
    assert.equal((await fetch(base + "/Goby2/%2e%2e%2fsecret")).status, 400);
    assert.equal((await fetch(base + "/Goby2/.env")).status, 400);
    assert.equal(
      (await fetch(base + "/Goby2/", { method: "POST" })).status,
      405,
    );
    assert.equal(
      await (await fetch(base + "/Goby2/", { method: "HEAD" })).text(),
      "",
    );
    fs.writeFileSync(
      config,
      JSON.stringify({ Goby2: "./goby", Another: "./goby" }),
    );
    assert.equal(
      await (await fetch(base + "/Another/")).text(),
      "<h1>Goby</h1>",
    );
    assert.equal((await fetch(base + "/Goby2/missing.js")).status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(root, { recursive: true, force: true });
  }
});
