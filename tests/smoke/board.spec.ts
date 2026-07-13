import { expect, test } from "@playwright/test";

type CanvasCrop = {
  leftRatio: number;
  topRatio: number;
  widthRatio: number;
  heightRatio: number;
};

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

  const canvasBox = await page.getByTestId("board-canvas").boundingBox();

  expect(canvasBox?.width ?? 0).toBeGreaterThan(300);
  expect(canvasBox?.height ?? 0).toBeGreaterThan(300);

  const viewport = page.viewportSize();
  const isNarrowViewport = viewport !== null && viewport.width <= 480;
  const routeCrop: CanvasCrop = isNarrowViewport
    ? {
        leftRatio: 0.02,
        topRatio: 0.43,
        widthRatio: 0.96,
        heightRatio: 0.32,
      }
    : {
        leftRatio: 0.24,
        topRatio: 0.3,
        widthRatio: 0.52,
        heightRatio: 0.46,
      };
  const canvasMetrics = await page.locator("canvas").evaluate((canvas, crop) => {
    const source = canvas as HTMLCanvasElement;
    const sample = document.createElement("canvas");
    const context = sample.getContext("2d", { willReadFrequently: true });

    if (context === null || source.width === 0 || source.height === 0) {
      return {
        brightPixels: 0,
        goldPixels: 0,
        coralPixels: 0,
        inkPixels: 0,
        colorBuckets: 0,
      };
    }

    const cropX = Math.floor(source.width * crop.leftRatio);
    const cropY = Math.floor(source.height * crop.topRatio);
    const cropWidth = Math.floor(source.width * crop.widthRatio);
    const cropHeight = Math.floor(source.height * crop.heightRatio);

    sample.width = cropWidth;
    sample.height = cropHeight;
    context.drawImage(
      source,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight,
    );

    const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
    const colors = new Set<string>();
    let brightPixels = 0;
    let goldPixels = 0;
    let coralPixels = 0;
    let inkPixels = 0;

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

      if (red < 55 && green < 55 && blue < 55) {
        inkPixels += 1;
      }

      colors.add(`${red >> 4}:${green >> 4}:${blue >> 4}`);
    }

    return {
      brightPixels,
      goldPixels,
      coralPixels,
      inkPixels,
      colorBuckets: colors.size,
    };
  }, routeCrop);

  expect(canvasMetrics.colorBuckets).toBeGreaterThan(30);
  expect(canvasMetrics.brightPixels).toBeGreaterThan(80);
  expect(canvasMetrics.goldPixels + canvasMetrics.coralPixels).toBeGreaterThan(55);
  expect(canvasMetrics.inkPixels).toBeGreaterThan(35);

  const rollButton = page.getByTestId("board-roll");

  await expect(rollButton).toBeVisible();
  await expect(rollButton).toBeEnabled();

  const regionKeyBox = await page.locator(".board-region-panel").boundingBox();

  if (viewport !== null && viewport.width <= 480) {
    expect(regionKeyBox?.y ?? 0).toBeGreaterThan(viewport.height * 0.6);
  }

  await rollButton.click();

  await expect(page.getByTestId("board-roll-text")).toContainText(/rolled [1-6]/);
  await expect(page.getByTestId("board-status")).toContainText(
    /landed|choose a route|moving|Waiting to roll/,
  );

  expect(runtimeErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
