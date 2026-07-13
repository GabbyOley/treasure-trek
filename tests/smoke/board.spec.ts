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
  await expect(page.getByTestId("board-canvas")).toBeVisible();
  await expect(page.getByTestId("board-visibility-layer")).toBeVisible();

  const canvasBox = await page.getByTestId("board-canvas").boundingBox();

  expect(canvasBox?.width ?? 0).toBeGreaterThan(300);
  expect(canvasBox?.height ?? 0).toBeGreaterThan(300);

  const canvasMetrics = await page.locator("canvas").evaluate((canvas) => {
    const source = canvas as HTMLCanvasElement;
    const sample = document.createElement("canvas");
    const context = sample.getContext("2d", { willReadFrequently: true });

    if (context === null || source.width === 0 || source.height === 0) {
      return {
        brightPixels: 0,
        goldPixels: 0,
        coralPixels: 0,
        colorBuckets: 0,
      };
    }

    sample.width = source.width;
    sample.height = source.height;
    context.drawImage(source, 0, 0);

    const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
    const colors = new Set<string>();
    let brightPixels = 0;
    let goldPixels = 0;
    let coralPixels = 0;

    for (let index = 0; index < pixels.length; index += 64) {
      const red = pixels[index] ?? 0;
      const green = pixels[index + 1] ?? 0;
      const blue = pixels[index + 2] ?? 0;

      if (red + green + blue > 330) {
        brightPixels += 1;
      }

      if (red > 140 && green > 90 && blue < 110) {
        goldPixels += 1;
      }

      if (red > 120 && green < 130 && blue < 120) {
        coralPixels += 1;
      }

      colors.add(`${red >> 4}:${green >> 4}:${blue >> 4}`);
    }

    return {
      brightPixels,
      goldPixels,
      coralPixels,
      colorBuckets: colors.size,
    };
  });

  expect(canvasMetrics.colorBuckets).toBeGreaterThan(40);
  expect(canvasMetrics.brightPixels).toBeGreaterThan(100);
  expect(canvasMetrics.goldPixels + canvasMetrics.coralPixels).toBeGreaterThan(40);
  await expect(page.locator(".board-visibility-tile")).toHaveCount(66);
  await expect(page.locator(".board-visibility-player")).toHaveCount(2);

  const visibilityLayerBox = await page
    .getByTestId("board-visibility-layer")
    .boundingBox();

  expect(visibilityLayerBox?.width ?? 0).toBeGreaterThan(100);
  expect(visibilityLayerBox?.height ?? 0).toBeGreaterThan(100);

  const rollButton = page.getByTestId("board-roll");

  await expect(rollButton).toBeVisible();
  await expect(rollButton).toBeEnabled();

  const viewport = page.viewportSize();
  const regionKeyBox = await page.locator(".board-region-panel").boundingBox();

  if (viewport !== null && viewport.width <= 480) {
    expect(regionKeyBox?.y ?? 0).toBeGreaterThan(viewport.height * 0.6);
  }

  await rollButton.click();

  await expect(page.getByTestId("board-roll-text")).toContainText(/rolled [1-6]/);
  await expect(page.getByTestId("board-status")).toContainText(
    /landed|choose a route|moving|Waiting to roll/,
  );

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
