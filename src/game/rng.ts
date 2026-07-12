export type SeededStep = {
  nextSeed: number;
  value: number;
};

const LCG_MULTIPLIER = 1664525;
const LCG_INCREMENT = 1013904223;
const LCG_MODULUS = 0x100000000;

export function stepSeededRng(seed: number): SeededStep {
  const normalizedSeed = seed >>> 0;
  const nextSeed =
    (Math.imul(normalizedSeed, LCG_MULTIPLIER) + LCG_INCREMENT) >>> 0;

  return {
    nextSeed,
    value: nextSeed / LCG_MODULUS,
  };
}

export function rollSeededDie(seed: number, sides: number): SeededStep {
  const { nextSeed, value } = stepSeededRng(seed);

  return {
    nextSeed,
    value: Math.floor(value * sides) + 1,
  };
}
