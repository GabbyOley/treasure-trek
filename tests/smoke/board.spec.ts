import { expect, test } from "@playwright/test";

test("board opens, renders, and rolls", async ({ page }) => {
  const consoleErrors: string[] = [];
  const runtimeErrors: string[] = [];

  page.on("console", (message) => {
    const text = message.text();

    if (
      message.type() === "error" &&
      !text.includes("Failed to load resource")
    ) {
      consoleErrors.push(text);
    }
  });
  page.on("pageerror", (error) => {
    runtimeErrors.push(error.message);
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "TREASURE TREK" })).toBeVisible();
  await page.getByTestId("play-computer").click();

  await expect(page.getByTestId("board-screen")).toBeVisible();
  await expect(page.getByTestId("html-board")).toBeVisible();
  await expect(page.getByTestId("board-space")).toHaveCount(66);
  await expect(page.getByTestId("player-token")).toHaveCount(2);
  await expect(page.getByTestId("board-track-line").first()).toBeVisible();
  expect(await page.getByTestId("board-track-line").count()).toBeGreaterThan(40);
  await expect(page.locator('[data-space-id="start"]')).toBeVisible();
  await expect(page.locator('[data-space-id="finish"]')).toBeVisible();
  await expect(page.locator('[data-space-id="meadow-1"] .html-board-space-label')).toHaveText(
    "Meadow",
  );
  await expect(page.locator('[data-space-id="pond-1"] .html-board-space-label')).toHaveText(
    "Pond",
  );
  await expect(page.locator('[data-space-id="river-1"] .html-board-space-label')).toHaveText(
    "River",
  );
  await expect(page.locator('[data-space-id="shipwreck-1"] .html-board-space-label')).toHaveText(
    "Shipwreck",
  );
  await expect(page.locator('[data-space-id="finish"] .html-board-space-label')).toHaveText(
    "Finish",
  );

  const boardBox = await page.getByTestId("html-board").boundingBox();
  const statusBox = await page.locator(".board-status-panel").boundingBox();
  const firstSpaceBox = await page.getByTestId("board-space").first().boundingBox();
  const startBox = await page.locator('[data-space-id="start"]').boundingBox();
  const finishBox = await page.locator('[data-space-id="finish"]').boundingBox();
  const playerTokenBoxes = await page.getByTestId("player-token").evaluateAll((tokens) =>
    tokens.map((token) => token.getBoundingClientRect()).map((box) => ({
      left: box.left,
      top: box.top,
      width: box.width,
      height: box.height,
    })),
  );
  const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const viewport = page.viewportSize();

  expect(boardBox?.width ?? 0).toBeGreaterThan(300);
  expect(boardBox?.height ?? 0).toBeGreaterThan(300);
  expect(firstSpaceBox?.width ?? 0).toBeGreaterThanOrEqual(20);
  expect(firstSpaceBox?.height ?? 0).toBeGreaterThanOrEqual(20);
  expect(startBox?.width ?? 0).toBeGreaterThanOrEqual(20);
  expect(finishBox?.width ?? 0).toBeGreaterThanOrEqual(20);
  expect(playerTokenBoxes).toHaveLength(2);

  if (viewport !== null && firstSpaceBox !== null) {
    expect(firstSpaceBox.x).toBeGreaterThanOrEqual(0);
    expect(firstSpaceBox.y).toBeGreaterThanOrEqual(0);
    expect(firstSpaceBox.x + firstSpaceBox.width).toBeLessThanOrEqual(viewport.width);
    expect(firstSpaceBox.y + firstSpaceBox.height).toBeLessThanOrEqual(viewport.height);
  }

  if (viewport !== null && startBox !== null && finishBox !== null) {
    for (const box of [startBox, finishBox]) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    }
  }

  if (viewport !== null) {
    expect(pageWidth).toBeLessThanOrEqual(viewport.width + 1);
  }

  if (viewport !== null && viewport.width > 480 && boardBox !== null && statusBox !== null) {
    expect(boardBox.x + boardBox.width).toBeLessThanOrEqual(statusBox.x);
    expect(statusBox.y).toBeLessThanOrEqual(boardBox.y + 8);
  }

  playerTokenBoxes.forEach((box) => {
    expect(box.width).toBeGreaterThanOrEqual(24);
    expect(box.height).toBeGreaterThanOrEqual(24);

    if (viewport !== null) {
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.top).toBeGreaterThanOrEqual(0);
      expect(box.left + box.width).toBeLessThanOrEqual(viewport.width);
      expect(box.top + box.height).toBeLessThanOrEqual(viewport.height);
    }
  });

  const rollButton = page.getByTestId("board-roll");

  await expect(rollButton).toBeVisible();
  await expect(rollButton).toBeEnabled();

  const regionKeyBox = await page.locator(".board-region-panel").boundingBox();

  if (viewport !== null && viewport.width <= 480) {
    expect(regionKeyBox?.y ?? 0).toBeGreaterThan(viewport.height * 0.6);
  }

  const playerOneStart = await page
    .locator('[data-testid="player-token"][data-player-index="0"]')
    .evaluate((token) => ({
      left: (token as HTMLElement).style.left,
      top: (token as HTMLElement).style.top,
    }));

  await rollButton.click();
  await expect(page.getByTestId("board-roll-text")).toContainText(/rolled [1-6]/);
  await expect(page.getByTestId("board-status")).toContainText(
    /landed|choose a route|moving|Waiting to roll/,
  );
  await expect
    .poll(async () =>
      page.locator('[data-testid="player-token"][data-player-index="0"]').evaluate((token) => ({
        left: (token as HTMLElement).style.left,
        top: (token as HTMLElement).style.top,
      })),
    )
    .not.toEqual(playerOneStart);

  await page.getByRole("button", { name: "Toggle board visibility debug details" }).click();
  await expect(page.getByTestId("board-debug")).toContainText("Board Visibility Debug");
  await expect(page.getByTestId("board-debug")).toContainText("HTML spaces rendered");
  await expect(page.getByTestId("board-debug")).toContainText("66");
  await expect(page.getByTestId("board-debug")).toContainText("HTML players rendered");
  await expect(page.getByTestId("board-debug")).toContainText("2");
  await expect(page.getByTestId("board-debug")).toContainText("Route anchors on screen");

  expect(runtimeErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
