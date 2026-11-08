const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { pipeline } = require("node:stream");

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".css": "text/css",
  ".wasm": "application/wasm",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
  ".map": "application/json",
};
const escape = (text) =>
  text.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function createReviewServer(configFile) {
  const configPath = path.resolve(configFile);
  return http.createServer((req, res) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store");
    const fail = (code, message) => {
      res.writeHead(code, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(message);
    };
    if (!["GET", "HEAD"].includes(req.method)) {
      res.setHeader("Allow", "GET, HEAD");
      return fail(405, "Method not allowed");
    }
    try {
      // Reload on each request so adding another project needs no restart.
      const projects = JSON.parse(fs.readFileSync(configPath, "utf8"));
      let pathname;
      try {
        pathname = decodeURIComponent((req.url || "/").split("?")[0]);
      } catch {
        return fail(400, "Invalid URL");
      }
      if (
        pathname.includes("\0") ||
        pathname.includes("\\") ||
        pathname
          .split("/")
          .some((part) => part === ".." || part.startsWith("."))
      )
        return fail(400, "Invalid path");
      if (pathname === "/") {
        const entries = Object.keys(projects)
          .map(
            (name) =>
              `<li><a href="/${encodeURIComponent(name)}/">${escape(name)}</a></li>`,
          )
          .join("");
        res.writeHead(200, { "Content-Type": mime[".html"] });
        return res.end(
          req.method === "HEAD"
            ? undefined
            : `<!doctype html><meta name="viewport" content="width=device-width"><title>Local projects</title><style>body{font:18px system-ui;max-width:650px;margin:60px auto;padding:24px;background:#faf8f2;color:#1e3038}li{margin:20px 0}a{color:#0969ae}</style><h1>Your local projects</h1><ul>${entries}</ul>`,
        );
      }
      const [, name, ...parts] = pathname.split("/");
      if (!Object.hasOwn(projects, name) || typeof projects[name] !== "string")
        return fail(404, "Project not found");
      if (pathname === `/${name}`) {
        res.writeHead(302, { Location: `/${encodeURIComponent(name)}/` });
        return res.end();
      }
      const root = fs.realpathSync(
        path.resolve(path.dirname(configPath), projects[name]),
      );
      let file = path.resolve(root, parts.join("/") || "index.html");
      if (!file.startsWith(root + path.sep)) return fail(403, "Forbidden");
      if (!fs.existsSync(file))
        return fail(404, "File not found. Rebuild this project if needed.");
      if (fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
      file = fs.realpathSync(file);
      if (!file.startsWith(root + path.sep) || !fs.statSync(file).isFile())
        return fail(403, "Forbidden");
      res.writeHead(200, {
        "Content-Type": mime[path.extname(file)] || "application/octet-stream",
      });
      if (req.method === "HEAD") return res.end();
      pipeline(fs.createReadStream(file), res, () => {});
    } catch {
      if (!res.headersSent)
        fail(
          503,
          "Project build not available. Run npm run review:build, then refresh.",
        );
      else res.destroy();
    }
  });
}
if (require.main === module) {
  const port = Number(process.env.GOBY_REVIEW_PORT || 80);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("Invalid GOBY_REVIEW_PORT");
  const server = createReviewServer(
    process.env.GOBY_PROJECTS_CONFIG ||
      path.join(__dirname, "..", "review-projects.json"),
  );
  server.on("error", (error) => {
    console.error(
      error.code === "EADDRINUSE"
        ? `Port ${port} is already in use. Stop the existing gateway or use GOBY_REVIEW_PORT=8080 npm run review:serve.`
        : error.code === "EACCES"
          ? "Port 80 requires permission on this system. Use GOBY_REVIEW_PORT=8080 npm run review:serve for http://localhost:8080/Goby2/."
          : error.message,
    );
    process.exitCode = 1;
  });
  server.listen(port, "127.0.0.1", () =>
    console.log(
      `Local projects: http://localhost${port === 80 ? "" : ":" + port}/\nGoby: http://localhost${port === 80 ? "" : ":" + port}/Goby2/\nKeep this terminal open. Press Ctrl+C to stop.`,
    ),
  );
}
module.exports = { createReviewServer };
