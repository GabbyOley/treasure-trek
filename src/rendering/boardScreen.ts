import * as THREE from "three";

import {
  BOARD_SPACES,
  getBoardSpace,
  START_SPACE_ID,
  type BoardRegion,
  type BoardRisk,
  type BoardSpace,
  type BoardSpaceType,
} from "../game/board";
import {
  canBuyShopTreasure,
  canSellShopTreasure,
  canUseTreasureCard,
  getActiveShop,
  type GameState,
  type Move,
} from "../game/state";
import { getTreasureCardName } from "../game/treasureCards";
import {
  BOARD_PLACEHOLDER,
  HTML_BOARD_CONNECTION_BENDS,
  HTML_BOARD_LAYOUT,
  HTML_BOARD_ROUTE_GUIDES,
  PALETTE,
} from "../utils/constants";

type SpaceStyle = {
  color: number;
  marker: "none" | "coin" | "treasure" | "trap" | "event" | "action" | "finish";
};

type PlayerPieceView = {
  group: THREE.Group;
  activeRing: THREE.Mesh;
};

type BoardDebugInfo = {
  htmlBoardCssSize: string;
  htmlBoardSpaceCount: number;
  htmlBoardPlayerCount: number;
  htmlBoardIntersectsViewport: boolean;
  canvasCssSize: string;
  canvasBufferSize: string;
  cameraPosition: string;
  cameraTarget: string;
  routeTileCount: number;
  playerPieceCount: number;
  boardBounds: string;
  projectedRouteBounds: string;
  routeAnchorsOnScreen: number;
  canvasIntersectsViewport: boolean;
};

const SPACE_STYLES: Record<BoardSpaceType, SpaceStyle> = {
  blank: {
    color: PALETTE.parchment,
    marker: "none",
  },
  coin: {
    color: PALETTE.gold,
    marker: "coin",
  },
  treasure: {
    color: PALETTE.amber,
    marker: "treasure",
  },
  trap: {
    color: PALETTE.coral,
    marker: "trap",
  },
  event: {
    color: PALETTE.tide,
    marker: "event",
  },
  action: {
    color: PALETTE.mist,
    marker: "action",
  },
  finish: {
    color: PALETTE.gold,
    marker: "finish",
  },
};

const RISK_LABELS: Record<BoardRisk, string> = {
  safe: "safe",
  quest: "rolling quest",
  danger: "dangerous branch",
};

export type BoardScreenView = {
  update: (state: GameState) => void;
  destroy: () => void;
  getDebugInfo: () => BoardDebugInfo;
};

export type BoardScreenHandlers = {
  onBack: () => void;
  onRoll: () => void;
  onChooseBranch: (spaceId: string) => void;
  onUseTreasureCard: (cardId: Extract<Move, { type: "USE_TREASURE_CARD" }>["cardId"]) => void;
  onBuyShopTreasure: () => void;
  onSellShopTreasure: (cardIndex: number) => void;
  onLeaveShop: () => void;
  onRestartBoard: () => void;
};

