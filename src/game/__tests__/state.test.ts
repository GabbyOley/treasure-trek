import { describe, expect, it } from "vitest";

import {
  COIN_SPACE_REWARD,
  DEFAULT_PLAYER_COUNT,
  FIRST_PLAYER_INDEX,
  INITIAL_PLAYER_COINS,
  INITIAL_RNG_SEED,
  TITLE_SCREEN_DIE_SIDES,
} from "../../utils/constants";
import { START_SPACE_ID } from "../board";
import { applyMove, createInitialGameState, type GameState } from "../state";
import { TREASURE_CARDS } from "../treasureCards";

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
          }
        : player,
    ),
  };
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
          coins: INITIAL_PLAYER_COINS,
          treasureHand: [],
        },
        {
          id: "player-2",
          name: "Player 2",
          positionId: START_SPACE_ID,
          coins: INITIAL_PLAYER_COINS,
          treasureHand: [],
        },
      ],
      pendingMovement: 0,
      availableBranchSpaceIds: [],
      movementPath: [],
      movingPlayerIndex: FIRST_PLAYER_INDEX,
      lastTurnSummary: null,
      lastLandingEffect: null,
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

  it("Treasure card catalog includes the 7 confirmed cards and resale values", () => {
    expect(TREASURE_CARDS).toEqual([
      { id: "compass", name: "Compass", resaleValue: 10 },
      { id: "shop", name: "Shop", resaleValue: 10 },
      { id: "aid", name: "Aid", resaleValue: 20 },
      { id: "time-machine", name: "Time Machine", resaleValue: 20 },
      { id: "shovel", name: "Shovel", resaleValue: 20 },
      { id: "crab", name: "Crab", resaleValue: 30 },
      { id: "whistle", name: "Whistle", resaleValue: 50 },
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

  it.each([
    ["trap", "camp-fork", "Trap space: trap effect coming soon."],
    ["event", "camp-blank", "Event space: event effect coming soon."],
    ["action", "camp-event", "Action space: landmark interaction coming soon."],
  ])(
    "landing on %s produces a placeholder landing result without changing coins",
    (_spaceType, startSpaceId, expectedMessage) => {
      const initialState = createBoardStateAt(startSpaceId, 7);
      const nextState =
        startSpaceId === "camp-fork"
          ? applyMove(
              {
                ...initialState,
                phase: "choosingBranch",
                pendingMovement: 1,
                availableBranchSpaceIds: ["field-entry", "cave-mouth"],
              },
              { type: "CHOOSE_BRANCH", spaceId: "cave-mouth" },
            )
          : applyMove(initialState, { type: "ROLL_DIE" });

      expect(nextState.players[0]?.coins).toBe(INITIAL_PLAYER_COINS);
      expect(nextState.lastLandingEffect?.message).toBe(expectedMessage);
      expect(nextState.lastLandingEffect?.coinDelta).toBe(0);
    },
  );

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
      message: "Trap space: trap effect coming soon.",
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
});
