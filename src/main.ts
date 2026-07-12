import "./style.css";
import { rollSeededDie } from "./game/rng";
import { renderTitleScreen } from "./rendering/titleScreen";
import {
  CSS_PALETTE,
  INITIAL_RNG_SEED,
  TITLE_SCREEN_DIE_SIDES,
} from "./utils/constants";

const root = document.documentElement;
const app = document.querySelector<HTMLDivElement>("#app")!;

let rngSeed = INITIAL_RNG_SEED;
let lastRoll: number | null = null;

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

function updateTitleScreen(): void {
  renderTitleScreen(app, { lastRoll });

  app
    .querySelector<HTMLButtonElement>('[data-action="roll"]')
    ?.addEventListener("click", () => {
      const nextRoll = rollSeededDie(rngSeed, TITLE_SCREEN_DIE_SIDES);
      rngSeed = nextRoll.nextSeed;
      lastRoll = nextRoll.value;
      updateTitleScreen();
    });
}

updateTitleScreen();
