const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);
// SQLite's browser preview loads its database engine as a WebAssembly asset.
if (!config.resolver.assetExts.includes("wasm"))
  config.resolver.assetExts.push("wasm");
const previous = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
  const next = previous ? previous(middleware, server) : middleware;
  return (req, res, done) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    next(req, res, done);
  };
};
module.exports = config;