export function renderBoardScreen(
  container: HTMLDivElement,
  state: GameState,
  handlers: BoardScreenHandlers,
): BoardScreenView {
  container.innerHTML = `
    <main class="board-screen" data-testid="board-screen">
      <div class="board-toolbar">
        <button type="button" class="back-button" data-action="back-title" aria-label="Return to title screen">
          Back
        </button>
        <button
          type="button"
          class="board-debug-toggle"
          data-action="toggle-board-debug"
          aria-expanded="false"
          aria-label="Toggle board visibility debug details"
        >
          Board Debug
        </button>
        <p class="board-kicker">Treasure Trek</p>
      </div>
      <div class="board-stage">
        <section
          class="board-map-panel"
          data-board-map
          data-testid="html-board"
          aria-label="Playable Treasure Trek board route"
        ></section>
        <section class="board-status-panel" aria-live="polite">
          <p class="board-status-label">Board Turn</p>
          <p class="board-status-text" data-board-status data-testid="board-status"></p>
          <p class="board-roll-text" data-board-roll data-testid="board-roll-text"></p>
          <button
            type="button"
            class="board-roll-button"
            data-action="board-roll"
            data-testid="board-roll"
            aria-label="Roll the board die"
          >
            Roll
          </button>
          <div class="player-coin-list" data-player-coins aria-label="Player coin totals"></div>
          <div class="player-hand-list" data-player-hands aria-label="Player Treasure hands"></div>
          <div class="board-choice-list" data-board-choices></div>
          <div class="shop-action-list" data-shop-actions></div>
          <div class="game-over-panel-wrap" data-game-over></div>
        </section>
        <aside class="board-region-panel" aria-label="Board regions">
          ${renderRegionSummaries()}
        </aside>
        <section
          class="board-debug-panel"
          data-board-debug
          data-testid="board-debug"
          aria-label="Board Visibility Debug"
          hidden
        ></section>
      </div>
    </main>
  `;

  const boardMap = container.querySelector<HTMLElement>("[data-board-map]");

  if (boardMap === null) {
    throw new Error("HTML board container was not created.");
  }

  let currentState = state;
  const status = container.querySelector<HTMLParagraphElement>("[data-board-status]");
  const roll = container.querySelector<HTMLParagraphElement>("[data-board-roll]");
  const playerCoins = container.querySelector<HTMLDivElement>("[data-player-coins]");
  const playerHands = container.querySelector<HTMLDivElement>("[data-player-hands]");
  const choices = container.querySelector<HTMLDivElement>("[data-board-choices]");
  const shopActions = container.querySelector<HTMLDivElement>("[data-shop-actions]");
  const gameOver = container.querySelector<HTMLDivElement>("[data-game-over]");
  const rollButton = container.querySelector<HTMLButtonElement>('[data-action="board-roll"]');
  const debugToggle = container.querySelector<HTMLButtonElement>(
    '[data-action="toggle-board-debug"]',
  );
  const debugPanel = container.querySelector<HTMLElement>("[data-board-debug]");

  if (
    status === null ||
    roll === null ||
    playerCoins === null ||
    playerHands === null ||
    choices === null ||
    shopActions === null ||
    gameOver === null ||
    rollButton === null ||
    debugToggle === null ||
    debugPanel === null
  ) {
    throw new Error("Board controls were not created.");
  }

  let isDebugVisible = new URLSearchParams(window.location.search).has("debugBoard");

  const updateDebugPanel = (): void => {
    debugToggle.setAttribute("aria-expanded", String(isDebugVisible));
    debugPanel.hidden = !isDebugVisible;

    if (isDebugVisible) {
      debugPanel.innerHTML = renderBoardDebug(getHtmlBoardDebugInfo(boardMap, currentState));
    }
  };

  const updateHud = (nextState: GameState): void => {
    currentState = nextState;
    boardMap.innerHTML = renderHtmlBoard(nextState);
    status.textContent = getBoardStatusText(nextState);
    roll.textContent =
      nextState.lastRoll === null
        ? "No board roll yet."
        : `${getMovingPlayerName(nextState)} rolled ${nextState.lastRoll}.`;
    playerCoins.innerHTML = renderPlayerCoins(nextState);
    playerHands.innerHTML = renderPlayerHands(nextState);
    rollButton.disabled =
      nextState.phase === "moving" ||
      nextState.phase === "choosingBranch" ||
      nextState.phase === "shopping" ||
      nextState.phase === "gameOver";
    choices.innerHTML = renderBranchChoices(nextState);
    shopActions.innerHTML = renderShopActions(nextState);
    gameOver.innerHTML = renderGameOver(nextState);

    choices
      .querySelectorAll<HTMLButtonElement>("[data-branch-choice]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          handlers.onChooseBranch(button.dataset.branchChoice ?? "");
        });
      });
    playerHands
      .querySelectorAll<HTMLButtonElement>("[data-treasure-card]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          handlers.onUseTreasureCard(
            button.dataset.treasureCard as Extract<
              Move,
              { type: "USE_TREASURE_CARD" }
            >["cardId"],
          );
        });
      });
    shopActions
      .querySelectorAll<HTMLButtonElement>("[data-shop-buy]")
      .forEach((button) => {
        button.addEventListener("click", handlers.onBuyShopTreasure);
      });
    shopActions
      .querySelectorAll<HTMLButtonElement>("[data-shop-sell]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          handlers.onSellShopTreasure(Number(button.dataset.shopSell ?? "-1"));
        });
      });
    shopActions
      .querySelectorAll<HTMLButtonElement>("[data-shop-leave]")
      .forEach((button) => {
        button.addEventListener("click", handlers.onLeaveShop);
      });
    gameOver
      .querySelectorAll<HTMLButtonElement>("[data-restart-board]")
      .forEach((button) => {
        button.addEventListener("click", handlers.onRestartBoard);
      });
    updateDebugPanel();
  };

  container
    .querySelector<HTMLButtonElement>('[data-action="back-title"]')
    ?.addEventListener("click", handlers.onBack);
  rollButton.addEventListener("click", handlers.onRoll);
  debugToggle.addEventListener("click", () => {
    isDebugVisible = !isDebugVisible;
    updateDebugPanel();
  });
  updateHud(state);

  return {
    update: (nextState: GameState) => {
      updateHud(nextState);
    },
    destroy: () => {},
    getDebugInfo: () => getHtmlBoardDebugInfo(boardMap, currentState),
  };
}

