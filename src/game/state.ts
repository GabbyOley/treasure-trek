import {
  DEFAULT_PLAYER_COUNT,
  FIRST_PLAYER_INDEX,
  INITIAL_RNG_SEED,
  TITLE_SCREEN_DIE_SIDES,
} from "../utils/constants";
import { rollSeededDie } from "./rng";

export type GamePhase = "title";

export type GameState = {
  seed: number;
  lastRoll: number | null;
  currentPlayerIndex: number;
  playerCount: number;
  phase: GamePhase;
};

export type Move = {
  type: "ROLL_DIE";
};

export function createInitialGameState(): GameState {
  return {
    seed: INITIAL_RNG_SEED,
    lastRoll: null,
    currentPlayerIndex: FIRST_PLAYER_INDEX,
    playerCount: DEFAULT_PLAYER_COUNT,
    phase: "title",
  };
}

export function applyMove(state: GameState, move: Move): GameState {
  switch (move.type) {
    case "ROLL_DIE": {
      const roll = rollSeededDie(state.seed, TITLE_SCREEN_DIE_SIDES);

      return {
        ...state,
        seed: roll.nextSeed,
        lastRoll: roll.value,
      };
    }
  }
}
