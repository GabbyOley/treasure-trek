export function renderTitleScreen(container: HTMLDivElement): void {
  container.innerHTML = `
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
}
