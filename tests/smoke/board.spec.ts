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

  const canvasBox = await page.getByTestId("board-canvas").boundingBox();

  expect(canvasBox?.width ?? 0).toBeGreaterThan(300);
  expect(canvasBox?.height ?? 0).toBeGreaterThan(300);

  const renderedPixelCount = await page.locator("canvas").evaluate((canvas) => {
    const source = canvas as HTMLCanvasElement;
    const sampleWidth = Math.min(source.width, 160);
    const sampleHeight = Math.min(source.height, 120);
    const sample = document.createElement("canvas");
    const context = sample.getContext("2d", { willReadFrequently: true });

    if (context === null || sampleWidth === 0 || sampleHeight === 0) {
      return 0;
    }

    sample.width = sampleWidth;
    sample.height = sampleHeight;
    context.drawImage(source, 0, 0, sampleWidth, sampleHeight);

    const pixels = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
    const colors = new Set<string>();

    for (let index = 0; index < pixels.length; index += 16) {
      colors.add(`${pixels[index]}:${pixels[index + 1]}:${pixels[index + 2]}`);
    }

    return colors.size;
  });

  expect(renderedPixelCount).toBeGreaterThan(8);

  const rollButton = page.getByTestId("board-roll");

  await expect(rollButton).toBeVisible();
  await expect(rollButton).toBeEnabled();

  await rollButton.click();

  await expect(page.getByTestId("board-roll-text")).toContainText(/rolled [1-6]/);
  await expect(page.getByTestId("board-status")).toContainText(
    /landed|choose a route|moving|Waiting to roll/,
  );

  expect(runtimeErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
