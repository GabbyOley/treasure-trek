import {
  DEFAULT_PLAYER_COUNT,
  FIRST_PLAYER_INDEX,
  CARD_FIXED_MOVE_STEPS,
  COIN_SPACE_REWARD,
  EVENT_COIN_REWARD,
  INITIAL_PLAYER_COINS,
  INITIAL_RNG_SEED,
  MAX_TREASURE_HAND_SIZE,
  TITLE_SCREEN_DIE_SIDES,
  TRAP_COIN_LOSS,
} from "../utils/constants";
import { getBoardSpace, START_SPACE_ID, type BoardSpaceType } from "./board";
import { rollSeededDie } from "./rng";
import { drawTreasureCard, type TreasureCardId } from "./treasureCards";
import {
  drawEventCard,
  drawTrapCard,
  type EventCardId,
  type TrapCardId,
} from "./trapEventCards";

export type GamePhase =
  | "title"
  | "waitingToRoll"
  | "moving"
  | "choosingBranch"
  | "movementComplete";

export type RollSource = "normal" | "compass";

export type MovementPurpose = "turn" | "cardEffect";

export type PlayerState = {
  id: string;
  name: string;
  positionId: string;
  pathHistory: string[];
  coins: number;
  treasureHand: TreasureCardId[];
};

