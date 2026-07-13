import "./style.css";
import { applyMove, createInitialGameState } from "./game/state";
import { renderBoardScreen, type BoardScreenView } from "./rendering/boardScreen";
import { renderTitleScreen } from "./rendering/titleScreen";
import { CSS_PALETTE } from "./utils/constants";

const root = document.documentElement;
const app = document.querySelector<HTMLDivElement>("#app")!;
let gameState = createInitialGameState();
let boardScreen: BoardScreenView | null = null;

const cssVars: Record<string, string> = {
  "--color-midnight": CSS_PALETTE.midnight,
  "--color-deep-sea": CSS_PALETTE.deepSea,
  "--color-tide": CSS_PALETTE.tide,
  "--color-jungle": CSS_PALETTE.jungle,
  "--color-gold": CSS_PALETTE.gold,
  "--color-amber": CSS_PALETTE.amber,
  "--color-coral": CSS_PALETTE.coral,
  "--color-parchment": CSS_PALETTE.parchment,
  "--color-mist": CSS_PALETTE.mist,
  "--color-ink": CSS_PALETTE.ink,
};

Object.entries(cssVars).forEach(([name, value]) => {
  root.style.setProperty(name, value);
});

function updateTitleScreen(restoreRollFocus = false): void {
  boardScreen?.destroy();
  boardScreen = null;
  renderTitleScreen(app, { lastRoll: gameState.lastRoll });

  const rollButton =
    app.querySelector<HTMLButtonElement>('[data-action="roll"]') ?? null;
  const playButtons = app.querySelectorAll<HTMLButtonElement>(
    '[data-action="play-computer"], [data-action="play-friend"]',
  );

  if (restoreRollFocus) {
    rollButton?.focus();
  }

  rollButton?.addEventListener("click", () => {
    gameState = applyMove(gameState, { type: "ROLL_DIE" });
    updateTitleScreen(true);
  });

  playButtons.forEach((button) => {
    button.addEventListener("click", showBoardScreen);
  });
}

function showBoardScreen(): void {
  boardScreen?.destroy();
  gameState = applyMove(gameState, { type: "ENTER_BOARD" });
  boardScreen = renderBoardScreen(app, gameState, {
    onBack: () => {
      gameState = applyMove(gameState, { type: "EXIT_TO_TITLE" });
      updateTitleScreen();
    },
    onRoll: () => {
      gameState = applyMove(gameState, { type: "ROLL_DIE" });
      boardScreen?.update(gameState);
    },
    onChooseBranch: (spaceId) => {
      gameState = applyMove(gameState, { type: "CHOOSE_BRANCH", spaceId });
      boardScreen?.update(gameState);
    },
    onUseTreasureCard: (cardId) => {
      gameState = applyMove(gameState, { type: "USE_TREASURE_CARD", cardId });
      boardScreen?.update(gameState);
    },
    onBuyShopTreasure: () => {
      gameState = applyMove(gameState, { type: "BUY_SHOP_TREASURE" });
      boardScreen?.update(gameState);
    },
    onSellShopTreasure: (cardIndex) => {
      gameState = applyMove(gameState, { type: "SELL_SHOP_TREASURE", cardIndex });
      boardScreen?.update(gameState);
    },
    onLeaveShop: () => {
      gameState = applyMove(gameState, { type: "LEAVE_SHOP" });
      boardScreen?.update(gameState);
    },
    onRestartBoard: () => {
      gameState = applyMove(gameState, { type: "ENTER_BOARD" });
      boardScreen?.update(gameState);
    },
  });
}

updateTitleScreen();