function createBoardScene(container: HTMLDivElement, state: GameState): BoardScreenView {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.deepSea);
  scene.fog = new THREE.Fog(
    PALETTE.deepSea,
    BOARD_PLACEHOLDER.fog.near,
    BOARD_PLACEHOLDER.fog.far,
  );

  const camera = new THREE.PerspectiveCamera(
    BOARD_PLACEHOLDER.camera.fov,
    1,
    BOARD_PLACEHOLDER.camera.near,
    BOARD_PLACEHOLDER.camera.far,
  );
  camera.position.set(
    BOARD_PLACEHOLDER.camera.position.x,
    BOARD_PLACEHOLDER.camera.position.y,
    BOARD_PLACEHOLDER.camera.position.z,
  );
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, BOARD_PLACEHOLDER.renderer.maxPixelRatio),
  );
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute("aria-label", "3D Treasure Trek board placeholder");
  renderer.domElement.setAttribute("role", "img");
  container.append(renderer.domElement);

  const board = createBoardGroup();
  const playerPieces = state.players.map((_, index) => createPlayerPiece(index));
  const choiceHighlights = new THREE.Group();
  playerPieces.forEach((piece) => {
    board.add(piece.group);
  });
  board.add(choiceHighlights);
  scene.add(board);
  addLights(scene);
  let movementTimer = 0;

  const placePlayer = (playerIndex: number, spaceId: string): void => {
    const playerSpace = getBoardSpace(spaceId);
    const piece = playerPieces[playerIndex];
    const offset =
      BOARD_PLACEHOLDER.player.offsets[playerIndex] ??
      BOARD_PLACEHOLDER.player.fallbackOffset;

    if (playerSpace !== undefined && piece !== undefined) {
      piece.group.position.set(
        playerSpace.position.x,
        BOARD_PLACEHOLDER.player.y,
        playerSpace.position.z,
      );
      piece.group.position.x += offset.x;
      piece.group.position.z += offset.z;
    }
  };

  const placeAllPlayers = (nextState: GameState): void => {
    nextState.players.forEach((player, index) => {
      placePlayer(index, player.positionId);
    });
  };

  const updateActivePlayerStyles = (nextState: GameState): void => {
    playerPieces.forEach((piece, index) => {
      const isActive = index === nextState.currentPlayerIndex;
      const scale = isActive
        ? BOARD_PLACEHOLDER.player.activeScale
        : BOARD_PLACEHOLDER.player.inactiveScale;

      piece.group.scale.setScalar(scale);
      piece.activeRing.visible = isActive;
    });
  };

  const updateChoiceHighlights = (nextState: GameState): void => {
    choiceHighlights.clear();

    nextState.availableBranchSpaceIds.forEach((spaceId) => {
      const choiceSpace = getBoardSpace(spaceId);

      if (choiceSpace !== undefined) {
        choiceHighlights.add(createChoiceHighlight(choiceSpace));
      }
    });
  };

  const animateMovementPath = (
    nextState: GameState,
    path: readonly string[],
    pathIndex: number,
  ): void => {
    const spaceId = path[pathIndex];

    if (spaceId === undefined) {
      placeAllPlayers(nextState);
      updateActivePlayerStyles(nextState);
      updateChoiceHighlights(nextState);
      return;
    }

    placePlayer(nextState.movingPlayerIndex, spaceId);
    movementTimer = window.setTimeout(() => {
      animateMovementPath(nextState, path, pathIndex + 1);
    }, BOARD_PLACEHOLDER.player.stepMs);
  };

  const update = (nextState: GameState): void => {
    window.clearTimeout(movementTimer);
    updateActivePlayerStyles(nextState);
    updateChoiceHighlights({
      ...nextState,
      availableBranchSpaceIds: [],
    });

    if (nextState.movementPath.length > 0) {
      animateMovementPath(nextState, nextState.movementPath, 0);
      return;
    }

    placeAllPlayers(nextState);
    updateChoiceHighlights(nextState);
  };
  update(state);

  const resize = (): void => {
    const { width, height } = container.getBoundingClientRect();
    const safeWidth = Math.max(width, 1);
    const safeHeight = Math.max(height, 1);

    camera.aspect = safeWidth / safeHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(safeWidth, safeHeight, false);
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  const getDebugInfo = (): BoardDebugInfo => {
    const canvasRect = renderer.domElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const boardBounds = getBoardPositionBounds();
    const projectedBounds = getProjectedRouteBounds(board, camera, canvasRect);
    const canvasIntersectsViewport =
      canvasRect.right > 0 &&
      canvasRect.bottom > 0 &&
      canvasRect.left < viewportWidth &&
      canvasRect.top < viewportHeight;

    return {
      htmlBoardCssSize: "not used by legacy Three helper",
      htmlBoardSpaceCount: BOARD_SPACES.length,
      htmlBoardPlayerCount: playerPieces.length,
      htmlBoardIntersectsViewport: false,
      canvasCssSize: `${formatDebugNumber(canvasRect.width)} x ${formatDebugNumber(
        canvasRect.height,
      )}`,
      canvasBufferSize: `${renderer.domElement.width} x ${renderer.domElement.height}`,
      cameraPosition: `${formatDebugNumber(camera.position.x)}, ${formatDebugNumber(
        camera.position.y,
      )}, ${formatDebugNumber(camera.position.z)}`,
      cameraTarget: "0, 0, 0",
      routeTileCount: BOARD_SPACES.length,
      playerPieceCount: playerPieces.length,
      boardBounds,
      projectedRouteBounds: projectedBounds.bounds,
      routeAnchorsOnScreen: projectedBounds.anchorsOnScreen,
      canvasIntersectsViewport,
    };
  };

  let animationFrame = 0;
  const render = (): void => {
    animationFrame = window.requestAnimationFrame(render);
    board.rotation.y =
      Math.sin(performance.now() * BOARD_PLACEHOLDER.animation.swaySpeed) *
      BOARD_PLACEHOLDER.animation.swayAmount;
    renderer.render(scene, camera);
  };
  render();

  return {
    update,
    destroy: () => {
      window.clearTimeout(movementTimer);
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      renderer.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          disposeMaterial(object.material);
        }
      });
      renderer.domElement.remove();
    },
    getDebugInfo,
  };
}

// Kept as dormant debug/3D scaffolding; the visible playable board is plain HTML.
void createBoardScene;

function createPlayerPiece(playerIndex: number): PlayerPieceView {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(
      BOARD_PLACEHOLDER.player.radius,
      BOARD_PLACEHOLDER.player.height,
      BOARD_PLACEHOLDER.player.segments,
      BOARD_PLACEHOLDER.player.segments,
    ),
    new THREE.MeshStandardMaterial({
      color: getPlayerColor(playerIndex),
      roughness: BOARD_PLACEHOLDER.materials.player.roughness,
      metalness: BOARD_PLACEHOLDER.materials.player.metalness,
    }),
  );
  body.castShadow = true;
  group.add(body);

  const activeRing = new THREE.Mesh(
    new THREE.TorusGeometry(
      BOARD_PLACEHOLDER.player.activeRingRadius,
      BOARD_PLACEHOLDER.player.activeRingTubeRadius,
      BOARD_PLACEHOLDER.rim.radialSegments,
      BOARD_PLACEHOLDER.rim.tubularSegments,
    ),
    new THREE.MeshStandardMaterial({
      color: PALETTE.mist,
      emissive: PALETTE.gold,
      roughness: BOARD_PLACEHOLDER.materials.choiceHighlight.roughness,
      metalness: BOARD_PLACEHOLDER.materials.choiceHighlight.metalness,
    }),
  );
  activeRing.position.y = BOARD_PLACEHOLDER.player.activeRingY;
  activeRing.rotation.x = BOARD_PLACEHOLDER.rotations.flatMarkerX;
  group.add(activeRing);

  return {
    group,
    activeRing,
  };
}

function getPlayerColor(playerIndex: number): number {
  return BOARD_PLACEHOLDER.player.colors[playerIndex] ?? PALETTE.gold;
}

function createChoiceHighlight(space: BoardSpace): THREE.Mesh {
  const highlight = new THREE.Mesh(
    new THREE.TorusGeometry(
      BOARD_PLACEHOLDER.choiceHighlight.radius,
      BOARD_PLACEHOLDER.choiceHighlight.tubeRadius,
      BOARD_PLACEHOLDER.choiceHighlight.radialSegments,
      BOARD_PLACEHOLDER.choiceHighlight.tubularSegments,
    ),
    new THREE.MeshStandardMaterial({
      color: PALETTE.mist,
      emissive: PALETTE.gold,
      roughness: BOARD_PLACEHOLDER.materials.choiceHighlight.roughness,
      metalness: BOARD_PLACEHOLDER.materials.choiceHighlight.metalness,
    }),
  );
  highlight.position.set(
    space.position.x,
    BOARD_PLACEHOLDER.spaces.y + BOARD_PLACEHOLDER.choiceHighlight.y,
    space.position.z,
  );
  highlight.rotation.x = BOARD_PLACEHOLDER.rotations.flatMarkerX;

  return highlight;
}

