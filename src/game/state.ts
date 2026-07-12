import {
  DEFAULT_PLAYER_COUNT,
  FIRST_PLAYER_INDEX,
  INITIAL_RNG_SEED,
  TITLE_SCREEN_DIE_SIDES,
} from "../utils/constants";
import { getBoardSpace, START_SPACE_ID } from "./board";
import { rollSeededDie } from "./rng";

export type GamePhase =
  | "title"
  | "waitingToRoll"
  | "moving"
  | "choosingBranch"
  | "movementComplete";

export type GameState = {
  seed: number;
  lastRoll: number | null;
  currentPlayerIndex: number;
  playerCount: number;
  phase: GamePhase;
  playerPositionId: string;
  pendingMovement: number;
  availableBranchSpaceIds: string[];
  movementPath: string[];
};

export type Move =
  | {
      type: "ENTER_BOARD";
    }
  | {
      type: "EXIT_TO_TITLE";
    }
  | {
      type: "ROLL_DIE";
    }
  | {
      type: "CHOOSE_BRANCH";
      spaceId: string;
    };

export function createInitialGameState(): GameState {
  return {
    seed: INITIAL_RNG_SEED,
    lastRoll: null,
    currentPlayerIndex: FIRST_PLAYER_INDEX,
    playerCount: DEFAULT_PLAYER_COUNT,
    phase: "title",
    playerPositionId: START_SPACE_ID,
    pendingMovement: 0,
    availableBranchSpaceIds: [],
    movementPath: [],
  };
}

export function applyMove(state: GameState, move: Move): GameState {
  switch (move.type) {
    case "ENTER_BOARD":
      return {
        ...state,
        seed: INITIAL_RNG_SEED,
        lastRoll: null,
        phase: "waitingToRoll",
        playerPositionId: START_SPACE_ID,
        pendingMovement: 0,
        availableBranchSpaceIds: [],
        movementPath: [],
      };

    case "EXIT_TO_TITLE":
      return {
        ...state,
        phase: "title",
        pendingMovement: 0,
        availableBranchSpaceIds: [],
        movementPath: [],
      };

    case "ROLL_DIE": {
      const roll = rollSeededDie(state.seed, TITLE_SCREEN_DIE_SIDES);

      const rolledState = {
        ...state,
        seed: roll.nextSeed,
        lastRoll: roll.value,
        movementPath: [],
      };

      if (state.phase === "title") {
        return rolledState;
      }

      return continueMovement({
        ...rolledState,
        phase: "moving",
        pendingMovement: roll.value,
        availableBranchSpaceIds: [],
      });
    }

    case "CHOOSE_BRANCH":
      if (
        state.phase !== "choosingBranch" ||
        !state.availableBranchSpaceIds.includes(move.spaceId)
      ) {
        return state;
      }

      return continueMovement({
        ...state,
        phase: "moving",
        playerPositionId: move.spaceId,
        pendingMovement: state.pendingMovement - 1,
        availableBranchSpaceIds: [],
        movementPath: [move.spaceId],
      });
  }
}

function continueMovement(state: GameState): GameState {
  let currentState = state;

  while (currentState.pendingMovement > 0) {
    const currentSpace = getBoardSpace(currentState.playerPositionId);

    if (currentSpace === undefined || currentSpace.nextSpaceIds.length === 0) {
      return {
        ...currentState,
        phase: "movementComplete",
        pendingMovement: 0,
        availableBranchSpaceIds: [],
      };
    }

    if (currentSpace.nextSpaceIds.length > 1) {
      return {
        ...currentState,
        phase: "choosingBranch",
        availableBranchSpaceIds: [...currentSpace.nextSpaceIds],
      };
    }

    const [nextSpaceId] = currentSpace.nextSpaceIds;
    currentState = {
      ...currentState,
      playerPositionId: nextSpaceId,
      pendingMovement: currentState.pendingMovement - 1,
      movementPath: [...currentState.movementPath, nextSpaceId],
    };
  }

  return {
    ...currentState,
    phase: "movementComplete",
    availableBranchSpaceIds: [],
  };
}
