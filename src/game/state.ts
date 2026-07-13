import {
  DEFAULT_PLAYER_COUNT,
  FIRST_PLAYER_INDEX,
  BURIED_TREASURE_TWO_CARD_MIN_ROLL,
  CARD_FIXED_MOVE_STEPS,
  COIN_SPACE_REWARD,
  EVEN_ROLL_DIVISOR,
  EVEN_ROLL_REMAINDER,
  EVENT_COIN_REWARD,
  GOLD_MINE_LARGE_REWARD_ROLL,
  GOLD_MINE_MEDIUM_REWARD_MIN_ROLL,
  HIDDEN_CAVE_TRAP_MAX_ROLL,
  INITIAL_PLAYER_COINS,
  INITIAL_RNG_SEED,
  MAX_TREASURE_HAND_SIZE,
  MINI_QUEST_COIN_LOSS,
  MINI_QUEST_LARGE_COIN_REWARD,
  MINI_QUEST_MEDIUM_COIN_REWARD,
  MINI_QUEST_SMALL_COIN_REWARD,
  TITLE_SCREEN_DIE_SIDES,
  TRAP_COIN_LOSS,
} from "../utils/constants";
import { getBoardSpace, START_SPACE_ID, type BoardSpaceType } from "./board";
import { getMiniQuest, type MiniQuestId } from "./miniQuests";
import { rollSeededDie } from "./rng";
import { getShop, type Shop, type ShopId } from "./shops";
import {
  drawTreasureCard,
  getTreasureCard,
  type TreasureCardId,
} from "./treasureCards";
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
  | "shopping"
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
  treasureCardIds: TreasureCardId[];
  treasureHandFull: boolean;
  trapCardId: TrapCardId | null;
  eventCardId: EventCardId | null;
  miniQuestId: MiniQuestId | null;
  shopId: ShopId | null;
  miniQuestRoll: number | null;
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
  activeShopId: ShopId | null;
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
    }
  | {
      type: "BUY_SHOP_TREASURE";
    }
  | {
      type: "SELL_SHOP_TREASURE";
      cardIndex: number;
    }
  | {
      type: "LEAVE_SHOP";
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
    activeShopId: null,
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
        activeShopId: null,
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
        activeShopId: null,
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
        activeShopId: null,
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
        activeShopId: null,
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

    case "BUY_SHOP_TREASURE":
      return buyShopTreasure(state);

    case "SELL_SHOP_TREASURE":
      return sellShopTreasure(state, move.cardIndex);

    case "LEAVE_SHOP":
      return leaveShop(state);
  }
}

export function getActiveShop(state: GameState): Shop | null {
  return state.activeShopId === null ? null : getShop(state.activeShopId);
}

export function canBuyShopTreasure(state: GameState): boolean {
  const shop = getActiveShop(state);
  const player = state.players[state.currentPlayerIndex];

  return (
    state.phase === "shopping" &&
    shop !== null &&
    player !== undefined &&
    player.coins >= shop.purchasePrice &&
    player.treasureHand.length < MAX_TREASURE_HAND_SIZE
  );
}

export function canSellShopTreasure(
  state: GameState,
  cardIndex: number,
): boolean {
  const player = state.players[state.currentPlayerIndex];

  return (
    state.phase === "shopping" &&
    state.activeShopId !== null &&
    player !== undefined &&
    cardIndex >= 0 &&
    cardIndex < player.treasureHand.length
  );
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
    activeShopId: null,
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
    landingEffect.treasureCardIds.length === 0
      ? playersAfterCoins
      : addTreasureCardsToPlayer(
          playersAfterCoins,
          playerIndex,
          landingEffect.treasureCardIds,
        );
  const effectState = {
    ...state,
    seed: landingEffect.nextSeed ?? state.seed,
    players: playersAfterTreasure,
    lastTurnSummary: summary,
    lastLandingEffect: landingEffect,
  };

  if (landingEffect.shopId !== null) {
    return {
      ...effectState,
      phase: "shopping",
      pendingMovement: 0,
      availableBranchSpaceIds: [],
      movementPurpose: "turn",
      movingPlayerIndex: playerIndex,
      currentPlayerIndex: playerIndex,
      pendingLandingEffect: null,
      activeShopId: landingEffect.shopId,
    };
  }

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
      movementPath: [...effectState.movementPath],
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
    treasureCardIds: [],
    treasureHandFull: false,
    trapCardId: null,
    eventCardId: null,
    miniQuestId: null,
    shopId: null,
    miniQuestRoll: null,
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
      return resolveActionLanding(state, playerIndex, baseEffect);
    case "blank":
      return {
        ...baseEffect,
        message: "Blank space: nothing happened.",
        coinDelta: 0,
      };
  }
}

