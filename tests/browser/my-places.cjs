const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    ...(process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {}),
    headless: true,
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  const errors = [];
  page.setDefaultTimeout(15000);
  try {
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(process.env.GOBY_TEST_URL || "http://localhost:8081");
    await page
      .getByRole("button", { name: "Save your first place", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Place name", exact: true })
      .fill("The little bakery");
    await page
      .getByRole("textbox", { name: "City or area · optional", exact: true })
      .fill("Barcelona");
    await page
      .getByRole("textbox", { name: "Your tip · optional", exact: true })
      .fill("Ask for the off-menu omelette.");
    await page
      .getByRole("button", { name: "＋ New list", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "New list name", exact: true })
      .fill("Slow Sundays");
    await page.getByRole("button", { name: "Save place", exact: true }).click();
    await page
      .getByRole("button", { name: "Edit Slow Sundays", exact: true })
      .click();
    await page.getByText("List position · 2 of 2", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Move list up", exact: true }).click();
    await page.getByText("List position · 1 of 2", { exact: true }).waitFor();
    const listName = page.getByRole("textbox", {
      name: "List name",
      exact: true,
    });
    await listName.fill("Places to keep");
    await page.getByRole("button", { name: "Save name", exact: true }).click();
    await page
      .getByText("You already have a list with that name.", { exact: true })
      .waitFor();
    await listName.fill("Slow Sundays in Barcelona");
    await page.getByRole("button", { name: "Save name", exact: true }).click();
    await page
      .getByRole("button", {
        name: "Edit Slow Sundays in Barcelona",
        exact: true,
      })
      .waitFor();
    const card = page.getByRole("button", {
      name: "The little bakery, Barcelona. Ask for the off-menu omelette.",
      exact: true,
    });
    await card.waitFor();
    await card.click();
    await page.getByRole("button", { name: "Edit place", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Your tip · optional", exact: true })
      .fill("Go early. Ask for the omelette.");
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await page
      .getByText("“Go early. Ask for the omelette.”", { exact: true })
      .waitFor();
    // Native-stack web back button preserves the screen underneath.
    await page.getByLabel("Home, back").click();
    await page
      .getByRole("button", { name: "Search my places", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Search my places", exact: true })
      .fill("Barcelona");
    await page
      .getByRole("button", {
        name: "The little bakery, Barcelona. Go early. Ask for the omelette.",
        exact: true,
      })
      .waitFor();
    await page
      .getByRole("textbox", { name: "Search my places", exact: true })
      .fill("no-such-place");
    await page
      .getByText("No places found for “no-such-place”.", { exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Close search", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Switch to night mode", exact: true })
      .click();
    await page.waitForTimeout(500);
    await page.reload();
    await page
      .getByRole("button", { name: "Switch to day mode", exact: true })
      .waitFor();
    await page
      .getByRole("button", {
        name: "The little bakery, Barcelona. Go early. Ask for the omelette.",
        exact: true,
      })
      .waitFor();

    await context.setOffline(true);
    await page
      .getByRole("button", { name: "Add a place", exact: true })
      .first()
      .click();
    await page
      .getByRole("textbox", { name: "Place name", exact: true })
      .fill("Sunset bench");
    await page.getByRole("button", { name: "Save place", exact: true }).click();
    await page
      .getByRole("button", { name: "Sunset bench. ", exact: true })
      .waitFor();
    for (const title of ["Garden gate", "Quiet courtyard"]) {
      await page
        .getByRole("button", { name: "Add a place", exact: true })
        .first()
        .click();
      await page
        .getByRole("textbox", { name: "Place name", exact: true })
        .fill(title);
      await page
        .getByRole("button", { name: "Save place", exact: true })
        .click();
      await page
        .getByRole("button", { name: title + ". ", exact: true })
        .waitFor();
    }
    const next = page.getByRole("button", {
      name: "Next places in Places to keep",
      exact: true,
    });
    await next.click();
    await page.waitForFunction(() => {
      const button = document.querySelector(
        '[aria-label="Previous places in Places to keep"]',
      );
      return button && button.getAttribute("aria-disabled") !== "true";
    });
    await page.getByRole("tab", { name: /Discover/ }).click();
    await page
      .getByText("Good places. Your people.", { exact: true })
      .waitFor();
    await page.getByRole("tab", { name: /Plans/ }).click();
    await page.getByText("Where shall we go?", { exact: true }).waitFor();
    await page.getByRole("tab", { name: /My places/ }).click();
    await page
      .getByRole("button", { name: "Search my places", exact: true })
      .waitFor();
    assert.deepEqual(errors, []);
    console.log(
      "PASS: create, rename, and reorder lists; save, detail, edit, search, empty results, persisted theme, reload durability, offline save; no page errors",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
