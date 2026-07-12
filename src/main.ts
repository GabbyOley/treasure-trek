import "./style.css";
import { CSS_PALETTE } from "./utils/constants";

const root = document.documentElement;

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

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <main class="title-screen">
    <section class="title-card" aria-label="Treasure Trek title screen">
      <p class="eyebrow">Set sail for hidden riches</p>
      <h1>TREASURE TREK</h1>
      <p class="subtitle">
        Chart your course, outsmart your rivals, and race to uncover the island's buried fortune.
      </p>
      <div class="action-group">
        <button type="button" class="menu-button primary">Play vs Computer</button>
        <button type="button" class="menu-button secondary">Play with a Friend</button>
      </div>
    </section>
  </main>
`;
