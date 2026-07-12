export type TitleScreenViewModel = {
  lastRoll: number | null;
};

export function renderTitleScreen(
  container: HTMLDivElement,
  viewModel: TitleScreenViewModel,
): void {
  const hasRoll = viewModel.lastRoll !== null;
  const rollResult = hasRoll
    ? String(viewModel.lastRoll)
    : "Tap Roll to reveal your first die.";
  const resultLabel = hasRoll ? "Latest roll" : "Ready to roll";
  const resultClassName = hasRoll ? "roll-value is-rolled" : "roll-value is-idle";

  container.innerHTML = `
    <main class="title-screen">
      <section class="title-card" aria-label="Treasure Trek title screen">
        <p class="eyebrow">Set sail for hidden riches</p>
        <h1>TREASURE TREK</h1>
        <p class="subtitle">
          Chart your course, outsmart your rivals, and race to uncover the island's buried fortune.
        </p>
        <div class="action-group">
          <button
            type="button"
            class="menu-button primary"
            data-action="play-computer"
            aria-label="Play against the computer"
          >
            Play vs Computer
          </button>
          <button
            type="button"
            class="menu-button secondary"
            data-action="play-friend"
            aria-label="Play with a friend"
          >
            Play with a Friend
          </button>
          <button
            type="button"
            class="menu-button tertiary"
            data-action="roll"
            aria-label="Roll one six-sided die"
          >
            Roll
          </button>
        </div>
        <section class="roll-panel" aria-live="polite" aria-label="Dice roll result">
          <p class="roll-label">${resultLabel}</p>
          <output class="${resultClassName}">${rollResult}</output>
        </section>
      </section>
    </main>
  `;
}
