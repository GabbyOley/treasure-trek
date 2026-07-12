import {
  DEFAULT_PLAYER_COUNT,
  FIRST_PLAYER_INDEX,
  COIN_SPACE_REWARD,
  INITIAL_PLAYER_COINS,
  INITIAL_RNG_SEED,
  TITLE_SCREEN_DIE_SIDES,
} from "../utils/constants";
import { getBoardSpace, START_SPACE_ID, type BoardSpaceType } from "./board";
import { rollSeededDie } from "./rng";

export type GamePhase =
  | "title"
  | "waitingToRoll"
  | "moving"
  | "choosingBranch"
  | "movementComplete";

export type PlayerState = {
  id: string;
  name: string;
  positionId: string;
  coins: number;
};

export type LandingEffect = {
  playerIndex: number;
  spaceId: string;
  spaceType: BoardSpaceType;
  message: string;
  coinDelta: number;
};

export type GameState = {
  seed: number;
  lastRoll: number | null;
  currentPlayerIndex: number;
  playerCount: number;
  phase: GamePhase;
  players: PlayerState[];
  pendingMovement: number;
  availableBranchSpaceIds: string[];
  movementPath: string[];
  movingPlayerIndex: number;
  lastTurnSummary: string | null;
  lastLandingEffect: LandingEffect | null;
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
  const players = createInitialPlayers(DEFAULT_PLAYER_COUNT);

  return {
    seed: INITIAL_RNG_SEED,
    lastRoll: null,
    currentPlayerIndex: FIRST_PLAYER_INDEX,
    playerCount: players.length,
    phase: "title",
    players,
    pendingMovement: 0,
    availableBranchSpaceIds: [],
    movementPath: [],
    movingPlayerIndex: FIRST_PLAYER_INDEX,
    lastTurnSummary: null,
    lastLandingEffect: null,
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
        players: createInitialPlayers(state.playerCount),
        currentPlayerIndex: FIRST_PLAYER_INDEX,
        movingPlayerIndex: FIRST_PLAYER_INDEX,
        pendingMovement: 0,
        availableBranchSpaceIds: [],
        movementPath: [],
        lastTurnSummary: null,
        lastLandingEffect: null,
      };

    case "EXIT_TO_TITLE":
      return {
        ...state,
        phase: "title",
        pendingMovement: 0,
        availableBranchSpaceIds: [],
        movementPath: [],
        movingPlayerIndex: state.currentPlayerIndex,
        lastLandingEffect: null,
      };

    case "ROLL_DIE": {
      if (state.phase !== "title" && state.phase !== "waitingToRoll") {
        return state;
      }

      const roll = rollSeededDie(state.seed, TITLE_SCREEN_DIE_SIDES);

      const rolledState = {
        ...state,
        seed: roll.nextSeed,
        lastRoll: roll.value,
        movementPath: [],
        movingPlayerIndex: state.currentPlayerIndex,
        lastTurnSummary: null,
        lastLandingEffect: null,
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
        players: updatePlayerPosition(
          state.players,
          state.currentPlayerIndex,
          move.spaceId,
        ),
        pendingMovement: state.pendingMovement - 1,
        availableBranchSpaceIds: [],
        movementPath: [move.spaceId],
      });
  }
}

function continueMovement(state: GameState): GameState {
  let currentState = state;

  while (currentState.pendingMovement > 0) {
    const activePlayer = currentState.players[currentState.currentPlayerIndex];
    const currentSpace = getBoardSpace(activePlayer?.positionId ?? START_SPACE_ID);

    if (currentSpace === undefined || currentSpace.nextSpaceIds.length === 0) {
      return finishTurn({
        ...currentState,
        pendingMovement: 0,
        availableBranchSpaceIds: [],
      });
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
      players: updatePlayerPosition(
        currentState.players,
        currentState.currentPlayerIndex,
        nextSpaceId,
      ),
      pendingMovement: currentState.pendingMovement - 1,
      movementPath: [...currentState.movementPath, nextSpaceId],
    };
  }

  return finishTurn({
    ...currentState,
    availableBranchSpaceIds: [],
  });
}

function createInitialPlayers(playerCount: number): PlayerState[] {
  return Array.from({ length: playerCount }, (_, index) => ({
    id: `player-${index + 1}`,
    name: `Player ${index + 1}`,
    positionId: START_SPACE_ID,
    coins: INITIAL_PLAYER_COINS,
  }));
}

function updatePlayerPosition(
  players: readonly PlayerState[],
  playerIndex: number,
  positionId: string,
): PlayerState[] {
  return players.map((player, index) => {
    if (index !== playerIndex) {
      return player;
    }

    return {
      ...player,
      positionId,
    };
  });
}

function finishTurn(state: GameState): GameState {
  const movingPlayer = state.players[state.currentPlayerIndex];
  const movingPlayerIndex = state.currentPlayerIndex;
  const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.playerCount;
  const landedSpace = getBoardSpace(movingPlayer?.positionId ?? START_SPACE_ID);
  const landedName = landedSpace?.name ?? "the board";
  const landingEffect = resolveLandingEffect(state, movingPlayerIndex);
  const resolvedPlayers =
    landingEffect.coinDelta === 0
      ? state.players
      : updatePlayerCoins(state.players, movingPlayerIndex, landingEffect.coinDelta);

  return {
    ...state,
    players: resolvedPlayers,
    phase: "waitingToRoll",
    pendingMovement: 0,
    availableBranchSpaceIds: [],
    movingPlayerIndex,
    currentPlayerIndex: nextPlayerIndex,
    lastTurnSummary: `${movingPlayer?.name ?? "Player"} landed on ${landedName}. ${landingEffect.message}`,
    lastLandingEffect: landingEffect,
  };
}

function updatePlayerCoins(
  players: readonly PlayerState[],
  playerIndex: number,
  coinDelta: number,
): PlayerState[] {
  return players.map((player, index) => {
    if (index !== playerIndex) {
      return player;
    }

    return {
      ...player,
      coins: player.coins + coinDelta,
    };
  });
}

function resolveLandingEffect(state: GameState, playerIndex: number): LandingEffect {
  const player = state.players[playerIndex];
  const space = getBoardSpace(player?.positionId ?? START_SPACE_ID);
  const spaceType = space?.type ?? "blank";
  const spaceId = space?.id ?? START_SPACE_ID;
  const baseEffect = {
    playerIndex,
    spaceId,
    spaceType,
  };

  switch (spaceType) {
    case "coin":
      return {
        ...baseEffect,
        message: `Coin space: gained ${COIN_SPACE_REWARD} coins.`,
        coinDelta: COIN_SPACE_REWARD,
      };
    case "treasure":
      return {
        ...baseEffect,
        message: "Treasure space: card draw coming soon.",
        coinDelta: 0,
      };
    case "trap":
      return {
        ...baseEffect,
        message: "Trap space: trap effect coming soon.",
        coinDelta: 0,
      };
    case "event":
      return {
        ...baseEffect,
        message: "Event space: event effect coming soon.",
        coinDelta: 0,
      };
    case "action":
      return {
        ...baseEffect,
        message: "Action space: landmark interaction coming soon.",
        coinDelta: 0,
      };
    case "blank":
      return {
        ...baseEffect,
        message: "Blank space: nothing happened.",
        coinDelta: 0,
      };
  }
}