function createBoardGroup(): THREE.Group {
  const group = new THREE.Group();

  const table = new THREE.Mesh(
    new THREE.BoxGeometry(
      BOARD_PLACEHOLDER.table.width,
      BOARD_PLACEHOLDER.table.height,
      BOARD_PLACEHOLDER.table.depth,
    ),
    new THREE.MeshStandardMaterial({
      color: PALETTE.ink,
      roughness: BOARD_PLACEHOLDER.materials.table.roughness,
      metalness: BOARD_PLACEHOLDER.materials.table.metalness,
    }),
  );
  table.position.y = BOARD_PLACEHOLDER.table.y;
  table.receiveShadow = true;
  group.add(table);

  const island = new THREE.Mesh(
    new THREE.CylinderGeometry(
      BOARD_PLACEHOLDER.island.radius,
      BOARD_PLACEHOLDER.island.radius * 1.08,
      BOARD_PLACEHOLDER.island.height,
      48,
    ),
    new THREE.MeshStandardMaterial({
      color: PALETTE.parchment,
      roughness: BOARD_PLACEHOLDER.materials.island.roughness,
      metalness: BOARD_PLACEHOLDER.materials.island.metalness,
    }),
  );
  island.scale.set(BOARD_PLACEHOLDER.island.scaleX, 1, BOARD_PLACEHOLDER.island.scaleZ);
  island.castShadow = true;
  island.receiveShadow = true;
  group.add(island);

  const grass = new THREE.Mesh(
    new THREE.CylinderGeometry(
      BOARD_PLACEHOLDER.island.radius * BOARD_PLACEHOLDER.grass.radiusScaleTop,
      BOARD_PLACEHOLDER.island.radius * BOARD_PLACEHOLDER.grass.radiusScaleBottom,
      BOARD_PLACEHOLDER.grass.height,
      BOARD_PLACEHOLDER.island.segments,
    ),
    new THREE.MeshStandardMaterial({
      color: PALETTE.jungle,
      roughness: BOARD_PLACEHOLDER.materials.grass.roughness,
      metalness: BOARD_PLACEHOLDER.materials.grass.metalness,
    }),
  );
  grass.position.set(
    BOARD_PLACEHOLDER.grass.x,
    BOARD_PLACEHOLDER.grass.y,
    BOARD_PLACEHOLDER.grass.z,
  );
  grass.scale.set(BOARD_PLACEHOLDER.grass.scaleX, 1, BOARD_PLACEHOLDER.grass.scaleZ);
  grass.castShadow = true;
  grass.receiveShadow = true;
  group.add(grass);

  BOARD_SPACES.forEach((space) => {
    space.nextSpaceIds.forEach((nextSpaceId) => {
      const nextSpace = getBoardSpace(nextSpaceId);

      if (nextSpace !== undefined) {
        group.add(createConnection(space, nextSpace));
      }
    });
  });

  BOARD_SPACES.forEach((space, index) => {
    group.add(createSpace(space, index));
  });

  return group;
}

function createConnection(start: BoardSpace, end: BoardSpace): THREE.Mesh {
  const startVector = new THREE.Vector3(
    start.position.x,
    BOARD_PLACEHOLDER.connections.y,
    start.position.z,
  );
  const endVector = new THREE.Vector3(
    end.position.x,
    BOARD_PLACEHOLDER.connections.y,
    end.position.z,
  );
  const midpoint = new THREE.Vector3().addVectors(startVector, endVector).multiplyScalar(0.5);
  const direction = new THREE.Vector3().subVectors(endVector, startVector);
  const length = direction.length();
  const connectionColor =
    start.risk === "danger" || end.risk === "danger"
      ? PALETTE.coral
      : PALETTE.parchment;
  const connection = new THREE.Mesh(
    new THREE.CylinderGeometry(
      BOARD_PLACEHOLDER.connections.radius,
      BOARD_PLACEHOLDER.connections.radius,
      length,
      BOARD_PLACEHOLDER.rim.radialSegments,
    ),
    new THREE.MeshStandardMaterial({
      color: connectionColor,
      roughness: BOARD_PLACEHOLDER.materials.connection.roughness,
      metalness: BOARD_PLACEHOLDER.materials.connection.metalness,
    }),
  );

  connection.position.copy(midpoint);
  connection.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize(),
  );
  connection.receiveShadow = true;

  return connection;
}

function createSpace(space: BoardSpace, index: number): THREE.Group {
  const style = SPACE_STYLES[space.type];
  const group = new THREE.Group();
  group.position.set(space.position.x, BOARD_PLACEHOLDER.spaces.y, space.position.z);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(
      BOARD_PLACEHOLDER.spaces.radius,
      BOARD_PLACEHOLDER.spaces.radius,
      BOARD_PLACEHOLDER.spaces.height,
      BOARD_PLACEHOLDER.spaces.segments,
    ),
    new THREE.MeshStandardMaterial({
      color: style.color,
      roughness: BOARD_PLACEHOLDER.materials.space.roughness,
      metalness: BOARD_PLACEHOLDER.materials.space.metalness,
    }),
  );
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(
      BOARD_PLACEHOLDER.spaces.radius * BOARD_PLACEHOLDER.rim.radiusScale,
      BOARD_PLACEHOLDER.rim.tubeRadius,
      BOARD_PLACEHOLDER.rim.radialSegments,
      BOARD_PLACEHOLDER.rim.tubularSegments,
    ),
    new THREE.MeshStandardMaterial({
      color: PALETTE.ink,
      roughness: BOARD_PLACEHOLDER.materials.rim.roughness,
      metalness: BOARD_PLACEHOLDER.materials.rim.metalness,
    }),
  );
  rim.position.y = BOARD_PLACEHOLDER.rim.y;
  rim.rotation.x = BOARD_PLACEHOLDER.rotations.flatMarkerX;
  group.add(rim);

  addSpaceMarker(group, style.marker, index);

  return group;
}

