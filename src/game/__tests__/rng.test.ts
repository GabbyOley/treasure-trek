import { describe, expect, it } from "vitest";

import { createSeededRng } from "../rng";

describe("createSeededRng", () => {
  it("returns the same sequence for the same seed", () => {
    const left = createSeededRng(12345);
    const right = createSeededRng(12345);

    const leftSequence = Array.from({ length: 6 }, () => left());
    const rightSequence = Array.from({ length: 6 }, () => right());

    expect(leftSequence).toEqual(rightSequence);
    expect(leftSequence.every((value) => value >= 0 && value < 1)).toBe(true);
  });

  it("returns a different sequence for a different seed", () => {
    const left = createSeededRng(12345);
    const right = createSeededRng(54321);

    const leftSequence = Array.from({ length: 6 }, () => left());
    const rightSequence = Array.from({ length: 6 }, () => right());

    expect(leftSequence).not.toEqual(rightSequence);
  });
});
