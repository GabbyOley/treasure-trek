export type RngStep = {
  nextSeed: number;
  value: number;
};

export function stepSeededRng(seed: number): RngStep {
  const nextSeed = (seed + 0x6d2b79f5) >>> 0;

  let mixed = Math.imul(nextSeed ^ (nextSeed >>> 15), nextSeed | 1);
  mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);

  return {
    nextSeed,
    value: ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296,
  };
}

export function rollSeededDie(seed: number, sides: number): RngStep {
  const step = stepSeededRng(seed);

  return {
    nextSeed: step.nextSeed,
    value: Math.floor(step.value * sides) + 1,
  };
}
