import { describe, expect, it } from "vitest";

import { rollSeededDie, stepSeededRng } from "../rng";

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

describe("rollSeededDie", () => {
  it("produces the same die sequence for the same seed", () => {
    let firstSeed = 20260712;
    let secondSeed = 20260712;
    const firstRolls: number[] = [];
    const secondRolls: number[] = [];

    for (let index = 0; index < 12; index += 1) {
      const firstStep = rollSeededDie(firstSeed, 6);
      const secondStep = rollSeededDie(secondSeed, 6);

      firstSeed = firstStep.nextSeed;
      secondSeed = secondStep.nextSeed;
      firstRolls.push(firstStep.value);
      secondRolls.push(secondStep.value);
    }

    expect(firstRolls).toEqual(secondRolls);
    expect(firstRolls.every((roll) => roll >= 1 && roll <= 6)).toBe(true);
  });
});
