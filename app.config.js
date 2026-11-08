const { expo } = require("./app.json");
// Keep native development unchanged; the local review build lives under its project name.
module.exports = () => ({
  ...expo,
  experiments: {
    ...expo.experiments,
    ...(process.env.GOBY_REVIEW_BASE_PATH
      ? { baseUrl: process.env.GOBY_REVIEW_BASE_PATH }
      : {}),
  },
});
