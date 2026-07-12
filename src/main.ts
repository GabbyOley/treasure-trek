import "./style.css";
import { applyMove, createInitialGameState } from "./game/state";
import { renderTitleScreen } from "./rendering/titleScreen";
import { CSS_PALETTE } from "./utils/constants";

const root = document.documentElement;
const app = document.querySelector<HTMLDivElement>("#app")!;
let gameState = createInitialGameState();

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
  renderTitleScreen(app, { lastRoll: gameState.lastRoll });

  const rollButton =
    app.querySelector<HTMLButtonElement>('[data-action="roll"]') ?? null;

  if (restoreRollFocus) {
    rollButton?.focus();
  }

  rollButton?.addEventListener("click", () => {
    gameState = applyMove(gameState, { type: "ROLL_DIE" });
    updateTitleScreen(true);
  });
}

updateTitleScreen();
