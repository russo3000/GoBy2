const { expo } = require("./app.json");
// Preserve the named web review path and give installable previews their own identity.
module.exports = () => ({
  ...expo,
  ...(process.env.APP_VARIANT === "preview" ? { name: "Goby Preview" } : {}),
  android: {
    ...expo.android,
    ...(process.env.APP_VARIANT === "preview"
      ? { package: "com.russo3000.goby.preview" }
      : {}),
  },
  experiments: {
    ...expo.experiments,
    ...(process.env.GOBY_REVIEW_BASE_PATH
      ? { baseUrl: process.env.GOBY_REVIEW_BASE_PATH }
      : {}),
  },
});
