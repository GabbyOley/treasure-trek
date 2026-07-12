import { describe, expect, it } from "vitest";

import { rollSeededDie, stepSeededRng } from "../rng";

describe("stepSeededRng", () => {
  it("returns the same sequence for the same seed", () => {
    let firstSeed = 12345;
    let secondSeed = 12345;
    const firstSequence: number[] = [];
    const secondSequence: number[] = [];

    for (let index = 0; index < 5; index += 1) {
      const firstStep = stepSeededRng(firstSeed);
      const secondStep = stepSeededRng(secondSeed);

      firstSeed = firstStep.nextSeed;
      secondSeed = secondStep.nextSeed;
      firstSequence.push(firstStep.value);
      secondSequence.push(secondStep.value);
    }

    expect(firstSequence).toEqual(secondSequence);
  });

  it("returns a different sequence for different seeds", () => {
    let firstSeed = 12345;
    let secondSeed = 67890;
    const firstSequence: number[] = [];
    const secondSequence: number[] = [];

    for (let index = 0; index < 5; index += 1) {
      const firstStep = stepSeededRng(firstSeed);
      const secondStep = stepSeededRng(secondSeed);

      firstSeed = firstStep.nextSeed;
      secondSeed = secondStep.nextSeed;
      firstSequence.push(firstStep.value);
      secondSequence.push(secondStep.value);
    }

    expect(firstSequence).not.toEqual(secondSequence);
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
