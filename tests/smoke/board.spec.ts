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
  await expect(page.getByTestId("board-svg-board")).toBeVisible();
  await expect(page.getByTestId("board-route-svg")).toBeVisible();
  await expect(page.locator(".svg-board-space")).toHaveCount(66);
  await expect(page.locator(".svg-board-player")).toHaveCount(2);

  const boardBox = await page.getByTestId("board-svg-board").boundingBox();

  expect(boardBox?.width ?? 0).toBeGreaterThan(300);
  expect(boardBox?.height ?? 0).toBeGreaterThan(300);

  const rollButton = page.getByTestId("board-roll");

  await expect(rollButton).toBeVisible();
  await expect(rollButton).toBeEnabled();

  const viewport = page.viewportSize();
  const regionKeyBox = await page.locator(".board-region-panel").boundingBox();

  if (viewport !== null && viewport.width <= 480) {
    expect(regionKeyBox?.y ?? 0).toBeGreaterThan(viewport.height * 0.6);
  }

  const playerOneStart = await page
    .locator('.svg-board-player[data-player-index="0"] circle')
    .evaluate((circle) => ({
      cx: circle.getAttribute("cx"),
      cy: circle.getAttribute("cy"),
    }));

  await rollButton.click();
  await expect(page.getByTestId("board-roll-text")).toContainText(/rolled [1-6]/);
  await expect(page.getByTestId("board-status")).toContainText(
    /landed|choose a route|moving|Waiting to roll/,
  );
  await expect
    .poll(async () =>
      page.locator('.svg-board-player[data-player-index="0"] circle').evaluate((circle) => ({
        cx: circle.getAttribute("cx"),
        cy: circle.getAttribute("cy"),
      })),
    )
    .not.toEqual(playerOneStart);

  await page.getByRole("button", { name: "Toggle board visibility debug details" }).click();
  await expect(page.getByTestId("board-debug")).toContainText("Board Visibility Debug");
  await expect(page.getByTestId("board-debug")).toContainText("Route tile meshes");
  await expect(page.getByTestId("board-debug")).toContainText("66");
  await expect(page.getByTestId("board-debug")).toContainText("Player piece meshes");
  await expect(page.getByTestId("board-debug")).toContainText("2");
  await expect(page.getByTestId("board-debug")).toContainText("Route anchors on screen");

  expect(runtimeErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