function addTreasureCardsToPlayer(
  players: readonly PlayerState[],
  playerIndex: number,
  treasureCardIds: readonly TreasureCardId[],
): PlayerState[] {
  return players.map((player, index) => {
    if (index !== playerIndex) {
      return player;
    }

    return {
      ...player,
      treasureHand: [...player.treasureHand, ...treasureCardIds].slice(
        0,
        MAX_TREASURE_HAND_SIZE,
      ),
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

function removeTreasureCardAtIndex(
  players: readonly PlayerState[],
  playerIndex: number,
  cardIndex: number,
): PlayerState[] {
  return players.map((player, index) => {
    if (index !== playerIndex) {
      return player;
    }

    return {
      ...player,
      treasureHand: player.treasureHand.filter(
        (_, handIndex) => handIndex !== cardIndex,
      ),
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
      treasureCardIds: [],
      treasureHandFull: true,
      nextSeed: draw.nextSeed,
    };
  }

  return {
    ...baseEffect,
    message: `Treasure space: drew ${draw.card.name}.`,
    coinDelta: 0,
    treasureCardId: draw.card.id,
    treasureCardIds: [draw.card.id],
    treasureHandFull: false,
    nextSeed: draw.nextSeed,
  };
}

function resolveActionLanding(
  state: GameState,
  playerIndex: number,
  baseEffect: Omit<LandingEffect, "message" | "coinDelta">,
): LandingEffect {
  const space = getBoardSpace(baseEffect.spaceId);

  if (space?.shopId !== undefined) {
    const shop = getShop(space.shopId);

    return {
      ...baseEffect,
      message: `${shop.name}: buy a Treasure card, sell a card, or leave the shop.`,
      coinDelta: 0,
      shopId: shop.id,
    };
  }

  if (space?.miniQuestId === undefined) {
    return {
      ...baseEffect,
      message: "Action space: landmark interaction coming soon.",
      coinDelta: 0,
    };
  }

  const miniQuest = getMiniQuest(space.miniQuestId);
  const questRoll = rollSeededDie(state.seed, TITLE_SCREEN_DIE_SIDES);
  const questEffect = {
    ...baseEffect,
    miniQuestId: miniQuest.id,
    miniQuestRoll: questRoll.value,
  };

  if (miniQuest.id === "gold-mine") {
    const coinDelta =
      questRoll.value === GOLD_MINE_LARGE_REWARD_ROLL
        ? MINI_QUEST_LARGE_COIN_REWARD
        : questRoll.value >= GOLD_MINE_MEDIUM_REWARD_MIN_ROLL
          ? MINI_QUEST_MEDIUM_COIN_REWARD
          : MINI_QUEST_SMALL_COIN_REWARD;

    return {
      ...questEffect,
      message: `${miniQuest.name}: rolled ${questRoll.value}, gained ${coinDelta} coins.`,
      coinDelta,
      nextSeed: questRoll.nextSeed,
    };
  }

  if (miniQuest.id === "fishing-spot") {
    const coinDelta =
      questRoll.value % EVEN_ROLL_DIVISOR === EVEN_ROLL_REMAINDER
        ? MINI_QUEST_MEDIUM_COIN_REWARD
        : 0;

    return {
      ...questEffect,
      message:
        coinDelta === 0
          ? `${miniQuest.name}: rolled ${questRoll.value}, nothing happened.`
          : `${miniQuest.name}: rolled ${questRoll.value}, gained ${coinDelta} coins.`,
      coinDelta,
      nextSeed: questRoll.nextSeed,
    };
  }

  if (miniQuest.id === "monkey-business") {
    if (questRoll.value % EVEN_ROLL_DIVISOR !== EVEN_ROLL_REMAINDER) {
      return {
        ...questEffect,
        message: `${miniQuest.name}: rolled ${questRoll.value}, lost ${MINI_QUEST_COIN_LOSS} coins.`,
        coinDelta: -MINI_QUEST_COIN_LOSS,
        nextSeed: questRoll.nextSeed,
      };
    }

    const treasureDraw = drawTreasureCardsForPlayer(
      state.players[playerIndex],
      questRoll.nextSeed,
      1,
    );

    return {
      ...questEffect,
      message: formatMiniQuestTreasureMessage(
        miniQuest.name,
        questRoll.value,
        treasureDraw.cardNames,
        treasureDraw.handFull,
      ),
      coinDelta: 0,
      treasureCardId: treasureDraw.cardIds[0] ?? null,
      treasureCardIds: treasureDraw.cardIds,
      treasureHandFull: treasureDraw.handFull,
      nextSeed: treasureDraw.nextSeed,
    };
  }

  if (miniQuest.id === "buried-treasure") {
    const drawCount =
      questRoll.value >= BURIED_TREASURE_TWO_CARD_MIN_ROLL ? 2 : 1;
    const treasureDraw = drawTreasureCardsForPlayer(
      state.players[playerIndex],
      questRoll.nextSeed,
      drawCount,
    );

    return {
      ...questEffect,
      message: formatMiniQuestTreasureMessage(
        miniQuest.name,
        questRoll.value,
        treasureDraw.cardNames,
        treasureDraw.handFull,
      ),
      coinDelta: 0,
      treasureCardId: treasureDraw.cardIds[0] ?? null,
      treasureCardIds: treasureDraw.cardIds,
      treasureHandFull: treasureDraw.handFull,
      nextSeed: treasureDraw.nextSeed,
    };
  }

  if (questRoll.value <= HIDDEN_CAVE_TRAP_MAX_ROLL) {
    return resolveTrapEffectFromSeed(
      questRoll.nextSeed,
      questEffect,
      `${miniQuest.name}: rolled ${questRoll.value}, drew Trap`,
    );
  }

  const treasureDraw = drawTreasureCardsForPlayer(
    state.players[playerIndex],
    questRoll.nextSeed,
    1,
  );

  return {
    ...questEffect,
    message: formatMiniQuestTreasureMessage(
      miniQuest.name,
      questRoll.value,
      treasureDraw.cardNames,
      treasureDraw.handFull,
    ),
    coinDelta: 0,
    treasureCardId: treasureDraw.cardIds[0] ?? null,
    treasureCardIds: treasureDraw.cardIds,
    treasureHandFull: treasureDraw.handFull,
    nextSeed: treasureDraw.nextSeed,
  };
}

function buyShopTreasure(state: GameState): GameState {
  if (!canBuyShopTreasure(state)) {
    return state;
  }

  const shop = getActiveShop(state);
  const playerIndex = state.currentPlayerIndex;
  const draw = drawTreasureCard(state.seed);

  if (shop === null) {
    return state;
  }

  return {
    ...state,
    seed: draw.nextSeed,
    players: addTreasureCardsToPlayer(
      updatePlayerCoins(state.players, playerIndex, -shop.purchasePrice),
      playerIndex,
      [draw.card.id],
    ),
    lastTurnSummary: `${shop.name}: bought ${draw.card.name} for ${shop.purchasePrice} coins.`,
  };
}

function sellShopTreasure(state: GameState, cardIndex: number): GameState {
  if (!canSellShopTreasure(state, cardIndex)) {
    return state;
  }

  const shop = getActiveShop(state);
  const playerIndex = state.currentPlayerIndex;
  const cardId = state.players[playerIndex]?.treasureHand[cardIndex];

  if (shop === null || cardId === undefined) {
    return state;
  }

  const card = getTreasureCard(cardId);

  return {
    ...state,
    players: updatePlayerCoins(
      removeTreasureCardAtIndex(state.players, playerIndex, cardIndex),
      playerIndex,
      card.resaleValue,
    ),
    lastTurnSummary: `${shop.name}: sold ${card.name} for ${card.resaleValue} coins.`,
  };
}

function leaveShop(state: GameState): GameState {
  const shop = getActiveShop(state);

  if (state.phase !== "shopping" || shop === null) {
    return state;
  }

  return completeTurn(
    {
      ...state,
      activeShopId: null,
    },
    state.lastLandingEffect,
    `${shop.name}: left the shop.`,
  );
}

function drawTreasureCardsForPlayer(
  player: PlayerState | undefined,
  seed: number,
  drawCount: number,
): {
  cardIds: TreasureCardId[];
  cardNames: string[];
  handFull: boolean;
  nextSeed: number;
} {
  let nextSeed = seed;
  const cardIds: TreasureCardId[] = [];
  const cardNames: string[] = [];
  const availableSlots = Math.max(
    0,
    MAX_TREASURE_HAND_SIZE - (player?.treasureHand.length ?? 0),
  );

  for (let drawIndex = 0; drawIndex < drawCount; drawIndex += 1) {
    const draw = drawTreasureCard(nextSeed);
    cardNames.push(draw.card.name);
    nextSeed = draw.nextSeed;

    if (cardIds.length < availableSlots) {
      cardIds.push(draw.card.id);
    }
  }

  return {
    cardIds,
    cardNames,
    handFull: cardIds.length < drawCount,
    nextSeed,
  };
}

function formatMiniQuestTreasureMessage(
  miniQuestName: string,
  questRoll: number,
  cardNames: readonly string[],
  handFull: boolean,
): string {
  const drawnCards = cardNames.join(" and ");
  const suffix = handFull ? ", but the hand is full" : "";

  return `${miniQuestName}: rolled ${questRoll}, drew ${drawnCards}${suffix}.`;
}

function resolveTrapLanding(
  state: GameState,
  baseEffect: Omit<LandingEffect, "message" | "coinDelta">,
): LandingEffect {
  return resolveTrapEffectFromSeed(state.seed, baseEffect, "Trap");
}

function resolveTrapEffectFromSeed(
  seed: number,
  baseEffect: Omit<LandingEffect, "message" | "coinDelta">,
  label: string,
): LandingEffect {
  const draw = drawTrapCard(seed);

  if (draw.card.id === "safe") {
    return {
      ...baseEffect,
      message: `${label}: ${draw.card.name}. No effect.`,
      coinDelta: 0,
      trapCardId: draw.card.id,
      nextSeed: draw.nextSeed,
    };
  }

  if (draw.card.id === "lose-20-coins") {
    return {
      ...baseEffect,
      message: `${label}: ${draw.card.name}. Lost ${TRAP_COIN_LOSS} coins.`,
      coinDelta: -TRAP_COIN_LOSS,
      trapCardId: draw.card.id,
      nextSeed: draw.nextSeed,
    };
  }

  if (draw.card.id === "move-back-2") {
    return {
      ...baseEffect,
      message: `${label}: ${draw.card.name}. Moved back ${CARD_FIXED_MOVE_STEPS} spaces if possible.`,
      coinDelta: 0,
      trapCardId: draw.card.id,
      nextSeed: draw.nextSeed,
    };
  }

  const roll = rollSeededDie(draw.nextSeed, TITLE_SCREEN_DIE_SIDES);

  return {
    ...baseEffect,
    message: `${label}: ${draw.card.name} - rolled ${roll.value}. Moved back if possible.`,
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
    treasureCardIds: handFull ? [] : [treasureDraw.card.id],
    treasureHandFull: handFull,
    nextSeed: treasureDraw.nextSeed,
  };
}
