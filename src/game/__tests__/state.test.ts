import { describe, expect, it } from "vitest";

import {
  COIN_SPACE_REWARD,
  DEFAULT_PLAYER_COUNT,
  EVENT_COIN_REWARD,
  FINISH_BONUS_V1,
  FIRST_PLAYER_INDEX,
  GOLDEN_KEY_FINISH_BONUS,
  INITIAL_PLAYER_COINS,
  INITIAL_RNG_SEED,
  MINI_QUEST_COIN_LOSS,
  MINI_QUEST_LARGE_COIN_REWARD,
  MINI_QUEST_MEDIUM_COIN_REWARD,
  MINI_QUEST_SMALL_COIN_REWARD,
  SHOP_PURCHASE_PRICE,
  TITLE_SCREEN_DIE_SIDES,
  TRAP_COIN_LOSS,
  TREASURE_RESALE_VALUES,
} from "../../utils/constants";
import { FINISH_SPACE_ID, START_SPACE_ID } from "../board";
import { MINI_QUESTS } from "../miniQuests";
import { SHOPS } from "../shops";
import {
  applyMove,
  canBuyShopTreasure,
  canSellShopTreasure,
  canUseTreasureCard,
  createInitialGameState,
  type GameState,
} from "../state";
import type { TreasureCardId } from "../treasureCards";
import { TREASURE_CARDS } from "../treasureCards";
import { EVENT_CARDS, TRAP_CARDS } from "../trapEventCards";

function collectRolls(state: GameState, rollCount: number): number[] {
  const rolls: number[] = [];
  let currentState = state;

  for (let index = 0; index < rollCount; index += 1) {
    currentState = applyMove(currentState, { type: "ROLL_DIE" });
    rolls.push(currentState.lastRoll ?? 0);
  }

  return rolls;
}

function createBoardStateAt(spaceId: string, seed: number): GameState {
  const boardState = applyMove(createInitialGameState(), { type: "ENTER_BOARD" });

  return {
    ...boardState,
    seed,
    players: boardState.players.map((player, index) =>
      index === boardState.currentPlayerIndex
        ? {
            ...player,
            positionId: spaceId,
            pathHistory:
              spaceId === START_SPACE_ID ? [START_SPACE_ID] : [START_SPACE_ID, spaceId],
          }
        : player,
    ),
  };
}

function createBoardStateWithPath(
  pathHistory: string[],
  seed: number,
): GameState {
  const boardState = applyMove(createInitialGameState(), { type: "ENTER_BOARD" });
  const positionId = pathHistory[pathHistory.length - 1] ?? START_SPACE_ID;

  return {
    ...boardState,
    seed,
    players: boardState.players.map((player, index) =>
      index === boardState.currentPlayerIndex
        ? {
            ...player,
            positionId,
            pathHistory,
          }
        : player,
    ),
  };
}

function createForkChoiceState(seed: number): GameState {
  return {
    ...createBoardStateWithPath(
      ["start", "camp-coin", "camp-blank", "camp-event", "camp-fork"],
      seed,
    ),
    phase: "choosingBranch",
    pendingMovement: 1,
    availableBranchSpaceIds: ["field-entry", "cave-mouth"],
  };
}

function createBoardStateWithActiveHand(
  treasureHand: TreasureCardId[],
  seed: number,
  spaceId = START_SPACE_ID,
): GameState {
  const boardState = createBoardStateAt(spaceId, seed);

  return {
    ...boardState,
    players: boardState.players.map((player, index) =>
      index === boardState.currentPlayerIndex
        ? {
            ...player,
            treasureHand,
          }
        : player,
    ),
  };
}

function createShopState(
  coins: number,
  treasureHand: TreasureCardId[] = [],
  seed = 7,
): GameState {
  const preShopState = createBoardStateAt("cave-event", seed);
  const fundedState = {
    ...preShopState,
    players: preShopState.players.map((player, index) =>
      index === preShopState.currentPlayerIndex
        ? {
            ...player,
            coins,
            treasureHand,
          }
        : player,
    ),
  };

  return applyMove(fundedState, { type: "ROLL_DIE" });
}

function createFinishState(
  playerOneCoins: number,
  playerTwoCoins: number,
  goldenKeyHolderPlayerIndex: number | null = null,
): GameState {
  const preFinishState = createBoardStateAt("finish-gate", 7);
  const fundedState = {
    ...preFinishState,
    goldenKeyHolderPlayerIndex,
    players: preFinishState.players.map((player, index) => ({
      ...player,
      coins: index === 0 ? playerOneCoins : playerTwoCoins,
    })),
  };

  return applyMove(fundedState, { type: "ROLL_DIE" });
}