function addSpaceMarker(group: THREE.Group, marker: SpaceStyle["marker"], index: number): void {
  const markerHeight = BOARD_PLACEHOLDER.markers.y;

  if (marker === "coin") {
    const coin = new THREE.Mesh(
      new THREE.CylinderGeometry(
        BOARD_PLACEHOLDER.markers.coinRadius,
        BOARD_PLACEHOLDER.markers.coinRadius,
        BOARD_PLACEHOLDER.markers.coinHeight,
        BOARD_PLACEHOLDER.spaces.segments,
      ),
      new THREE.MeshStandardMaterial({
        color: PALETTE.amber,
        roughness: BOARD_PLACEHOLDER.materials.coin.roughness,
        metalness: BOARD_PLACEHOLDER.materials.coin.metalness,
      }),
    );
    coin.position.y = markerHeight;
    coin.rotation.x = BOARD_PLACEHOLDER.rotations.flatMarkerX;
    coin.castShadow = true;
    group.add(coin);
    return;
  }

  if (marker === "treasure") {
    const chest = new THREE.Mesh(
      new THREE.BoxGeometry(
        BOARD_PLACEHOLDER.markers.treasureWidth,
        BOARD_PLACEHOLDER.markers.treasureHeight,
        BOARD_PLACEHOLDER.markers.treasureDepth,
      ),
      new THREE.MeshStandardMaterial({
        color: PALETTE.gold,
        roughness: BOARD_PLACEHOLDER.materials.treasure.roughness,
        metalness: BOARD_PLACEHOLDER.materials.treasure.metalness,
      }),
    );
    chest.position.y = markerHeight;
    chest.rotation.y = BOARD_PLACEHOLDER.markers.treasureRotationY;
    chest.castShadow = true;
    group.add(chest);
    return;
  }

  if (marker === "trap") {
    const spike = new THREE.Mesh(
      new THREE.ConeGeometry(
        BOARD_PLACEHOLDER.markers.trapRadius,
        BOARD_PLACEHOLDER.markers.trapHeight,
        BOARD_PLACEHOLDER.markers.trapSegments,
      ),
      new THREE.MeshStandardMaterial({
        color: PALETTE.coral,
        roughness: BOARD_PLACEHOLDER.materials.trap.roughness,
        metalness: BOARD_PLACEHOLDER.materials.trap.metalness,
      }),
    );
    spike.position.y = markerHeight + BOARD_PLACEHOLDER.markers.trapYExtra;
    spike.rotation.y = BOARD_PLACEHOLDER.rotations.trapY;
    spike.castShadow = true;
    group.add(spike);
    return;
  }

  if (marker === "event") {
    const eventGem = new THREE.Mesh(
      new THREE.OctahedronGeometry(BOARD_PLACEHOLDER.markers.eventRadius),
      new THREE.MeshStandardMaterial({
        color: PALETTE.mist,
        roughness: BOARD_PLACEHOLDER.materials.event.roughness,
        metalness: BOARD_PLACEHOLDER.materials.event.metalness,
      }),
    );
    eventGem.position.y =
      markerHeight + Math.sin(index) * BOARD_PLACEHOLDER.markers.eventFloatAmount;
    eventGem.castShadow = true;
    group.add(eventGem);
    return;
  }

  if (marker === "action") {
    const barMaterial = new THREE.MeshStandardMaterial({
      color: PALETTE.ink,
      roughness: BOARD_PLACEHOLDER.materials.action.roughness,
      metalness: BOARD_PLACEHOLDER.materials.action.metalness,
    });
    const horizontal = new THREE.Mesh(
      new THREE.BoxGeometry(
        BOARD_PLACEHOLDER.markers.actionWidth,
        BOARD_PLACEHOLDER.markers.actionHeight,
        BOARD_PLACEHOLDER.markers.actionDepth,
      ),
      barMaterial,
    );
    const vertical = new THREE.Mesh(
      new THREE.BoxGeometry(
        BOARD_PLACEHOLDER.markers.actionDepth,
        BOARD_PLACEHOLDER.markers.actionHeight,
        BOARD_PLACEHOLDER.markers.actionWidth,
      ),
      barMaterial.clone(),
    );
    horizontal.position.y = markerHeight;
    vertical.position.y = markerHeight;
    horizontal.castShadow = true;
    vertical.castShadow = true;
    group.add(horizontal, vertical);
    return;
  }

  if (marker === "finish") {
    const finishMarker = new THREE.Mesh(
      new THREE.ConeGeometry(
        BOARD_PLACEHOLDER.markers.finishRadius,
        BOARD_PLACEHOLDER.markers.finishHeight,
        BOARD_PLACEHOLDER.markers.finishSegments,
      ),
      new THREE.MeshStandardMaterial({
        color: PALETTE.gold,
        roughness: BOARD_PLACEHOLDER.materials.treasure.roughness,
        metalness: BOARD_PLACEHOLDER.materials.treasure.metalness,
      }),
    );
    finishMarker.position.y = markerHeight + BOARD_PLACEHOLDER.markers.finishYExtra;
    finishMarker.rotation.y = BOARD_PLACEHOLDER.rotations.trapY;
    finishMarker.castShadow = true;
    group.add(finishMarker);
  }
}

function getBoardPositionBounds(): string {
  const bounds = getBoardPositionMetrics();

  return `x ${formatDebugNumber(bounds.minX)} to ${formatDebugNumber(
    bounds.maxX,
  )}, z ${formatDebugNumber(bounds.minZ)} to ${formatDebugNumber(bounds.maxZ)}`;
}

function getBoardPositionMetrics(): {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  centerX: number;
  centerZ: number;
  width: number;
  depth: number;
} {
  const xs = BOARD_SPACES.map((space) => space.position.x);
  const zs = BOARD_SPACES.map((space) => space.position.z);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);

  return {
    minX,
    maxX,
    minZ,
    maxZ,
    centerX: (minX + maxX) / 2,
    centerZ: (minZ + maxZ) / 2,
    width: maxX - minX,
    depth: maxZ - minZ,
  };
}

