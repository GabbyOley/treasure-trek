import * as THREE from "three";

import {
  BOARD_SPACES,
  getBoardSpace,
  type BoardRegion,
  type BoardRisk,
  type BoardSpace,
  type BoardSpaceType,
} from "../game/board";
import type { GameState } from "../game/state";
import { getTreasureCardName } from "../game/treasureCards";
import { BOARD_PLACEHOLDER, PALETTE } from "../utils/constants";

type SpaceStyle = {
  color: number;
  marker: "none" | "coin" | "treasure" | "trap" | "event" | "action";
};

type PlayerPieceView = {
  group: THREE.Group;
  activeRing: THREE.Mesh;
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
};

const RISK_LABELS: Record<BoardRisk, string> = {
  safe: "safe",
  quest: "rolling quest",
  danger: "dangerous branch",
};

export type BoardScreenView = {
  update: (state: GameState) => void;
  destroy: () => void;
};

export type BoardScreenHandlers = {
  onBack: () => void;
  onRoll: () => void;
  onChooseBranch: (spaceId: string) => void;
};

export function renderBoardScreen(
  container: HTMLDivElement,
  state: GameState,
  handlers: BoardScreenHandlers,
): BoardScreenView {
  container.innerHTML = `
    <main class="board-screen">
      <div class="board-toolbar">
        <button type="button" class="back-button" data-action="back-title" aria-label="Return to title screen">
          Back
        </button>
        <p class="board-kicker">Treasure Trek</p>
      </div>
      <div class="board-stage">
        <div class="board-canvas-wrap" aria-label="3D Treasure Trek board placeholder"></div>
        <section class="board-status-panel" aria-live="polite">
          <p class="board-status-label">Board Turn</p>
          <p class="board-status-text" data-board-status></p>
          <p class="board-roll-text" data-board-roll></p>
          <div class="player-coin-list" data-player-coins aria-label="Player coin totals"></div>
          <div class="player-hand-list" data-player-hands aria-label="Player Treasure hands"></div>
          <div class="board-choice-list" data-board-choices></div>
          <button
            type="button"
            class="board-roll-button"
            data-action="board-roll"
            aria-label="Roll the board die"
          >
            Roll
          </button>
        </section>
        <aside class="board-region-panel" aria-label="Board regions">
          ${renderRegionSummaries()}
        </aside>
      </div>
    </main>
  `;

  const canvasWrap = container.querySelector<HTMLDivElement>(".board-canvas-wrap");

  if (canvasWrap === null) {
    throw new Error("Board canvas container was not created.");
  }

  const sceneView = createBoardScene(canvasWrap, state);
  const status = container.querySelector<HTMLParagraphElement>("[data-board-status]");
  const roll = container.querySelector<HTMLParagraphElement>("[data-board-roll]");
  const playerCoins = container.querySelector<HTMLDivElement>("[data-player-coins]");
  const playerHands = container.querySelector<HTMLDivElement>("[data-player-hands]");
  const choices = container.querySelector<HTMLDivElement>("[data-board-choices]");
  const rollButton = container.querySelector<HTMLButtonElement>('[data-action="board-roll"]');

  if (
    status === null ||
    roll === null ||
    playerCoins === null ||
    playerHands === null ||
    choices === null ||
    rollButton === null
  ) {
    throw new Error("Board controls were not created.");
  }

  const updateHud = (nextState: GameState): void => {
    status.textContent = getBoardStatusText(nextState);
    roll.textContent =
      nextState.lastRoll === null
        ? "No board roll yet."
        : `${getMovingPlayerName(nextState)} rolled ${nextState.lastRoll}.`;
    playerCoins.innerHTML = renderPlayerCoins(nextState);
    playerHands.innerHTML = renderPlayerHands(nextState);
    rollButton.disabled =
      nextState.phase === "moving" || nextState.phase === "choosingBranch";
    choices.innerHTML = renderBranchChoices(nextState);

    choices
      .querySelectorAll<HTMLButtonElement>("[data-branch-choice]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          handlers.onChooseBranch(button.dataset.branchChoice ?? "");
        });
      });
  };

  container
    .querySelector<HTMLButtonElement>('[data-action="back-title"]')
    ?.addEventListener("click", handlers.onBack);
  rollButton.addEventListener("click", handlers.onRoll);
  updateHud(state);

  return {
    update: (nextState: GameState) => {
      sceneView.update(nextState);
      updateHud(nextState);
    },
    destroy: sceneView.destroy,
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
  };
}

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
  const connection = new THREE.Mesh(
    new THREE.CylinderGeometry(
      BOARD_PLACEHOLDER.connections.radius,
      BOARD_PLACEHOLDER.connections.radius,
      length,
      BOARD_PLACEHOLDER.rim.radialSegments,
    ),
    new THREE.MeshStandardMaterial({
      color: start.region === "Cave" || end.region === "Cave" ? PALETTE.coral : PALETTE.parchment,
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
  }
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

  if (state.phase === "movementComplete") {
    return `${movingName} landed on ${movingSpaceName}.`;
  }

  return "Ready for the adventure.";
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
    .map((player) => {
      const handText =
        player.treasureHand.length === 0
          ? "No Treasure cards"
          : player.treasureHand.map(getTreasureCardName).join(", ");

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