describe("game state", () => {
  it("creates the initial state", () => {
    expect(createInitialGameState()).toEqual({
      seed: INITIAL_RNG_SEED,
      lastRoll: null,
      currentPlayerIndex: FIRST_PLAYER_INDEX,
      playerCount: DEFAULT_PLAYER_COUNT,
      phase: "title",
      players: [
        {
          id: "player-1",
          name: "Player 1",
          positionId: START_SPACE_ID,
          pathHistory: [START_SPACE_ID],
          coins: INITIAL_PLAYER_COINS,
          treasureHand: [],
        },
        {
          id: "player-2",
          name: "Player 2",
          positionId: START_SPACE_ID,
          pathHistory: [START_SPACE_ID],
          coins: INITIAL_PLAYER_COINS,
          treasureHand: [],
        },
      ],
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
      goldenKeyHolderPlayerIndex: null,
      gameOverResult: null,
    });
  });

  it("initial 2-player state starts both players at Start", () => {
    const state = createInitialGameState();

    expect(state.players).toHaveLength(2);
    expect(state.players.map((player) => player.positionId)).toEqual([
      START_SPACE_ID,
      START_SPACE_ID,
    ]);
  });

  it("players start with 0 coins", () => {
    const state = createInitialGameState();

    expect(state.players.map((player) => player.coins)).toEqual([
      INITIAL_PLAYER_COINS,
      INITIAL_PLAYER_COINS,
    ]);
  });

  it("players start with empty Treasure hands", () => {
    const state = createInitialGameState();

    expect(state.players.map((player) => player.treasureHand)).toEqual([[], []]);
  });

  it("players start without the Golden Key", () => {
    expect(createInitialGameState().goldenKeyHolderPlayerIndex).toBeNull();
  });

  it("Treasure card catalog includes the 7 confirmed cards and resale values", () => {
    expect(TREASURE_CARDS).toEqual([
      { id: "compass", name: "Compass", resaleValue: TREASURE_RESALE_VALUES.compass },
      { id: "shop", name: "Shop", resaleValue: TREASURE_RESALE_VALUES.shop },
      { id: "aid", name: "Aid", resaleValue: TREASURE_RESALE_VALUES.aid },
      {
        id: "time-machine",
        name: "Time Machine",
        resaleValue: TREASURE_RESALE_VALUES.timeMachine,
      },
      { id: "shovel", name: "Shovel", resaleValue: TREASURE_RESALE_VALUES.shovel },
      { id: "crab", name: "Crab", resaleValue: TREASURE_RESALE_VALUES.crab },
      { id: "whistle", name: "Whistle", resaleValue: TREASURE_RESALE_VALUES.whistle },
    ]);
  });

  it("Trap and Event card catalogs include the v1 cards", () => {
    expect(TRAP_CARDS.map((card) => card.id)).toEqual([
      "safe",
      "lose-20-coins",
      "move-back-2",
      "roll-and-move-back",
    ]);
    expect(EVENT_CARDS.map((card) => card.id)).toEqual([
      "found-coins",
      "move-forward-2",
      "roll-again",
      "draw-treasure",
    ]);
  });

  it("mini-quest catalog includes the v1 quests", () => {
    expect(MINI_QUESTS.map((miniQuest) => miniQuest.id)).toEqual([
      "gold-mine",
      "fishing-spot",
      "monkey-business",
      "buried-treasure",
      "hidden-cave",
    ]);
  });

  it("shop catalog exists and includes the v1 shop price", () => {
    expect(SHOPS).toEqual([
      {
        id: "trail-shop",
        name: "Trail Shop",
        purchasePrice: SHOP_PURCHASE_PRICE,
      },
    ]);
  });

  it("active player starts as Player 1", () => {
    const state = createInitialGameState();

    expect(state.currentPlayerIndex).toBe(0);
    expect(state.players[state.currentPlayerIndex]?.name).toBe("Player 1");
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

  it("keeps current player and player count stable for title-screen rolls", () => {
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

    expect(nextState.players[0]?.positionId).toBe("camp-coin");
    expect(nextState.movementPath).toEqual(["camp-coin"]);
    expect(nextState.phase).toBe("waitingToRoll");
  });

  it("movement pauses when a branch is reached with movement remaining", () => {
    const boardState = {
      ...applyMove(createInitialGameState(), { type: "ENTER_BOARD" }),
      seed: 2,
    };
    const nextState = applyMove(boardState, { type: "ROLL_DIE" });

    expect(nextState.players[0]?.positionId).toBe("camp-fork");
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

    expect(nextState.players[0]?.positionId).not.toBe("camp-fork");
    expect(nextState.availableBranchSpaceIds).toEqual([]);
    expect(nextState.phase).toBe("waitingToRoll");
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

    expect(firstResult.players.map((player) => player.positionId)).toEqual(
      secondResult.players.map((player) => player.positionId),
    );
    expect(firstResult.lastRoll).toBe(secondResult.lastRoll);
    expect(firstResult.seed).toBe(secondResult.seed);
  });

  it("only the active player moves after a roll", () => {
    const boardState = applyMove(createInitialGameState(), { type: "ENTER_BOARD" });
    const nextState = applyMove(boardState, { type: "ROLL_DIE" });

    expect(nextState.players[0]?.positionId).toBe("camp-event");
    expect(nextState.players[1]?.positionId).toBe(START_SPACE_ID);
  });

  it("ending movement advances the turn", () => {
    const boardState = applyMove(createInitialGameState(), { type: "ENTER_BOARD" });
    const nextState = applyMove(boardState, { type: "ROLL_DIE" });

    expect(nextState.currentPlayerIndex).toBe(1);
    expect(nextState.players[nextState.currentPlayerIndex]?.name).toBe("Player 2");
  });

  it("branch choice does not advance the turn until movement is complete", () => {
    const branchState = applyMove(
      {
        ...applyMove(createInitialGameState(), { type: "ENTER_BOARD" }),
        seed: 2,
      },
      { type: "ROLL_DIE" },
    );

    expect(branchState.phase).toBe("choosingBranch");
    expect(branchState.currentPlayerIndex).toBe(0);

    const nextState = applyMove(branchState, {
      type: "CHOOSE_BRANCH",
      spaceId: "field-entry",
    });

    expect(nextState.phase).toBe("waitingToRoll");
    expect(nextState.currentPlayerIndex).toBe(1);
  });

  it("turn order alternates Player 1 to Player 2 to Player 1", () => {
    const playerOneDone = applyMove(
      applyMove(createInitialGameState(), { type: "ENTER_BOARD" }),
      { type: "ROLL_DIE" },
    );
    const playerTwoDone = applyMove({ ...playerOneDone, seed: 7 }, { type: "ROLL_DIE" });

    expect(playerOneDone.currentPlayerIndex).toBe(1);
    expect(playerTwoDone.currentPlayerIndex).toBe(0);
  });

  it("rolling is not legal while branch choice is pending", () => {
    const branchState = applyMove(
      {
        ...applyMove(createInitialGameState(), { type: "ENTER_BOARD" }),
        seed: 2,
      },
      { type: "ROLL_DIE" },
    );
    const nextState = applyMove(branchState, { type: "ROLL_DIE" });

    expect(nextState).toBe(branchState);
  });

  it("using Compass removes exactly one Compass from the active player's hand", () => {
    const compassState = createBoardStateWithActiveHand(
      ["shop", "compass", "compass"],
      7,
    );
    const nextState = applyMove(compassState, {
      type: "USE_TREASURE_CARD",
      cardId: "compass",
    });

    expect(nextState.players[0]?.treasureHand).toEqual(["shop", "compass"]);
    expect(nextState.players[1]?.treasureHand).toEqual([]);
  });

  it("using Compass advances the seeded RNG and creates movement like a normal roll", () => {
    const compassState = createBoardStateWithActiveHand(["compass"], 2);
    const nextState = applyMove(compassState, {
      type: "USE_TREASURE_CARD",
      cardId: "compass",
    });

    expect(nextState.seed).not.toBe(compassState.seed);
    expect(nextState.lastRoll).not.toBeNull();
    expect(nextState.lastRollSource).toBe("compass");
    expect(nextState.phase).toBe("choosingBranch");
    expect(nextState.pendingMovement).toBeGreaterThan(0);
  });

  it("Compass use can pause at a branch and continue after a legal branch choice", () => {
    const compassState = createBoardStateWithActiveHand(["compass"], 2);
    const branchState = applyMove(compassState, {
      type: "USE_TREASURE_CARD",
      cardId: "compass",
    });
    const nextState = applyMove(branchState, {
      type: "CHOOSE_BRANCH",
      spaceId: "cave-mouth",
    });

    expect(branchState.phase).toBe("choosingBranch");
    expect(branchState.availableBranchSpaceIds).toEqual(["field-entry", "cave-mouth"]);
    expect(nextState.phase).toBe("waitingToRoll");
    expect(nextState.players[0]?.positionId).toBe("cave-mouth");
  });

  it("Compass use resolves the final landing space and advances the turn", () => {
    const compassState = createBoardStateWithActiveHand(["compass"], 7);
    const nextState = applyMove(compassState, {
      type: "USE_TREASURE_CARD",
      cardId: "compass",
    });

    expect(nextState.lastLandingEffect).toMatchObject({
      playerIndex: 0,
      spaceType: "coin",
      coinDelta: COIN_SPACE_REWARD,
    });
    expect(nextState.players[0]?.coins).toBe(COIN_SPACE_REWARD);
    expect(nextState.currentPlayerIndex).toBe(1);
    expect(nextState.lastTurnSummary).toContain("Player 1 used Compass and rolled");
  });

  it("Compass cannot be used without the card", () => {
    const boardState = createBoardStateWithActiveHand(["shop"], 7);
    const nextState = applyMove(boardState, {
      type: "USE_TREASURE_CARD",
      cardId: "compass",
    });

    expect(canUseTreasureCard(boardState, "compass")).toBe(false);
    expect(nextState).toBe(boardState);
  });

  it("Compass cannot be used when it is not the active player's legal pre-roll phase", () => {
    const branchState = applyMove(createBoardStateWithActiveHand(["compass"], 2), {
      type: "USE_TREASURE_CARD",
      cardId: "compass",
    });
    const nextState = applyMove(branchState, {
      type: "USE_TREASURE_CARD",
      cardId: "compass",
    });

    expect(branchState.phase).toBe("choosingBranch");
    expect(canUseTreasureCard(branchState, "compass")).toBe(false);
    expect(nextState).toBe(branchState);
  });

  it("Compass cannot be used during another player's turn", () => {
    const boardState = createBoardStateAt(START_SPACE_ID, 7);
    const wrongTurnState = {
      ...boardState,
      currentPlayerIndex: 1,
      players: boardState.players.map((player, index) =>
        index === 0
          ? {
              ...player,
              treasureHand: ["compass" as const],
            }
          : player,
      ),
    };
    const nextState = applyMove(wrongTurnState, {
      type: "USE_TREASURE_CARD",
      cardId: "compass",
    });

    expect(nextState).toBe(wrongTurnState);
  });

  it("unusable Treasure cards do not trigger effects", () => {
    const boardState = createBoardStateWithActiveHand(["shop"], 7);
    const nextState = applyMove(boardState, {
      type: "USE_TREASURE_CARD",
      cardId: "shop",
    });

    expect(canUseTreasureCard(boardState, "shop")).toBe(false);
    expect(nextState).toBe(boardState);
  });

  it("same seed plus same choices produces deterministic positions and turn order", () => {
    const playRound = (): GameState => {
      const entered = applyMove(createInitialGameState(), { type: "ENTER_BOARD" });
      const playerOneBranch = applyMove({ ...entered, seed: 2 }, { type: "ROLL_DIE" });
      const playerTwoTurn = applyMove(playerOneBranch, {
        type: "CHOOSE_BRANCH",
        spaceId: "cave-mouth",
      });

      return applyMove(playerTwoTurn, { type: "ROLL_DIE" });
    };
    const firstResult = playRound();
    const secondResult = playRound();

    expect(firstResult.currentPlayerIndex).toBe(secondResult.currentPlayerIndex);
    expect(firstResult.players.map((player) => player.positionId)).toEqual(
      secondResult.players.map((player) => player.positionId),
    );
  });

  it("landing on a Coin space adds 10 coins to only the active player", () => {
    const nextState = applyMove(createBoardStateAt(START_SPACE_ID, 7), {
      type: "ROLL_DIE",
    });

    expect(nextState.players[0]?.coins).toBe(COIN_SPACE_REWARD);
    expect(nextState.players[1]?.coins).toBe(INITIAL_PLAYER_COINS);
    expect(nextState.lastLandingEffect).toMatchObject({
      playerIndex: 0,
      spaceType: "coin",
      coinDelta: COIN_SPACE_REWARD,
    });
  });

  it("landing on Blank does not change coins", () => {
    const nextState = applyMove(createBoardStateAt("camp-coin", 7), {
      type: "ROLL_DIE",
    });

    expect(nextState.players[0]?.coins).toBe(INITIAL_PLAYER_COINS);
    expect(nextState.lastLandingEffect).toMatchObject({
      spaceType: "blank",
      message: "Blank space: nothing happened.",
      coinDelta: 0,
    });
  });

  it("Gold Mine outcomes are correct", () => {
    const lowRollState = applyMove(createBoardStateAt("field-entry", 7), {
      type: "ROLL_DIE",
    });
    const middleRollState = applyMove(createBoardStateAt("field-entry", 8), {
      type: "ROLL_DIE",
    });
    const highRollState = applyMove(createBoardStateAt("field-entry", 45), {
      type: "ROLL_DIE",
    });

    expect(lowRollState.lastLandingEffect).toMatchObject({
      miniQuestId: "gold-mine",
      miniQuestRoll: 1,
      coinDelta: MINI_QUEST_SMALL_COIN_REWARD,
    });
    expect(middleRollState.lastLandingEffect).toMatchObject({
      miniQuestId: "gold-mine",
      miniQuestRoll: 4,
      coinDelta: MINI_QUEST_MEDIUM_COIN_REWARD,
    });
    expect(highRollState.lastLandingEffect).toMatchObject({
      miniQuestId: "gold-mine",
      miniQuestRoll: 6,
      coinDelta: MINI_QUEST_LARGE_COIN_REWARD,
    });
  });

  it("Fishing Spot outcomes are correct", () => {
    const oddRollState = applyMove(createBoardStateAt("lookout-blank", 7), {
      type: "ROLL_DIE",
    });
    const evenRollState = applyMove(createBoardStateAt("lookout-blank", 19), {
      type: "ROLL_DIE",
    });

    expect(oddRollState.lastLandingEffect).toMatchObject({
      miniQuestId: "fishing-spot",
      miniQuestRoll: 1,
      coinDelta: 0,
    });
    expect(oddRollState.lastLandingEffect?.message).toContain("nothing happened");
    expect(evenRollState.lastLandingEffect).toMatchObject({
      miniQuestId: "fishing-spot",
      miniQuestRoll: 2,
      coinDelta: MINI_QUEST_MEDIUM_COIN_REWARD,
    });
  });

  it("Monkey Business outcomes are correct", () => {
    const oddRollState = applyMove(createBoardStateAt("cliff-trap", 7), {
      type: "ROLL_DIE",
    });
    const evenRollState = applyMove(createBoardStateAt("cliff-trap", 19), {
      type: "ROLL_DIE",
    });

    expect(oddRollState.lastLandingEffect).toMatchObject({
      miniQuestId: "monkey-business",
      miniQuestRoll: 1,
      coinDelta: -MINI_QUEST_COIN_LOSS,
    });
    expect(oddRollState.players[0]?.coins).toBe(0);
    expect(evenRollState.lastLandingEffect).toMatchObject({
      miniQuestId: "monkey-business",
      miniQuestRoll: 2,
      treasureHandFull: false,
    });
    expect(evenRollState.players[0]?.treasureHand).toHaveLength(1);
  });

  it("Buried Treasure outcomes are correct and respects hand limit", () => {
    const oneCardState = applyMove(createBoardStateAt("field-coin", 7), {
      type: "ROLL_DIE",
    });
    const twoCardState = applyMove(createBoardStateAt("field-coin", 39), {
      type: "ROLL_DIE",
    });
    const fullHandState = createBoardStateWithActiveHand(
      ["compass", "shop", "aid"],
      39,
      "field-coin",
    );
    const fullHandResult = applyMove(fullHandState, { type: "ROLL_DIE" });

    expect(oneCardState.lastLandingEffect).toMatchObject({
      miniQuestId: "buried-treasure",
      miniQuestRoll: 1,
      treasureHandFull: false,
    });
    expect(oneCardState.players[0]?.treasureHand).toHaveLength(1);
    expect(twoCardState.lastLandingEffect).toMatchObject({
      miniQuestId: "buried-treasure",
      miniQuestRoll: 5,
      treasureHandFull: false,
    });
    expect(twoCardState.players[0]?.treasureHand).toHaveLength(2);
    expect(fullHandResult.lastLandingEffect).toMatchObject({
      miniQuestId: "buried-treasure",
      miniQuestRoll: 5,
      treasureHandFull: true,
    });
    expect(fullHandResult.players[0]?.treasureHand).toEqual([
      "compass",
      "shop",
      "aid",
    ]);
  });

  it("Hidden Cave outcomes are correct", () => {
    const trapState = applyMove(
      createBoardStateWithPath(["start", "camp-coin", "camp-blank", "camp-event"], 23),
      { type: "ROLL_DIE" },
    );
    const treasureState = applyMove(createBoardStateAt("camp-event", 8), {
      type: "ROLL_DIE",
    });

    expect(trapState.lastLandingEffect).toMatchObject({
      miniQuestId: "hidden-cave",
      miniQuestRoll: 1,
      trapCardId: "move-back-2",
    });
    expect(treasureState.lastLandingEffect).toMatchObject({
      miniQuestId: "hidden-cave",
      miniQuestRoll: 4,
      treasureHandFull: false,
    });
    expect(treasureState.players[0]?.treasureHand).toHaveLength(1);
  });

  it("Hidden Cave Trap draw is deterministic", () => {
    const drawHiddenCaveTrap = (): GameState =>
      applyMove(
        createBoardStateWithPath(
          ["start", "camp-coin", "camp-blank", "camp-event"],
          23,
        ),
        { type: "ROLL_DIE" },
      );
    const firstResult = drawHiddenCaveTrap();
    const secondResult = drawHiddenCaveTrap();

    expect(firstResult.lastLandingEffect?.trapCardId).toBe("move-back-2");
    expect(firstResult.lastLandingEffect?.trapCardId).toBe(
      secondResult.lastLandingEffect?.trapCardId,
    );
    expect(firstResult.lastLandingEffect?.message).toBe(
      secondResult.lastLandingEffect?.message,
    );
  });

  it("mini-quest rolls are deterministic from the same seed and state", () => {
    const playMiniQuest = (): GameState =>
      applyMove(createBoardStateAt("field-entry", 45), { type: "ROLL_DIE" });
    const firstResult = playMiniQuest();
    const secondResult = playMiniQuest();

    expect(firstResult.lastLandingEffect?.miniQuestId).toBe("gold-mine");
    expect(firstResult.lastLandingEffect?.miniQuestRoll).toBe(6);
    expect(firstResult.lastLandingEffect?.miniQuestRoll).toBe(
      secondResult.lastLandingEffect?.miniQuestRoll,
    );
    expect(firstResult.players[0]?.coins).toBe(secondResult.players[0]?.coins);
  });

  it("mini-quest movement waits until movement is complete before advancing the turn", () => {
    const nextState = applyMove(
      createBoardStateWithPath(["start", "camp-coin", "camp-blank", "camp-event"], 23),
      { type: "ROLL_DIE" },
    );

    expect(nextState.lastLandingEffect).toMatchObject({
      miniQuestId: "hidden-cave",
      trapCardId: "move-back-2",
    });
    expect(nextState.currentPlayerIndex).toBe(1);
    expect(nextState.players[0]?.positionId).toBe("camp-blank");
  });

  it("landing on a shop enters shop phase", () => {
    const shopState = createShopState(0);

    expect(shopState.phase).toBe("shopping");
    expect(shopState.activeShopId).toBe("trail-shop");
    expect(shopState.currentPlayerIndex).toBe(0);
    expect(shopState.lastLandingEffect).toMatchObject({
      shopId: "trail-shop",
      coinDelta: 0,
    });
  });

  it("turn does not advance until leaving shop", () => {
    const shopState = createShopState(0);
    const stillShopping = applyMove(shopState, { type: "BUY_SHOP_TREASURE" });
    const nextTurn = applyMove(shopState, { type: "LEAVE_SHOP" });

    expect(stillShopping.currentPlayerIndex).toBe(0);
    expect(stillShopping.phase).toBe("shopping");
    expect(nextTurn.currentPlayerIndex).toBe(1);
    expect(nextTurn.phase).toBe("waitingToRoll");
  });

  it("buying requires enough coins", () => {
    const shopState = createShopState(SHOP_PURCHASE_PRICE - 1);
    const nextState = applyMove(shopState, { type: "BUY_SHOP_TREASURE" });

    expect(canBuyShopTreasure(shopState)).toBe(false);
    expect(nextState).toBe(shopState);
  });

  it("buying requires hand space", () => {
    const shopState = createShopState(SHOP_PURCHASE_PRICE, [
      "compass",
      "shop",
      "aid",
    ]);
    const nextState = applyMove(shopState, { type: "BUY_SHOP_TREASURE" });

    expect(canBuyShopTreasure(shopState)).toBe(false);
    expect(nextState).toBe(shopState);
  });

  it("buying subtracts 40 coins and draws a deterministic Treasure card", () => {
    const buyOnce = (): GameState =>
      applyMove(createShopState(SHOP_PURCHASE_PRICE), {
        type: "BUY_SHOP_TREASURE",
      });
    const firstResult = buyOnce();
    const secondResult = buyOnce();

    expect(firstResult.players[0]?.coins).toBe(0);
    expect(firstResult.players[0]?.treasureHand).toHaveLength(1);
    expect(firstResult.players[0]?.treasureHand).toEqual(
      secondResult.players[0]?.treasureHand,
    );
    expect(firstResult.seed).toBe(secondResult.seed);
    expect(firstResult.lastTurnSummary).toContain("bought");
  });

  it("selling removes the selected card and adds its resale value", () => {
    const shopState = createShopState(0, ["compass", "whistle"]);
    const nextState = applyMove(shopState, {
      type: "SELL_SHOP_TREASURE",
      cardIndex: 1,
    });

    expect(canSellShopTreasure(shopState, 1)).toBe(true);
    expect(nextState.players[0]?.treasureHand).toEqual(["compass"]);
    expect(nextState.players[0]?.coins).toBe(TREASURE_RESALE_VALUES.whistle);
    expect(nextState.lastTurnSummary).toContain("sold Whistle");
  });

  it("a player can buy and sell multiple times before leaving", () => {
    const boughtState = applyMove(createShopState(SHOP_PURCHASE_PRICE * 2, ["compass"]), {
      type: "BUY_SHOP_TREASURE",
    });
    const soldState = applyMove(boughtState, {
      type: "SELL_SHOP_TREASURE",
      cardIndex: 0,
    });
    const leftState = applyMove(soldState, { type: "LEAVE_SHOP" });

    expect(boughtState.phase).toBe("shopping");
    expect(soldState.phase).toBe("shopping");
    expect(soldState.players[0]?.treasureHand.length).toBe(1);
    expect(soldState.players[0]?.coins).toBe(SHOP_PURCHASE_PRICE + TREASURE_RESALE_VALUES.compass);
    expect(leftState.currentPlayerIndex).toBe(1);
  });

  it("invalid shop actions are safely ignored", () => {
    const boardState = createBoardStateAt(START_SPACE_ID, 7);
    const shopState = createShopState(SHOP_PURCHASE_PRICE);

    expect(applyMove(boardState, { type: "BUY_SHOP_TREASURE" })).toBe(boardState);
    expect(
      applyMove(shopState, {
        type: "SELL_SHOP_TREASURE",
        cardIndex: 2,
      }),
    ).toBe(shopState);
    expect(applyMove(boardState, { type: "LEAVE_SHOP" })).toBe(boardState);
  });

  it("leaving shop advances the turn", () => {
    const shopState = createShopState(SHOP_PURCHASE_PRICE);
    const nextState = applyMove(shopState, { type: "LEAVE_SHOP" });

    expect(nextState.activeShopId).toBeNull();
    expect(nextState.currentPlayerIndex).toBe(1);
    expect(nextState.players[nextState.currentPlayerIndex]?.name).toBe("Player 2");
  });

  it("reaching Finish enters game-over phase", () => {
    const nextState = createFinishState(20, 10);

    expect(nextState.phase).toBe("gameOver");
    expect(nextState.players[0]?.positionId).toBe(FINISH_SPACE_ID);
    expect(nextState.gameOverResult).toMatchObject({
      finisherPlayerIndex: 0,
      winnerPlayerIndex: 0,
      isTie: false,
    });
  });

  it("2-player game ends when first player reaches Finish", () => {
    const nextState = createFinishState(20, 10);

    expect(nextState.phase).toBe("gameOver");
    expect(nextState.currentPlayerIndex).toBe(0);
    expect(nextState.pendingMovement).toBe(0);
    expect(nextState.lastTurnSummary).toContain("Player 1 reached Finish");
  });

  it("winner is highest coin total", () => {
    const nextState = createFinishState(30, 10);

    expect(nextState.gameOverResult?.winnerPlayerIndex).toBe(0);
    expect(nextState.gameOverResult?.finalCoins).toEqual([30, 10]);
  });

  it("finisher can lose if another player has more coins", () => {
    const nextState = createFinishState(10, 40);

    expect(nextState.gameOverResult).toMatchObject({
      finisherPlayerIndex: 0,
      winnerPlayerIndex: 1,
      isTie: false,
    });
    expect(nextState.gameOverResult?.message).toContain("Player 2 wins");
  });

  it("ties produce a tie result", () => {
    const nextState = createFinishState(30, 30);

    expect(nextState.gameOverResult).toMatchObject({
      winnerPlayerIndex: null,
      isTie: true,
      finalCoins: [30, 30],
    });
    expect(nextState.gameOverResult?.message).toContain("tied");
  });

  it("no finish bonus is awarded in this v1", () => {
    const nextState = createFinishState(20, 10);

    expect(FINISH_BONUS_V1).toBe(0);
    expect(nextState.gameOverResult?.finishBonusAwarded).toBe(FINISH_BONUS_V1);
    expect(nextState.gameOverResult?.finalCoins).toEqual([20, 10]);
  });

  it("finishing with Golden Key adds 100 coins", () => {
    const nextState = createFinishState(20, 10, 0);

    expect(GOLDEN_KEY_FINISH_BONUS).toBe(100);
    expect(nextState.gameOverResult?.finishBonusAwarded).toBe(GOLDEN_KEY_FINISH_BONUS);
    expect(nextState.gameOverResult?.finalCoins).toEqual([120, 10]);
    expect(nextState.gameOverResult?.message).toContain("Golden Key");
  });

  it("winner calculation uses post-Golden-Key bonus coin totals", () => {
    const nextState = createFinishState(20, 90, 0);

    expect(nextState.gameOverResult).toMatchObject({
      winnerPlayerIndex: 0,
      finalCoins: [120, 90],
    });
  });

  it("a player can still lose after finishing with Golden Key if the other player has more coins", () => {
    const nextState = createFinishState(20, 150, 0);

    expect(nextState.gameOverResult).toMatchObject({
      winnerPlayerIndex: 1,
      finalCoins: [120, 150],
    });
  });

  it("ties after Golden Key bonus still show tie", () => {
    const nextState = createFinishState(20, 120, 0);

    expect(nextState.gameOverResult).toMatchObject({
      winnerPlayerIndex: null,
      isTie: true,
      finalCoins: [120, 120],
    });
    expect(nextState.gameOverResult?.message).toContain("tied");
  });

  it("rolling is not legal after game over", () => {
    const gameOverState = createFinishState(20, 10);
    const nextState = applyMove(gameOverState, { type: "ROLL_DIE" });

    expect(nextState).toBe(gameOverState);
  });

  it("Compass is not legal after game over", () => {
    const finishedState = createFinishState(20, 10);
    const gameOverState = {
      ...finishedState,
      players: finishedState.players.map((player, index) =>
        index === 0
          ? {
              ...player,
              treasureHand: ["compass" as const],
            }
          : player,
      ),
    };
    const nextState = applyMove(gameOverState, {
      type: "USE_TREASURE_CARD",
      cardId: "compass",
    });

    expect(canUseTreasureCard(gameOverState, "compass")).toBe(false);
    expect(nextState).toBe(gameOverState);
  });

  it("branch choices are not legal after game over", () => {
    const gameOverState = {
      ...createFinishState(20, 10),
      availableBranchSpaceIds: ["field-entry", "cave-mouth"],
    };
    const nextState = applyMove(gameOverState, {
      type: "CHOOSE_BRANCH",
      spaceId: "field-entry",
    });

    expect(nextState).toBe(gameOverState);
  });

  it("shop actions are not legal after game over", () => {
    const gameOverState = createFinishState(SHOP_PURCHASE_PRICE, 10);

    expect(applyMove(gameOverState, { type: "BUY_SHOP_TREASURE" })).toBe(gameOverState);
    expect(
      applyMove(gameOverState, {
        type: "SELL_SHOP_TREASURE",
        cardIndex: 0,
      }),
    ).toBe(gameOverState);
    expect(applyMove(gameOverState, { type: "LEAVE_SHOP" })).toBe(gameOverState);
  });

  it("Trap draws are deterministic", () => {
    const drawTrap = (): GameState =>
      applyMove(createForkChoiceState(12), {
        type: "CHOOSE_BRANCH",
        spaceId: "cave-mouth",
      });
    const firstResult = drawTrap();
    const secondResult = drawTrap();

    expect(firstResult.lastLandingEffect?.trapCardId).toBe("lose-20-coins");
    expect(firstResult.lastLandingEffect?.trapCardId).toBe(
      secondResult.lastLandingEffect?.trapCardId,
    );
    expect(firstResult.lastLandingEffect?.message).toBe(
      secondResult.lastLandingEffect?.message,
    );
  });

  it("Event draws are deterministic", () => {
    const drawEvent = (): GameState =>
      applyMove(createBoardStateAt("camp-blank", 7), { type: "ROLL_DIE" });
    const firstResult = drawEvent();
    const secondResult = drawEvent();

    expect(firstResult.lastLandingEffect?.eventCardId).toBe("found-coins");
    expect(firstResult.lastLandingEffect?.eventCardId).toBe(
      secondResult.lastLandingEffect?.eventCardId,
    );
    expect(firstResult.lastLandingEffect?.message).toBe(
      secondResult.lastLandingEffect?.message,
    );
  });

  it("Safe Trap does nothing", () => {
    const nextState = applyMove(createForkChoiceState(7), {
      type: "CHOOSE_BRANCH",
      spaceId: "cave-mouth",
    });

    expect(nextState.lastLandingEffect).toMatchObject({
      spaceType: "trap",
      trapCardId: "safe",
      coinDelta: 0,
      message: "Trap: Safe. No effect.",
    });
    expect(nextState.players[0]?.coins).toBe(INITIAL_PLAYER_COINS);
  });

  it("Lose 20 Coins cannot make coins negative", () => {
    const nextState = applyMove(createForkChoiceState(12), {
      type: "CHOOSE_BRANCH",
      spaceId: "cave-mouth",
    });

    expect(nextState.lastLandingEffect).toMatchObject({
      trapCardId: "lose-20-coins",
      coinDelta: -TRAP_COIN_LOSS,
    });
    expect(nextState.players[0]?.coins).toBe(0);
  });

  it("Found Coins adds 20 coins", () => {
    const nextState = applyMove(createBoardStateAt("camp-blank", 7), {
      type: "ROLL_DIE",
    });

    expect(nextState.lastLandingEffect).toMatchObject({
      eventCardId: "found-coins",
      coinDelta: EVENT_COIN_REWARD,
    });
    expect(nextState.players[0]?.coins).toBe(EVENT_COIN_REWARD);
  });

  it("Draw Treasure uses the existing Treasure hand rules", () => {
    const nextState = applyMove(createBoardStateAt("camp-blank", 39), {
      type: "ROLL_DIE",
    });

    expect(nextState.lastLandingEffect).toMatchObject({
      eventCardId: "draw-treasure",
      treasureHandFull: false,
    });
    expect(nextState.players[0]?.treasureHand).toHaveLength(1);
    expect(nextState.players[1]?.treasureHand).toEqual([]);
  });

  it("Draw Treasure respects a full Treasure hand", () => {
    const fullHandState = createBoardStateWithActiveHand(
      ["compass", "shop", "aid"],
      39,
      "camp-blank",
    );
    const nextState = applyMove(fullHandState, { type: "ROLL_DIE" });

    expect(nextState.lastLandingEffect).toMatchObject({
      eventCardId: "draw-treasure",
      treasureHandFull: true,
    });
    expect(nextState.players[0]?.treasureHand).toEqual(["compass", "shop", "aid"]);
  });

  it("Roll Again consumes seeded RNG and moves forward", () => {
    const nextState = applyMove(createBoardStateAt("field-action", 8), {
      type: "ROLL_DIE",
    });

    expect(nextState.lastLandingEffect).toMatchObject({
      eventCardId: "roll-again",
      effectRoll: 2,
    });
    expect(nextState.seed).not.toBe(8);
    expect(nextState.players[0]?.positionId).toBe("field-blank");
  });

  it("Roll and Move Back consumes seeded RNG and moves backward", () => {
    const nextState = applyMove(
      createForkChoiceState(4),
      { type: "CHOOSE_BRANCH", spaceId: "cave-mouth" },
    );

    expect(nextState.lastLandingEffect).toMatchObject({
      trapCardId: "roll-and-move-back",
      effectRoll: 2,
    });
    expect(nextState.seed).not.toBe(4);
    expect(nextState.players[0]?.positionId).toBe("camp-event");
  });

  it("Move Back 2 moves backward along path history when possible", () => {
    const nextState = applyMove(
      createForkChoiceState(1),
      { type: "CHOOSE_BRANCH", spaceId: "cave-mouth" },
    );

    expect(nextState.lastLandingEffect?.trapCardId).toBe("move-back-2");
    expect(nextState.players[0]?.positionId).toBe("camp-event");
    expect(nextState.players[0]?.pathHistory).toEqual([
      "start",
      "camp-coin",
      "camp-blank",
      "camp-event",
    ]);
  });

  it("Move Forward 2 card movement can pause at a branch and continue after a legal choice", () => {
    const branchState = applyMove(createBoardStateAt("camp-blank", 19), {
      type: "ROLL_DIE",
    });

    expect(branchState.lastLandingEffect).toMatchObject({
      eventCardId: "move-forward-2",
    });
    expect(branchState.phase).toBe("choosingBranch");
    expect(branchState.pendingMovement).toBe(1);
    expect(branchState.currentPlayerIndex).toBe(0);
    expect(branchState.availableBranchSpaceIds).toEqual(["field-entry", "cave-mouth"]);

    const nextState = applyMove(branchState, {
      type: "CHOOSE_BRANCH",
      spaceId: "field-entry",
    });

    expect(nextState.phase).toBe("waitingToRoll");
    expect(nextState.players[0]?.positionId).toBe("field-entry");
    expect(nextState.currentPlayerIndex).toBe(1);
  });

  it("landing on Treasure adds one card to only the active player's hand", () => {
    const nextState = applyMove(createBoardStateAt("cave-trap", 7), {
      type: "ROLL_DIE",
    });

    expect(nextState.players[0]?.treasureHand).toHaveLength(1);
    expect(nextState.players[1]?.treasureHand).toEqual([]);
    expect(nextState.lastLandingEffect).toMatchObject({
      spaceType: "treasure",
      coinDelta: 0,
      treasureHandFull: false,
    });
    expect(nextState.lastLandingEffect?.message).toContain("Treasure space: drew");
  });

  it("Treasure draws are deterministic from the same seed and same move sequence", () => {
    const drawOnce = (): GameState =>
      applyMove(createBoardStateAt("cave-trap", 7), { type: "ROLL_DIE" });
    const firstResult = drawOnce();
    const secondResult = drawOnce();

    expect(firstResult.players[0]?.treasureHand).toEqual(
      secondResult.players[0]?.treasureHand,
    );
    expect(firstResult.seed).toBe(secondResult.seed);
    expect(firstResult.lastLandingEffect?.message).toBe(
      secondResult.lastLandingEffect?.message,
    );
  });

  it("Treasure hands cannot exceed 3 cards", () => {
    const fullHandState = createBoardStateAt("cave-trap", 7);
    const nextState = applyMove(
      {
        ...fullHandState,
        players: fullHandState.players.map((player, index) =>
          index === fullHandState.currentPlayerIndex
            ? {
                ...player,
                treasureHand: ["compass", "shop", "aid"],
              }
            : player,
        ),
      },
      { type: "ROLL_DIE" },
    );

    expect(nextState.players[0]?.treasureHand).toEqual(["compass", "shop", "aid"]);
    expect(nextState.lastLandingEffect).toMatchObject({
      spaceType: "treasure",
      treasureHandFull: true,
    });
  });

  it("landing on Treasure with a full hand produces a clear temporary full-hand result", () => {
    const fullHandState = createBoardStateAt("cave-trap", 7);
    const nextState = applyMove(
      {
        ...fullHandState,
        players: fullHandState.players.map((player, index) =>
          index === fullHandState.currentPlayerIndex
            ? {
                ...player,
                treasureHand: ["compass", "shop", "aid"],
              }
            : player,
        ),
      },
      { type: "ROLL_DIE" },
    );

    expect(nextState.lastLandingEffect?.message).toContain("hand is full");
  });

  it("landing resolution happens before turn advancement", () => {
    const nextState = applyMove(createBoardStateAt(START_SPACE_ID, 7), {
      type: "ROLL_DIE",
    });

    expect(nextState.currentPlayerIndex).toBe(1);
    expect(nextState.lastLandingEffect?.playerIndex).toBe(0);
    expect(nextState.lastTurnSummary).toContain("gained 10 coins");
  });

  it("branch choice followed by landing resolves the final landed space", () => {
    const branchState = applyMove(createBoardStateAt(START_SPACE_ID, 2), {
      type: "ROLL_DIE",
    });
    const nextState = applyMove(branchState, {
      type: "CHOOSE_BRANCH",
      spaceId: "cave-mouth",
    });

    expect(nextState.players[0]?.positionId).toBe("cave-mouth");
    expect(nextState.lastLandingEffect).toMatchObject({
      spaceId: "cave-mouth",
      spaceType: "trap",
      trapCardId: "lose-20-coins",
    });
  });

  it("same seed plus same choices produces deterministic positions, coins, and turn order", () => {
    const playRound = (): GameState => {
      const playerOneCoin = applyMove(createBoardStateAt(START_SPACE_ID, 7), {
        type: "ROLL_DIE",
      });
      const playerTwoBranch = applyMove({ ...playerOneCoin, seed: 2 }, { type: "ROLL_DIE" });

      return applyMove(playerTwoBranch, {
        type: "CHOOSE_BRANCH",
        spaceId: "field-entry",
      });
    };
    const firstResult = playRound();
    const secondResult = playRound();

    expect(firstResult.currentPlayerIndex).toBe(secondResult.currentPlayerIndex);
    expect(firstResult.players.map((player) => player.positionId)).toEqual(
      secondResult.players.map((player) => player.positionId),
    );
    expect(firstResult.players.map((player) => player.coins)).toEqual(
      secondResult.players.map((player) => player.coins),
    );
    expect(firstResult.players.map((player) => player.treasureHand)).toEqual(
      secondResult.players.map((player) => player.treasureHand),
    );
  });

  it("same seed plus same Compass use and choices produces deterministic movement, cards, coins, and turn order", () => {
    const playCompassRound = (): GameState => {
      const branchState = applyMove(createBoardStateWithActiveHand(["compass"], 2), {
        type: "USE_TREASURE_CARD",
        cardId: "compass",
      });
      const playerTwoTurn = applyMove(branchState, {
        type: "CHOOSE_BRANCH",
        spaceId: "cave-mouth",
      });

      return applyMove(
        {
          ...playerTwoTurn,
          players: playerTwoTurn.players.map((player, index) =>
            index === playerTwoTurn.currentPlayerIndex
              ? {
                  ...player,
                  treasureHand: ["compass"],
                }
              : player,
          ),
        },
        {
          type: "USE_TREASURE_CARD",
          cardId: "compass",
        },
      );
    };
    const firstResult = playCompassRound();
    const secondResult = playCompassRound();

    expect(firstResult.currentPlayerIndex).toBe(secondResult.currentPlayerIndex);
    expect(firstResult.seed).toBe(secondResult.seed);
    expect(firstResult.players.map((player) => player.positionId)).toEqual(
      secondResult.players.map((player) => player.positionId),
    );
    expect(firstResult.players.map((player) => player.coins)).toEqual(
      secondResult.players.map((player) => player.coins),
    );
    expect(firstResult.players.map((player) => player.treasureHand)).toEqual(
      secondResult.players.map((player) => player.treasureHand),
    );
  });

  it("same seed plus same player choices produces deterministic positions, coins, hands, cards, mini-quest results, and turn order", () => {
    const playMiniQuestRound = (): GameState => {
      const playerOneHiddenCave = applyMove(
        createBoardStateWithPath(
          ["start", "camp-coin", "camp-blank", "camp-event"],
          23,
        ),
        { type: "ROLL_DIE" },
      );

      return applyMove(
        {
          ...playerOneHiddenCave,
          players: playerOneHiddenCave.players.map((player, index) =>
            index === playerOneHiddenCave.currentPlayerIndex
              ? {
                  ...player,
                  positionId: "field-entry",
                  pathHistory: ["start", "field-entry"],
                }
              : player,
          ),
          seed: 45,
        },
        { type: "ROLL_DIE" },
      );
    };
    const firstResult = playMiniQuestRound();
    const secondResult = playMiniQuestRound();

    expect(firstResult.currentPlayerIndex).toBe(secondResult.currentPlayerIndex);
    expect(firstResult.seed).toBe(secondResult.seed);
    expect(firstResult.lastLandingEffect?.miniQuestId).toBe("gold-mine");
    expect(firstResult.lastLandingEffect?.miniQuestRoll).toBe(6);
    expect(firstResult.lastLandingEffect?.trapCardId).toBe(
      secondResult.lastLandingEffect?.trapCardId,
    );
    expect(firstResult.lastLandingEffect?.miniQuestId).toBe(
      secondResult.lastLandingEffect?.miniQuestId,
    );
    expect(firstResult.lastLandingEffect?.miniQuestRoll).toBe(
      secondResult.lastLandingEffect?.miniQuestRoll,
    );
    expect(firstResult.players.map((player) => player.positionId)).toEqual(
      secondResult.players.map((player) => player.positionId),
    );
    expect(firstResult.players.map((player) => player.coins)).toEqual(
      secondResult.players.map((player) => player.coins),
    );
    expect(firstResult.players.map((player) => player.treasureHand)).toEqual(
      secondResult.players.map((player) => player.treasureHand),
    );
  });

  it("same seed plus same player choices produces deterministic shop results and turn order", () => {
    const playShopRound = (): GameState => {
      const shopState = createShopState(SHOP_PURCHASE_PRICE * 2, ["compass"], 7);
      const boughtState = applyMove(shopState, { type: "BUY_SHOP_TREASURE" });
      const soldState = applyMove(boughtState, {
        type: "SELL_SHOP_TREASURE",
        cardIndex: 0,
      });

      return applyMove(soldState, { type: "LEAVE_SHOP" });
    };
    const firstResult = playShopRound();
    const secondResult = playShopRound();

    expect(firstResult.currentPlayerIndex).toBe(secondResult.currentPlayerIndex);
    expect(firstResult.seed).toBe(secondResult.seed);
    expect(firstResult.players.map((player) => player.positionId)).toEqual(
      secondResult.players.map((player) => player.positionId),
    );
    expect(firstResult.players.map((player) => player.coins)).toEqual(
      secondResult.players.map((player) => player.coins),
    );
    expect(firstResult.players.map((player) => player.treasureHand)).toEqual(
      secondResult.players.map((player) => player.treasureHand),
    );
    expect(firstResult.lastTurnSummary).toBe(secondResult.lastTurnSummary);
  });

  it("landing on Golden Key claims it", () => {
    const nextState = applyMove(createBoardStateAt("river-4", 7), {
      type: "ROLL_DIE",
    });

    expect(nextState.players[0]?.positionId).toBe("river-5");
    expect(nextState.goldenKeyHolderPlayerIndex).toBe(0);
    expect(nextState.lastLandingEffect).toMatchObject({
      spaceId: "river-5",
      spaceType: "golden-key",
      goldenKeyClaimed: true,
      previousGoldenKeyHolderPlayerIndex: null,
    });
    expect(nextState.lastLandingEffect?.message).toContain("claimed the Golden Key");
  });

  it("landing on Golden Key steals it from another player", () => {
    const baseState = createBoardStateAt("river-4", 7);
    const stealState: GameState = {
      ...baseState,
      currentPlayerIndex: 1,
      movingPlayerIndex: 1,
      goldenKeyHolderPlayerIndex: 0,
      players: baseState.players.map((player, index) =>
        index === 1
          ? {
              ...player,
              positionId: "river-4",
              pathHistory: [START_SPACE_ID, "river-4"],
            }
          : player,
      ),
    };
    const nextState = applyMove(stealState, { type: "ROLL_DIE" });

    expect(nextState.players[1]?.positionId).toBe("river-5");
    expect(nextState.goldenKeyHolderPlayerIndex).toBe(1);
    expect(nextState.lastLandingEffect).toMatchObject({
      goldenKeyClaimed: true,
      previousGoldenKeyHolderPlayerIndex: 0,
    });
    expect(nextState.lastLandingEffect?.message).toContain(
      "stole the Golden Key from Player 1",
    );
  });

  it("only one player can hold the Golden Key at a time", () => {
    const nextState = applyMove(createBoardStateAt("river-4", 7), {
      type: "ROLL_DIE",
    });

    expect(nextState.goldenKeyHolderPlayerIndex).toBe(0);
    expect(
      nextState.players.filter(
        (_, index) => index === nextState.goldenKeyHolderPlayerIndex,
      ),
    ).toHaveLength(1);
  });

  it("same seed plus same choices produces deterministic final state and winner", () => {
    const playFinish = (): GameState => createFinishState(10, 40);
    const firstResult = playFinish();
    const secondResult = playFinish();

    expect(firstResult.phase).toBe("gameOver");
    expect(firstResult.seed).toBe(secondResult.seed);
    expect(firstResult.players.map((player) => player.positionId)).toEqual(
      secondResult.players.map((player) => player.positionId),
    );
    expect(firstResult.gameOverResult).toEqual(secondResult.gameOverResult);
  });
});