function renderHtmlBoard(state: GameState): string {
  const routeGuides = HTML_BOARD_ROUTE_GUIDES.map(
    (guide) => `
      <div
        class="html-board-route-guide"
        aria-hidden="true"
        style="left: ${guide.x}%; top: ${guide.y}%; width: ${guide.width}%; transform: rotate(${guide.angle}deg);"
      ></div>
    `,
  ).join("");
  const connections = BOARD_SPACES.flatMap((space) =>
    space.nextSpaceIds.flatMap((nextSpaceId) => {
      const nextSpace = getBoardSpace(nextSpaceId);

      if (nextSpace === undefined) {
        return [];
      }

      const start = getHtmlBoardPoint(space.id);
      const end = getHtmlBoardPoint(nextSpace.id);
      const isBranch = space.nextSpaceIds.length > 1;
      const pathPoints = getHtmlConnectionPoints(space.id, nextSpace.id, start, end);

      return pathPoints.slice(0, -1).map((segmentStart, index) => {
        const segmentEnd = pathPoints[index + 1];
        const width = Math.hypot(segmentEnd.x - segmentStart.x, segmentEnd.y - segmentStart.y);
        const angle = Math.atan2(segmentEnd.y - segmentStart.y, segmentEnd.x - segmentStart.x);
        const isLong = width > 14;

        return `
          <div
            class="html-board-connection ${isBranch ? "is-branch" : ""} ${isLong ? "is-long" : ""}"
            data-testid="board-connection"
            style="left: ${segmentStart.x}%; top: ${segmentStart.y}%; width: ${width}%; transform: rotate(${angle}rad);"
          ></div>
        `;
      });
    }),
  ).join("");
  const tiles = BOARD_SPACES.map((space) => {
    const point = getHtmlBoardPoint(space.id);
    const isChoice = state.availableBranchSpaceIds.includes(space.id);
    const isCurrentPosition = state.players.some((player) => player.positionId === space.id);
    const label = getHtmlBoardLabel(space.id);

    return `
      <div
        class="html-board-space ${isChoice ? "is-choice" : ""} ${isCurrentPosition ? "has-player" : ""}"
        data-testid="board-space"
        data-space-id="${space.id}"
        data-space-type="${space.type}"
        title="${space.region}: ${space.name} (${space.type})"
        aria-label="${space.region}: ${space.name} (${space.type})"
        style="left: ${point.x}%; top: ${point.y}%;"
      >
        ${label === "" ? "" : `<span class="html-board-space-label">${label}</span>`}
      </div>
    `;
  }).join("");
  const players = state.players
    .map((player, index) => {
      const space = getBoardSpace(player.positionId);

      if (space === undefined) {
        return "";
      }

      const point = getHtmlBoardPoint(space.id);
      const offsetX = index === 0 ? -10 : 10;
      const offsetY = index === 0 ? 12 : -12;

      return `
        <div
          class="html-board-player ${index === state.currentPlayerIndex ? "is-active" : ""}"
          data-testid="player-token"
          data-player-index="${index}"
          title="${player.name} on ${space.name}"
          style="left: ${point.x}%; top: ${point.y}%; --token-offset-x: ${offsetX}px; --token-offset-y: ${offsetY}px;"
        >
          ${index + 1}
        </div>
      `;
    })
    .join("");

  if (BOARD_SPACES.length === 0) {
    return `
      <p class="html-board-debug" data-testid="html-board-debug">HTML board rendered: 0 spaces, ${state.players.length} players</p>
      <div class="html-board-failure" data-testid="board-render-failure">
        Board render failed: 0 spaces rendered
      </div>
    `;
  }

  return `
    <div class="html-board-surface" data-testid="html-board-surface">
      ${routeGuides}
      ${connections}
      ${tiles}
      ${players}
    </div>
  `;
}

function getHtmlBoardPoint(spaceId: string): { x: number; y: number } {
  const layoutKey = spaceId.replace(/-([a-z0-9])/g, (_, character: string) =>
    character.toUpperCase(),
  ) as keyof typeof HTML_BOARD_LAYOUT;

  return HTML_BOARD_LAYOUT[layoutKey] ?? { x: 50, y: 50 };
}

function getHtmlBoardLabel(spaceId: string): string {
  switch (spaceId) {
    case START_SPACE_ID:
      return "Start";
    case "final-choice":
      return "Choice";
    case "meadow-1":
      return "Meadow";
    case "pond-1":
      return "Pond";
    case "river-1":
      return "River";
    case "shipwreck-1":
      return "Shipwreck";
    case "finish":
      return "Finish";
    default:
      return "";
  }
}

function getHtmlConnectionPoints(
  fromSpaceId: string,
  toSpaceId: string,
  start: { x: number; y: number },
  end: { x: number; y: number },
): { x: number; y: number }[] {
  const bendKey = `${fromSpaceId}>${toSpaceId}` as keyof typeof HTML_BOARD_CONNECTION_BENDS;
  const bends = HTML_BOARD_CONNECTION_BENDS[bendKey] ?? [];

  return [start, ...bends, end];
}

function getProjectedRouteBounds(
  board: THREE.Group,
  camera: THREE.Camera,
  canvasRect: DOMRect,
): { bounds: string; anchorsOnScreen: number } {
  board.updateMatrixWorld(true);
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let anchorsOnScreen = 0;

  BOARD_SPACES.forEach((space) => {
    const point = new THREE.Vector3(space.position.x, BOARD_PLACEHOLDER.spaces.y, space.position.z);
    const projected = board.localToWorld(point).project(camera);
    const screenX = ((projected.x + 1) / 2) * canvasRect.width;
    const screenY = ((1 - projected.y) / 2) * canvasRect.height;
    const isInFrontOfCamera = projected.z >= -1 && projected.z <= 1;

    minX = Math.min(minX, screenX);
    maxX = Math.max(maxX, screenX);
    minY = Math.min(minY, screenY);
    maxY = Math.max(maxY, screenY);

    if (
      isInFrontOfCamera &&
      screenX >= 0 &&
      screenX <= canvasRect.width &&
      screenY >= 0 &&
      screenY <= canvasRect.height
    ) {
      anchorsOnScreen += 1;
    }
  });

  return {
    bounds: `x ${formatDebugNumber(minX)} to ${formatDebugNumber(
      maxX,
    )}, y ${formatDebugNumber(minY)} to ${formatDebugNumber(maxY)}`,
    anchorsOnScreen,
  };
}

