import { describe, expect, it } from "vitest";

import { stepSeededRng } from "../rng";

function collectSequence(seed: number, length: number): number[] {
  let currentSeed = seed;

  return Array.from({ length }, () => {
    const step = stepSeededRng(currentSeed);
    currentSeed = step.nextSeed;
    return step.value;
  });
}

describe("stepSeededRng", () => {
  it("returns the same sequence for the same seed", () => {
    const leftSequence = collectSequence(12345, 6);
    const rightSequence = collectSequence(12345, 6);

    expect(leftSequence).toEqual(rightSequence);
    expect(leftSequence.every((value) => value >= 0 && value < 1)).toBe(true);
  });

  it("returns a different sequence for a different seed", () => {
    const leftSequence = collectSequence(12345, 6);
    const rightSequence = collectSequence(54321, 6);

    expect(leftSequence).not.toEqual(rightSequence);
  });
});