export type LandingEffect = {
  playerIndex: number;
  spaceId: string;
  spaceType: BoardSpaceType;
  message: string;
  coinDelta: number;
  treasureCardId: TreasureCardId | null;
  treasureHandFull: boolean;
  trapCardId: TrapCardId | null;
  eventCardId: EventCardId | null;
  effectRoll: number | null;
  nextSeed: number | null;
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
  movementPurpose: MovementPurpose;
  lastRollSource: RollSource | null;
  lastTurnSummary: string | null;
  lastLandingEffect: LandingEffect | null;
  pendingLandingEffect: LandingEffect | null;
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
      type: "USE_TREASURE_CARD";
      cardId: TreasureCardId;
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
    movementPurpose: "turn",
    lastRollSource: null,
    lastTurnSummary: null,
    lastLandingEffect: null,
    pendingLandingEffect: null,
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
        movementPurpose: "turn",
        lastRollSource: null,
        lastTurnSummary: null,
        lastLandingEffect: null,
        pendingLandingEffect: null,
      };

    case "EXIT_TO_TITLE":
      return {
        ...state,
        phase: "title",
        pendingMovement: 0,
        availableBranchSpaceIds: [],
        movementPath: [],
        movingPlayerIndex: state.currentPlayerIndex,
        movementPurpose: "turn",
        lastRollSource: null,
        lastLandingEffect: null,
        pendingLandingEffect: null,
      };

    case "ROLL_DIE": {
      if (state.phase !== "title" && state.phase !== "waitingToRoll") {
        return state;
      }

      const roll = rollSeededDie(state.seed, TITLE_SCREEN_DIE_SIDES);

      const rolledState: GameState = {
        ...state,
        seed: roll.nextSeed,
        lastRoll: roll.value,
        movementPath: [],
        movingPlayerIndex: state.currentPlayerIndex,
        movementPurpose: "turn",
        lastRollSource: "normal",
        lastTurnSummary: null,
        lastLandingEffect: null,
        pendingLandingEffect: null,
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

    case "USE_TREASURE_CARD": {
      if (!canUseTreasureCard(state, move.cardId)) {
        return state;
      }

      const roll = rollSeededDie(state.seed, TITLE_SCREEN_DIE_SIDES);
      const activePlayer = state.players[state.currentPlayerIndex];

      return continueMovement({
        ...state,
        seed: roll.nextSeed,
        lastRoll: roll.value,
        phase: "moving",
        players: removeTreasureCardFromPlayer(
          state.players,
          state.currentPlayerIndex,
          move.cardId,
        ),
        pendingMovement: roll.value,
        availableBranchSpaceIds: [],
        movementPath: [],
        movingPlayerIndex: state.currentPlayerIndex,
        movementPurpose: "turn",
        lastRollSource: "compass",
        lastTurnSummary: `${activePlayer?.name ?? "Player"} used Compass and rolled ${roll.value}.`,
        lastLandingEffect: null,
        pendingLandingEffect: null,
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

export function canUseTreasureCard(
  state: GameState,
  cardId: TreasureCardId,
): boolean {
  if (
    cardId !== "compass" ||
    state.phase !== "waitingToRoll" ||
    state.pendingMovement !== 0 ||
    state.availableBranchSpaceIds.length > 0
  ) {
    return false;
  }

  return state.players[state.currentPlayerIndex]?.treasureHand.includes(cardId) ?? false;
}

function continueMovement(state: GameState): GameState {
  let currentState = state;

  while (currentState.pendingMovement > 0) {
    const activePlayer = currentState.players[currentState.currentPlayerIndex];
    const currentSpace = getBoardSpace(activePlayer?.positionId ?? START_SPACE_ID);

    if (currentSpace === undefined || currentSpace.nextSpaceIds.length === 0) {
      return finishMovement({
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

  return finishMovement({
    ...currentState,
    availableBranchSpaceIds: [],
  });
}

function finishMovement(state: GameState): GameState {
  if (state.movementPurpose === "cardEffect") {
    return finishCardEffectTurn(state);
  }

  return finishTurn(state);
}

function createInitialPlayers(playerCount: number): PlayerState[] {
  return Array.from({ length: playerCount }, (_, index) => ({
    id: `player-${index + 1}`,
    name: `Player ${index + 1}`,
    positionId: START_SPACE_ID,
    pathHistory: [START_SPACE_ID],
    coins: INITIAL_PLAYER_COINS,
    treasureHand: [],
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
      pathHistory: [...player.pathHistory, positionId],
    };
  });
}

function finishTurn(state: GameState): GameState {
  const movingPlayer = state.players[state.currentPlayerIndex];
  const movingPlayerIndex = state.currentPlayerIndex;
  const landedSpace = getBoardSpace(movingPlayer?.positionId ?? START_SPACE_ID);
  const landedName = landedSpace?.name ?? "the board";
  const landingEffect = resolveLandingEffect(state, movingPlayerIndex);
  const rollSummary =
    state.lastRollSource === "compass" && state.lastRoll !== null
      ? `${movingPlayer?.name ?? "Player"} used Compass and rolled ${state.lastRoll}. `
      : "";
  const summary = `${rollSummary}${movingPlayer?.name ?? "Player"} landed on ${landedName}. ${landingEffect.message}`;

  return applyLandingEffect(
    {
      ...state,
      lastTurnSummary: summary,
      lastLandingEffect: landingEffect,
    },
    landingEffect,
    summary,
  );
}

function completeTurn(
  state: GameState,
  landingEffect: LandingEffect | null,
  summary: string,
): GameState {
  const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.playerCount;

  return {
    ...state,
    phase: "waitingToRoll",
    pendingMovement: 0,
    availableBranchSpaceIds: [],
    movementPurpose: "turn",
    movingPlayerIndex: state.currentPlayerIndex,
    currentPlayerIndex: nextPlayerIndex,
    lastTurnSummary: summary,
    lastLandingEffect: landingEffect,
    pendingLandingEffect: null,
  };
}

function finishCardEffectTurn(state: GameState): GameState {
  const landingEffect = state.pendingLandingEffect;
  const summary = state.lastTurnSummary ?? landingEffect?.message ?? "Card effect resolved.";

  // V1 card movement does not resolve the space it lands on; this avoids chained loops.
  return completeTurn(
    {
      ...state,
      lastLandingEffect: landingEffect,
    },
    landingEffect,
    summary,
  );
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
      coins: Math.max(0, player.coins + coinDelta),
    };
  });
}

function applyLandingEffect(
  state: GameState,
  landingEffect: LandingEffect,
  summary: string,
): GameState {
  const playerIndex = landingEffect.playerIndex;
  const playersAfterCoins =
    landingEffect.coinDelta === 0
      ? state.players
      : updatePlayerCoins(state.players, playerIndex, landingEffect.coinDelta);
  const playersAfterTreasure =
    landingEffect.treasureCardId === null || landingEffect.treasureHandFull
      ? playersAfterCoins
      : addTreasureCardToPlayer(playersAfterCoins, playerIndex, landingEffect.treasureCardId);
  const effectState = {
    ...state,
    seed: landingEffect.nextSeed ?? state.seed,
    players: playersAfterTreasure,
    lastTurnSummary: summary,
    lastLandingEffect: landingEffect,
  };

  if (landingEffect.trapCardId === "move-back-2") {
    return completeTurn(
      movePlayerBackward(effectState, playerIndex, CARD_FIXED_MOVE_STEPS),
      landingEffect,
      summary,
    );
  }

  if (landingEffect.trapCardId === "roll-and-move-back") {
    return completeTurn(
      movePlayerBackward(effectState, playerIndex, landingEffect.effectRoll ?? 0),
      landingEffect,
      summary,
    );
  }

  if (
    landingEffect.eventCardId === "move-forward-2" ||
    landingEffect.eventCardId === "roll-again"
  ) {
    const steps =
      landingEffect.eventCardId === "roll-again"
        ? landingEffect.effectRoll ?? 0
        : CARD_FIXED_MOVE_STEPS;

    return continueMovement({
      ...effectState,
      phase: "moving",
      pendingMovement: steps,
      availableBranchSpaceIds: [],
      movementPath: [],
      movementPurpose: "cardEffect",
      pendingLandingEffect: landingEffect,
    });
  }

  return completeTurn(effectState, landingEffect, summary);
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
    treasureCardId: null,
    treasureHandFull: false,
    trapCardId: null,
    eventCardId: null,
    effectRoll: null,
    nextSeed: null,
  };

  switch (spaceType) {
    case "coin":
      return {
        ...baseEffect,
        message: `Coin space: gained ${COIN_SPACE_REWARD} coins.`,
        coinDelta: COIN_SPACE_REWARD,
      };
    case "treasure":
      return resolveTreasureLanding(state, playerIndex, baseEffect);
    case "trap":
      return resolveTrapLanding(state, baseEffect);
    case "event":
      return resolveEventLanding(state, playerIndex, baseEffect);
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

function addTreasureCardToPlayer(
  players: readonly PlayerState[],
  playerIndex: number,
  treasureCardId: TreasureCardId,
): PlayerState[] {
  return players.map((player, index) => {
    if (index !== playerIndex) {
      return player;
    }

    return {
      ...player,
      treasureHand: [...player.treasureHand, treasureCardId],
    };
  });
}

function removeTreasureCardFromPlayer(
  players: readonly PlayerState[],
  playerIndex: number,
  treasureCardId: TreasureCardId,
): PlayerState[] {
  return players.map((player, index) => {
    if (index !== playerIndex) {
      return player;
    }

    const cardIndex = player.treasureHand.indexOf(treasureCardId);

    if (cardIndex === -1) {
      return player;
    }

    return {
      ...player,
      treasureHand: player.treasureHand.filter((_, handIndex) => handIndex !== cardIndex),
    };
  });
}

function movePlayerBackward(
  state: GameState,
  playerIndex: number,
  steps: number,
): GameState {
  let currentState = state;
  const movementPath: string[] = [];

  for (let step = 0; step < steps; step += 1) {
    const player = currentState.players[playerIndex];
    // V1 backward movement retraces the player's recorded path and stops if it runs out.
    const previousSpaceId =
      player?.pathHistory.length === undefined || player.pathHistory.length < 2
        ? undefined
        : player.pathHistory[player.pathHistory.length - 2];

    if (player === undefined || previousSpaceId === undefined) {
      break;
    }

    movementPath.push(previousSpaceId);
    currentState = {
      ...currentState,
      players: currentState.players.map((entry, index) => {
        if (index !== playerIndex) {
          return entry;
        }

        return {
          ...entry,
          positionId: previousSpaceId,
          pathHistory: entry.pathHistory.slice(0, -1),
        };
      }),
    };
  }

  return {
    ...currentState,
    movementPath,
    movingPlayerIndex: playerIndex,
  };
}

function resolveTreasureLanding(
  state: GameState,
  playerIndex: number,
  baseEffect: Omit<LandingEffect, "message" | "coinDelta">,
): LandingEffect {
  const player = state.players[playerIndex];
  const draw = drawTreasureCard(state.seed);

  if ((player?.treasureHand.length ?? 0) >= MAX_TREASURE_HAND_SIZE) {
    return {
      ...baseEffect,
      message: `Treasure space: drew ${draw.card.name}, but the hand is full.`,
      coinDelta: 0,
      treasureCardId: draw.card.id,
      treasureHandFull: true,
      nextSeed: draw.nextSeed,
    };
  }

  return {
    ...baseEffect,
    message: `Treasure space: drew ${draw.card.name}.`,
    coinDelta: 0,
    treasureCardId: draw.card.id,
    treasureHandFull: false,
    nextSeed: draw.nextSeed,
  };
}

function resolveTrapLanding(
  state: GameState,
  baseEffect: Omit<LandingEffect, "message" | "coinDelta">,
): LandingEffect {
  const draw = drawTrapCard(state.seed);

  if (draw.card.id === "safe") {
    return {
      ...baseEffect,
      message: `Trap: ${draw.card.name}. No effect.`,
      coinDelta: 0,
      trapCardId: draw.card.id,
      nextSeed: draw.nextSeed,
    };
  }

  if (draw.card.id === "lose-20-coins") {
    return {
      ...baseEffect,
      message: `Trap: ${draw.card.name}. Lost ${TRAP_COIN_LOSS} coins.`,
      coinDelta: -TRAP_COIN_LOSS,
      trapCardId: draw.card.id,
      nextSeed: draw.nextSeed,
    };
  }

  if (draw.card.id === "move-back-2") {
    return {
      ...baseEffect,
      message: `Trap: ${draw.card.name}. Moved back ${CARD_FIXED_MOVE_STEPS} spaces if possible.`,
      coinDelta: 0,
      trapCardId: draw.card.id,
      nextSeed: draw.nextSeed,
    };
  }

  const roll = rollSeededDie(draw.nextSeed, TITLE_SCREEN_DIE_SIDES);

  return {
    ...baseEffect,
    message: `Trap: ${draw.card.name} - rolled ${roll.value}. Moved back if possible.`,
    coinDelta: 0,
    trapCardId: draw.card.id,
    effectRoll: roll.value,
    nextSeed: roll.nextSeed,
  };
}

function resolveEventLanding(
  state: GameState,
  playerIndex: number,
  baseEffect: Omit<LandingEffect, "message" | "coinDelta">,
): LandingEffect {
  const draw = drawEventCard(state.seed);

  if (draw.card.id === "found-coins") {
    return {
      ...baseEffect,
      message: `Event: ${draw.card.name}. Gained ${EVENT_COIN_REWARD} coins.`,
      coinDelta: EVENT_COIN_REWARD,
      eventCardId: draw.card.id,
      nextSeed: draw.nextSeed,
    };
  }

  if (draw.card.id === "move-forward-2") {
    return {
      ...baseEffect,
      message: `Event: ${draw.card.name}. Moved forward ${CARD_FIXED_MOVE_STEPS} spaces.`,
      coinDelta: 0,
      eventCardId: draw.card.id,
      nextSeed: draw.nextSeed,
    };
  }

  if (draw.card.id === "roll-again") {
    const roll = rollSeededDie(draw.nextSeed, TITLE_SCREEN_DIE_SIDES);

    return {
      ...baseEffect,
      message: `Event: ${draw.card.name} - rolled ${roll.value}.`,
      coinDelta: 0,
      eventCardId: draw.card.id,
      effectRoll: roll.value,
      nextSeed: roll.nextSeed,
    };
  }

  const treasureDraw = drawTreasureCard(draw.nextSeed);
  const player = state.players[playerIndex];
  const handFull = (player?.treasureHand.length ?? 0) >= MAX_TREASURE_HAND_SIZE;

  return {
    ...baseEffect,
    message: handFull
      ? `Event: ${draw.card.name}. Drew ${treasureDraw.card.name}, but the hand is full.`
      : `Event: ${draw.card.name}. Drew ${treasureDraw.card.name}.`,
    coinDelta: 0,
    eventCardId: draw.card.id,
    treasureCardId: treasureDraw.card.id,
    treasureHandFull: handFull,
    nextSeed: treasureDraw.nextSeed,
  };
}