function formatDebugNumber(value: number): string {
  return value.toFixed(1);
}

function getHtmlBoardDebugInfo(
  boardMap: HTMLElement,
  state: GameState,
): BoardDebugInfo {
  const boardRect = boardMap.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const htmlBoardIntersectsViewport =
    boardRect.right > 0 &&
    boardRect.bottom > 0 &&
    boardRect.left < viewportWidth &&
    boardRect.top < viewportHeight;

  return {
    htmlBoardCssSize: `${formatDebugNumber(boardRect.width)} x ${formatDebugNumber(
      boardRect.height,
    )}`,
    htmlBoardSpaceCount: BOARD_SPACES.length,
    htmlBoardPlayerCount: state.players.length,
    htmlBoardIntersectsViewport,
    canvasCssSize: "not used for main board",
    canvasBufferSize: "not used for main board",
    cameraPosition: "not used for main board",
    cameraTarget: "not used for main board",
    routeTileCount: BOARD_SPACES.length,
    playerPieceCount: state.players.length,
    boardBounds: getBoardPositionBounds(),
    projectedRouteBounds: "not used for main board",
    routeAnchorsOnScreen: BOARD_SPACES.length,
    canvasIntersectsViewport: false,
  };
}

function renderBoardDebug(info: BoardDebugInfo): string {
  const htmlVisibilityLabel = info.htmlBoardIntersectsViewport ? "yes" : "no";
  const canvasVisibilityLabel = info.canvasIntersectsViewport ? "yes" : "no";

  return `
    <p class="board-debug-title">Board Visibility Debug</p>
    <p>This panel is only for diagnosing blank-board bugs.</p>
    <dl>
      <div><dt>HTML board CSS size</dt><dd>${info.htmlBoardCssSize}</dd></div>
      <div><dt>HTML board in viewport</dt><dd>${htmlVisibilityLabel}</dd></div>
      <div><dt>HTML spaces rendered</dt><dd>${info.htmlBoardSpaceCount}</dd></div>
      <div><dt>HTML players rendered</dt><dd>${info.htmlBoardPlayerCount}</dd></div>
      <div><dt>Canvas CSS size</dt><dd>${info.canvasCssSize}</dd></div>
      <div><dt>Canvas buffer size</dt><dd>${info.canvasBufferSize}</dd></div>
      <div><dt>Canvas in viewport</dt><dd>${canvasVisibilityLabel}</dd></div>
      <div><dt>Camera position</dt><dd>${info.cameraPosition}</dd></div>
      <div><dt>Camera target</dt><dd>${info.cameraTarget}</dd></div>
      <div><dt>Route tile meshes</dt><dd>${info.routeTileCount}</dd></div>
      <div><dt>Player piece meshes</dt><dd>${info.playerPieceCount}</dd></div>
      <div><dt>Board world bounds</dt><dd>${info.boardBounds}</dd></div>
      <div><dt>Projected route bounds</dt><dd>${info.projectedRouteBounds}</dd></div>
      <div><dt>Route anchors on screen</dt><dd>${info.routeAnchorsOnScreen}</dd></div>
    </dl>
  `;
}

function renderRegionSummaries(): string {
  const regions = new Map<BoardRegion, BoardRisk>();

  BOARD_SPACES.forEach((space) => {
    if (!regions.has(space.region)) {
      regions.set(space.region, space.risk);
    }
  });

  return [...regions.entries()]
    .map(
      ([region, risk]) => `
        <p class="region-chip region-chip-${risk}">
          <span>${region}</span>
          <small>${RISK_LABELS[risk]}</small>
        </p>
      `,
    )
    .join("");
}

function getBoardStatusText(state: GameState): string {
  const activePlayer = state.players[state.currentPlayerIndex];
  const movingPlayer = state.players[state.movingPlayerIndex] ?? activePlayer;
  const activeSpace = getBoardSpace(activePlayer?.positionId ?? "");
  const movingSpace = getBoardSpace(movingPlayer?.positionId ?? "");
  const activeSpaceName = activeSpace?.name ?? "the board";
  const movingSpaceName = movingSpace?.name ?? "the board";
  const activeName = activePlayer?.name ?? "Player";
  const movingName = movingPlayer?.name ?? "Player";

  if (state.phase === "waitingToRoll") {
    const prefix =
      state.lastTurnSummary === null ? "" : `${state.lastTurnSummary} `;

    return `${prefix}${activeName}'s turn. Waiting to roll on ${activeSpaceName}.`;
  }

  if (state.phase === "moving") {
    return `${movingName} is moving with ${state.pendingMovement} step left.`;
  }

  if (state.phase === "choosingBranch") {
    const stepLabel = state.pendingMovement === 1 ? "step remains" : "steps remain";

    return `${movingName}, choose a route from ${movingSpaceName}. ${state.pendingMovement} ${stepLabel} from this roll.`;
  }

  if (state.phase === "shopping") {
    const shop = getActiveShop(state);

    return `${activeName} is at ${shop?.name ?? "the shop"}. Buy, sell, or leave to end the turn.`;
  }

  if (state.phase === "gameOver") {
    return state.gameOverResult?.message ?? "Game Over.";
  }

  if (state.phase === "movementComplete") {
    return `${movingName} landed on ${movingSpaceName}.`;
  }

  return "Ready for the adventure.";
}

