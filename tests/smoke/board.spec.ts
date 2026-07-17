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
  await expect(page.getByTestId("board-space")).toHaveCount(45);
  await expect(page.getByTestId("player-token")).toHaveCount(2);
  await expect(page.getByTestId("board-connection").first()).toBeVisible();
  const boardSurface = page.getByTestId("html-board-surface");

  await expect(boardSurface.getByText("Start")).toBeVisible();
  await expect(boardSurface.getByText("Golden Key")).toBeVisible();
  await expect(boardSurface.getByText("Finish")).toBeVisible();
  await expect(page.getByTestId("golden-key-status")).toContainText(
    "Golden Key: unclaimed",
  );
  const goldenKeyTile = page.locator(
    '[data-testid="board-space"][data-space-type="golden-key"]',
  );
  const goldenKeySpace = page.getByTestId("golden-key-space");
  await expect(goldenKeyTile).toHaveCount(1);
  await expect(goldenKeyTile).toBeVisible();
  await expect(goldenKeySpace).toBeVisible();
  await expect(goldenKeySpace).toContainText("🔑 KEY");

  const boardBox = await page.getByTestId("html-board").boundingBox();
  const firstSpaceBox = await page.getByTestId("board-space").first().boundingBox();
  const goldenKeyBox = await goldenKeyTile.boundingBox();
  const goldenKeyStyle = await goldenKeyTile.evaluate((space) => {
    const style = window.getComputedStyle(space);

    return {
      backgroundImage: style.backgroundImage,
      boxShadow: style.boxShadow,
      width: style.width,
      height: style.height,
    };
  });
  const coinStyle = await page
    .locator('[data-testid="board-space"][data-space-type="coin"]')
    .first()
    .evaluate((space) => {
      const style = window.getComputedStyle(space);

      return {
        backgroundImage: style.backgroundImage,
        boxShadow: style.boxShadow,
        width: style.width,
        height: style.height,
      };
    });
  const playerTokenBoxes = await page.getByTestId("player-token").evaluateAll((tokens) =>
    tokens.map((token) => token.getBoundingClientRect()).map((box) => ({
      left: box.left,
      top: box.top,
      width: box.width,
      height: box.height,
    })),
  );
  const viewport = page.viewportSize();

  expect(boardBox?.width ?? 0).toBeGreaterThan(300);
  expect(boardBox?.height ?? 0).toBeGreaterThan(300);
  expect(firstSpaceBox?.width ?? 0).toBeGreaterThanOrEqual(20);
  expect(firstSpaceBox?.height ?? 0).toBeGreaterThanOrEqual(20);
  expect(goldenKeyBox?.width ?? 0).toBeGreaterThan(firstSpaceBox?.width ?? 0);
  expect(goldenKeyBox?.height ?? 0).toBeGreaterThan(firstSpaceBox?.height ?? 0);
  expect(goldenKeyStyle).not.toEqual(coinStyle);
  expect(playerTokenBoxes).toHaveLength(2);

  if (viewport !== null && firstSpaceBox !== null) {
    expect(firstSpaceBox.x).toBeGreaterThanOrEqual(0);
    expect(firstSpaceBox.y).toBeGreaterThanOrEqual(0);
    expect(firstSpaceBox.x + firstSpaceBox.width).toBeLessThanOrEqual(viewport.width);
    expect(firstSpaceBox.y + firstSpaceBox.height).toBeLessThanOrEqual(viewport.height);
  }

  if (viewport !== null && goldenKeyBox !== null) {
    expect(goldenKeyBox.x).toBeGreaterThanOrEqual(0);
    expect(goldenKeyBox.y).toBeGreaterThanOrEqual(0);
    expect(goldenKeyBox.x + goldenKeyBox.width).toBeLessThanOrEqual(viewport.width);
    expect(goldenKeyBox.y + goldenKeyBox.height).toBeLessThanOrEqual(viewport.height);
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
  await expect(page.getByTestId("board-debug")).toContainText(
    "Golden Key PR build: visibility-v2",
  );
  await expect(page.getByTestId("board-debug")).toContainText("readable-v1");
  await expect(page.getByTestId("board-debug")).toContainText("HTML spaces rendered");
  await expect(page.getByTestId("board-debug")).toContainText("HTML players rendered");
  await expect(page.getByTestId("board-debug")).toContainText("Player positions");
  await expect(page.getByTestId("board-debug")).toContainText("Start space ID");
  await expect(page.getByTestId("board-debug")).toContainText("Finish space ID");
  await expect(page.getByTestId("board-debug")).toContainText("Golden Key space ID");
  await expect(page.getByTestId("board-debug")).toContainText("Golden Key holder");
  await expect(page.getByTestId("board-debug")).toContainText("Route tile meshes");
  await expect(page.getByTestId("board-debug")).toContainText("45");
  await expect(page.getByTestId("board-debug")).toContainText("Player piece meshes");
  await expect(page.getByTestId("board-debug")).toContainText("2");
  await expect(page.getByTestId("board-debug")).toContainText("Route anchors on screen");

  expect(runtimeErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
