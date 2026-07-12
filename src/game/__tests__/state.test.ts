import { describe, expect, it } from "vitest";

import {
  DEFAULT_PLAYER_COUNT,
  FIRST_PLAYER_INDEX,
  INITIAL_RNG_SEED,
  TITLE_SCREEN_DIE_SIDES,
} from "../../utils/constants";
import { START_SPACE_ID } from "../board";
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
      playerPositionId: START_SPACE_ID,
      pendingMovement: 0,
      availableBranchSpaceIds: [],
      movementPath: [],
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

  it("entering the board starts board rolling from the initial seed", () => {
    const titleRolledState = applyMove(createInitialGameState(), { type: "ROLL_DIE" });
    const boardState = applyMove(titleRolledState, { type: "ENTER_BOARD" });

    expect(boardState.seed).toBe(INITIAL_RNG_SEED);
    expect(boardState.lastRoll).toBeNull();
  });

  it("a board roll creates pending movement or completes it through pure state", () => {
    const boardState = {
      ...applyMove(createInitialGameState(), { type: "ENTER_BOARD" }),
      seed: 2,
    };
    const nextState = applyMove(boardState, { type: "ROLL_DIE" });

    expect(nextState.lastRoll).not.toBeNull();
    expect(nextState.phase).toBe("choosingBranch");
    expect(nextState.pendingMovement).toBeGreaterThan(0);
  });

  it("movement along a single-option path advances correctly", () => {
    const boardState = applyMove(createInitialGameState(), { type: "ENTER_BOARD" });
    const nextState = applyMove(
      {
        ...boardState,
        seed: 7,
      },
      { type: "ROLL_DIE" },
    );

    expect(nextState.playerPositionId).toBe("camp-coin");
    expect(nextState.movementPath).toEqual(["camp-coin"]);
    expect(nextState.phase).toBe("movementComplete");
  });

  it("movement pauses when a branch is reached with movement remaining", () => {
    const boardState = {
      ...applyMove(createInitialGameState(), { type: "ENTER_BOARD" }),
      seed: 2,
    };
    const nextState = applyMove(boardState, { type: "ROLL_DIE" });

    expect(nextState.playerPositionId).toBe("camp-fork");
    expect(nextState.phase).toBe("choosingBranch");
    expect(nextState.pendingMovement).toBeGreaterThan(0);
  });

  it("available branch choices are valid connected spaces", () => {
    const boardState = {
      ...applyMove(createInitialGameState(), { type: "ENTER_BOARD" }),
      seed: 2,
    };
    const nextState = applyMove(boardState, { type: "ROLL_DIE" });

    expect(nextState.availableBranchSpaceIds).toEqual(["field-entry", "cave-mouth"]);
  });

  it("choosing a branch continues movement", () => {
    const boardState = {
      ...applyMove(createInitialGameState(), { type: "ENTER_BOARD" }),
      seed: 2,
    };
    const branchState = applyMove(boardState, { type: "ROLL_DIE" });
    const nextState = applyMove(branchState, {
      type: "CHOOSE_BRANCH",
      spaceId: "field-entry",
    });

    expect(nextState.playerPositionId).not.toBe("camp-fork");
    expect(nextState.availableBranchSpaceIds).toEqual([]);
    expect(nextState.phase).toBe("movementComplete");
  });

  it("movement cannot choose an invalid branch", () => {
    const boardState = {
      ...applyMove(createInitialGameState(), { type: "ENTER_BOARD" }),
      seed: 2,
    };
    const branchState = applyMove(boardState, { type: "ROLL_DIE" });
    const nextState = applyMove(branchState, {
      type: "CHOOSE_BRANCH",
      spaceId: "slice-end",
    });

    expect(nextState).toBe(branchState);
  });

  it("final position is deterministic from the same seed and choices", () => {
    const playTurn = (): GameState => {
      const boardState = {
        ...applyMove(createInitialGameState(), { type: "ENTER_BOARD" }),
        seed: 2,
      };
      const branchState = applyMove(boardState, { type: "ROLL_DIE" });

      return applyMove(branchState, {
        type: "CHOOSE_BRANCH",
        spaceId: "cave-mouth",
      });
    };
    const firstResult = playTurn();
    const secondResult = playTurn();

    expect(firstResult.playerPositionId).toBe(secondResult.playerPositionId);
    expect(firstResult.lastRoll).toBe(secondResult.lastRoll);
    expect(firstResult.seed).toBe(secondResult.seed);
  });
});
