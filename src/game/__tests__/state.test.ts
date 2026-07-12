import { describe, expect, it } from "vitest";

import {
  DEFAULT_PLAYER_COUNT,
  FIRST_PLAYER_INDEX,
  INITIAL_RNG_SEED,
  TITLE_SCREEN_DIE_SIDES,
} from "../../utils/constants";
import { applyMove, createInitialGameState, type GameState } from "../state";

function collectRolls(state: GameState, rollCount: number): number[] {
  const rolls: number[] = [];
  let currentState = state;

  for (let index = 0; index < rollCount; index += 1) {
    currentState = applyMove(currentState, { type: "ROLL_DIE" });
    rolls.push(currentState.lastRoll ?? 0);
  }

  return rolls;
}

describe("game state", () => {
  it("creates the initial state", () => {
    expect(createInitialGameState()).toEqual({
      seed: INITIAL_RNG_SEED,
      lastRoll: null,
      currentPlayerIndex: FIRST_PLAYER_INDEX,
      playerCount: DEFAULT_PLAYER_COUNT,
      phase: "title",
    });
  });

  it("applying a roll move updates lastRoll", () => {
    const nextState = applyMove(createInitialGameState(), { type: "ROLL_DIE" });

    expect(nextState.lastRoll).not.toBeNull();
    expect(nextState.lastRoll).toBeGreaterThanOrEqual(1);
    expect(nextState.lastRoll).toBeLessThanOrEqual(TITLE_SCREEN_DIE_SIDES);
  });

  it("applying a roll move advances the seed", () => {
    const initialState = createInitialGameState();
    const nextState = applyMove(initialState, { type: "ROLL_DIE" });

    expect(nextState.seed).not.toBe(initialState.seed);
  });

  it("same initial state plus same move sequence gives the same roll sequence", () => {
    const firstRolls = collectRolls(createInitialGameState(), 8);
    const secondRolls = collectRolls(createInitialGameState(), 8);

    expect(firstRolls).toEqual(secondRolls);
  });

  it("keeps current player and player count stable after rolling for now", () => {
    const initialState = createInitialGameState();
    const nextState = applyMove(initialState, { type: "ROLL_DIE" });

    expect(nextState.currentPlayerIndex).toBe(initialState.currentPlayerIndex);
    expect(nextState.playerCount).toBe(initialState.playerCount);
  });
});