function renderShopActions(state: GameState): string {
  const shop = getActiveShop(state);
  const player = state.players[state.currentPlayerIndex];

  if (state.phase !== "shopping" || shop === null || player === undefined) {
    return "";
  }

  const canBuy = canBuyShopTreasure(state);
  const buyReason =
    player.coins < shop.purchasePrice
      ? `Need ${shop.purchasePrice} coins`
      : "Treasure hand is full";
  const sellButtons =
    player.treasureHand.length === 0
      ? `<p class="shop-note">No Treasure cards to sell yet.</p>`
      : player.treasureHand
          .map((cardId, cardIndex) => {
            const cardName = getTreasureCardName(cardId);
            const disabled = canSellShopTreasure(state, cardIndex) ? "" : "disabled";

            return `
              <button
                type="button"
                class="shop-action-button secondary"
                data-shop-sell="${cardIndex}"
                aria-label="Sell ${cardName}"
                ${disabled}
              >
                Sell ${cardName}
              </button>
            `;
          })
          .join("");

  return `
    <section class="shop-panel" aria-label="${shop.name} options">
      <p class="shop-title">${shop.name}</p>
      <p class="shop-detail">Price: ${shop.purchasePrice} coins. ${player.name} has ${player.coins} coins.</p>
      <button
        type="button"
        class="shop-action-button primary"
        data-shop-buy
        aria-label="Buy a seeded Treasure card"
        ${canBuy ? "" : "disabled"}
      >
        Buy Treasure${canBuy ? "" : ` (${buyReason})`}
      </button>
      ${sellButtons}
      <button
        type="button"
        class="shop-action-button leave"
        data-shop-leave
        aria-label="Leave shop and end turn"
      >
        Leave Shop / End Turn
      </button>
    </section>
  `;
}

function renderGameOver(state: GameState): string {
  const result = state.gameOverResult;

  if (state.phase !== "gameOver" || result === null) {
    return "";
  }

  const finisherName =
    state.players[result.finisherPlayerIndex]?.name ?? "A player";
  const resultText =
    result.winnerPlayerIndex === null
      ? "Tie game."
      : `${state.players[result.winnerPlayerIndex]?.name ?? "Player"} wins.`;
  const totals = state.players
    .map(
      (player, index) => `
        <p class="game-over-total ${index === result.winnerPlayerIndex ? "is-winner" : ""}">
          <span>${player.name}</span>
          <strong>${result.finalCoins[index] ?? player.coins} coins</strong>
        </p>
      `,
    )
    .join("");

  return `
    <section class="game-over-panel" aria-label="Game Over final results">
      <p class="game-over-title">Game Over</p>
      <p class="game-over-detail">${finisherName} reached Finish.</p>
      <p class="game-over-result">${resultText}</p>
      <div class="game-over-totals">${totals}</div>
      <p class="game-over-note">No finish bonus is awarded in this v1 prototype.</p>
      <button
        type="button"
        class="shop-action-button primary"
        data-restart-board
        aria-label="Restart board"
      >
        Restart Board
      </button>
    </section>
  `;
}

function getMovingPlayerName(state: GameState): string {
  return state.players[state.movingPlayerIndex]?.name ?? "Player";
}

function renderPlayerCoins(state: GameState): string {
  return state.players
    .map(
      (player, index) => `
        <p class="player-coin-chip ${index === state.currentPlayerIndex ? "is-active" : ""}">
          <span>${player.name}</span>
          <strong>${player.coins} coins</strong>
        </p>
      `,
    )
    .join("");
}

function renderPlayerHands(state: GameState): string {
  return state.players
    .map((player, playerIndex) => {
      const handText =
        player.treasureHand.length === 0
          ? "No Treasure cards"
          : player.treasureHand
              .map((cardId) => {
                const cardName = getTreasureCardName(cardId);
                const isUsable =
                  playerIndex === state.currentPlayerIndex &&
                  canUseTreasureCard(state, cardId);

                if (!isUsable) {
                  return `<span class="treasure-card-name">${cardName}</span>`;
                }

                return `
                  <button
                    type="button"
                    class="treasure-card-button"
                    data-treasure-card="${cardId}"
                    aria-label="Use ${cardName}"
                  >
                    Use ${cardName}
                  </button>
                `;
              })
              .join("");

      return `
        <p class="player-hand-chip">
          <span>${player.name} hand</span>
          <strong>${handText}</strong>
        </p>
      `;
    })
    .join("");
}

function renderBranchChoices(state: GameState): string {
  if (state.phase !== "choosingBranch") {
    return "";
  }

  return state.availableBranchSpaceIds
    .map((spaceId) => {
      const space = getBoardSpace(spaceId);
      const label = space === undefined ? spaceId : `${space.region}: ${space.name}`;

      return `
        <button
          type="button"
          class="branch-choice-button"
          data-branch-choice="${spaceId}"
          aria-label="Choose route to ${label}"
        >
          ${label}
        </button>
      `;
    })
    .join("");
}

function addLights(scene: THREE.Scene): void {
  const ambient = new THREE.HemisphereLight(
    PALETTE.mist,
    PALETTE.deepSea,
    BOARD_PLACEHOLDER.lights.ambientIntensity,
  );
  scene.add(ambient);

  const key = new THREE.DirectionalLight(
    PALETTE.mist,
    BOARD_PLACEHOLDER.lights.keyIntensity,
  );
  key.position.set(
    BOARD_PLACEHOLDER.lights.keyPosition.x,
    BOARD_PLACEHOLDER.lights.keyPosition.y,
    BOARD_PLACEHOLDER.lights.keyPosition.z,
  );
  key.castShadow = true;
  key.shadow.mapSize.set(
    BOARD_PLACEHOLDER.renderer.shadowMapSize,
    BOARD_PLACEHOLDER.renderer.shadowMapSize,
  );
  scene.add(key);

  const fill = new THREE.DirectionalLight(
    PALETTE.amber,
    BOARD_PLACEHOLDER.lights.fillIntensity,
  );
  fill.position.set(
    BOARD_PLACEHOLDER.lights.fillPosition.x,
    BOARD_PLACEHOLDER.lights.fillPosition.y,
    BOARD_PLACEHOLDER.lights.fillPosition.z,
  );
  scene.add(fill);
}

function disposeMaterial(material: THREE.Material | THREE.Material[]): void {
  if (Array.isArray(material)) {
    material.forEach((entry) => entry.dispose());
    return;
  }

  material.dispose();
}
