import * as THREE from "three";

import {
  BOARD_SPACES,
  getBoardSpace,
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
import { BOARD_PLACEHOLDER, PALETTE } from "../utils/constants";

type SpaceStyle = {
  color: number;
  marker: "none" | "coin" | "treasure" | "trap" | "event" | "action" | "finish";
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
    <main class="board-screen">
      <div class="board-toolbar">
        <button type="button" class="back-button" data-action="back-title" aria-label="Return to title screen">
          Back
        </button>
        <p class="board-kicker">Treasure Trek</p>
      </div>
      <div class="board-stage">
        <div class="board-canvas-wrap" aria-label="3D Treasure Trek island board"></div>
        <section class="board-status-panel" aria-live="polite">
          <p class="board-status-label">Board Turn</p>
          <p class="board-status-text" data-board-status></p>
          <p class="board-roll-text" data-board-roll></p>
          <button
            type="button"
            class="board-roll-button"
            data-action="board-roll"
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
        <aside class="board-region-panel" aria-label="Board region key">
          <p class="region-panel-title">Island regions</p>
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
  const shopActions = container.querySelector<HTMLDivElement>("[data-shop-actions]");
  const gameOver = container.querySelector<HTMLDivElement>("[data-game-over]");
  const rollButton = container.querySelector<HTMLButtonElement>('[data-action="board-roll"]');

  if (
    status === null ||
    roll === null ||
    playerCoins === null ||
    playerHands === null ||
    choices === null ||
    shopActions === null ||
    gameOver === null ||
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
  renderer.domElement.setAttribute("aria-label", "3D Treasure Trek island board");
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
        if (object instanceof THREE.Sprite) {
          object.material.map?.dispose();
          object.material.dispose();
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

  const ocean = new THREE.Mesh(
    new THREE.CylinderGeometry(
      BOARD_PLACEHOLDER.ocean.radius,
      BOARD_PLACEHOLDER.ocean.radius,
      BOARD_PLACEHOLDER.ocean.height,
      BOARD_PLACEHOLDER.ocean.segments,
    ),
    new THREE.MeshStandardMaterial({
      color: PALETTE.deepSea,
      roughness: BOARD_PLACEHOLDER.materials.ocean.roughness,
      metalness: BOARD_PLACEHOLDER.materials.ocean.metalness,
    }),
  );
  ocean.position.y = BOARD_PLACEHOLDER.ocean.y;
  ocean.receiveShadow = true;
  group.add(ocean);

  const island = createTerrainLayer(
    BOARD_PLACEHOLDER.terrainShape,
    PALETTE.parchment,
    BOARD_PLACEHOLDER.island.y,
  );
  island.castShadow = true;
  island.receiveShadow = true;
  group.add(island);

  const grass = createTerrainLayer(
    BOARD_PLACEHOLDER.terrainShape.map((point) => ({
      x: point.x * BOARD_PLACEHOLDER.grass.scale,
      z: point.z * BOARD_PLACEHOLDER.grass.scale,
    })),
    PALETTE.meadow,
    BOARD_PLACEHOLDER.grass.y,
  );
  grass.receiveShadow = true;
  group.add(grass);

  addRegionLandmarks(group);

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

  addRegionLabels(group);

  return group;
}

function createTerrainLayer(
  points: readonly { x: number; z: number }[],
  color: number,
  y: number,
): THREE.Mesh {
  const shape = new THREE.Shape();
  const [firstPoint, ...rest] = points;

  if (firstPoint !== undefined) {
    shape.moveTo(firstPoint.x, -firstPoint.z);
    rest.forEach((point) => {
      shape.lineTo(point.x, -point.z);
    });
    shape.closePath();
  }

  const terrain = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshStandardMaterial({
      color,
      roughness: BOARD_PLACEHOLDER.materials.island.roughness,
      metalness: BOARD_PLACEHOLDER.materials.island.metalness,
    }),
  );
  terrain.rotation.x = BOARD_PLACEHOLDER.rotations.flatTerrainX;
  terrain.position.y = y;

  return terrain;
}

function addRegionLandmarks(group: THREE.Group): void {
  addCampgroundLandmark(group);
  addCaveLandmark(group);
  addVolcanoLandmark(group);
  addWaterfallLandmark(group);
  addSwampLandmark(group);
  addCliffLandmark(group);
  addTreeCluster(group, [
    { x: 3.9, z: -2.55 },
    { x: 4.65, z: -2.3 },
    { x: 5.15, z: -1.7 },
  ]);
  addTreeCluster(group, [
    { x: 5.85, z: -1.15 },
    { x: 6.55, z: -0.75 },
    { x: 6.95, z: -1.75 },
    { x: 7.55, z: -0.65 },
  ]);
  addMeadowLandmark(group);
  addPondLandmark(group);
  addRiverLandmark(group);
  addShipwreckLandmark(group);
  addFinishLandmark(group);
}

function addCampgroundLandmark(group: THREE.Group): void {
  const tent = new THREE.Mesh(
    new THREE.ConeGeometry(
      BOARD_PLACEHOLDER.landmarks.tentWidth,
      BOARD_PLACEHOLDER.landmarks.tentHeight,
      BOARD_PLACEHOLDER.markers.trapSegments,
    ),
    new THREE.MeshStandardMaterial({
      color: PALETTE.coral,
      roughness: BOARD_PLACEHOLDER.materials.trap.roughness,
      metalness: BOARD_PLACEHOLDER.materials.trap.metalness,
    }),
  );
  tent.position.set(-6.95, BOARD_PLACEHOLDER.landmarks.y + 0.18, -3.2);
  tent.rotation.y = BOARD_PLACEHOLDER.rotations.trapY;
  tent.castShadow = true;
  group.add(tent);

  const fire = new THREE.Mesh(
    new THREE.ConeGeometry(
      BOARD_PLACEHOLDER.landmarks.campfireRadius,
      BOARD_PLACEHOLDER.landmarks.tentHeight,
      BOARD_PLACEHOLDER.markers.finishSegments,
    ),
    new THREE.MeshStandardMaterial({
      color: PALETTE.lava,
      emissive: PALETTE.coral,
      roughness: BOARD_PLACEHOLDER.materials.event.roughness,
      metalness: BOARD_PLACEHOLDER.materials.event.metalness,
    }),
  );
  fire.position.set(-6.35, BOARD_PLACEHOLDER.landmarks.y + 0.16, -2.65);
  fire.castShadow = true;
  group.add(fire);
}

function addCaveLandmark(group: THREE.Group): void {
  const cave = new THREE.Mesh(
    new THREE.SphereGeometry(
      BOARD_PLACEHOLDER.landmarks.rockRadius,
      BOARD_PLACEHOLDER.spaces.segments,
      BOARD_PLACEHOLDER.spaces.segments,
    ),
    new THREE.MeshStandardMaterial({
      color: PALETTE.rock,
      roughness: BOARD_PLACEHOLDER.materials.island.roughness,
      metalness: BOARD_PLACEHOLDER.materials.island.metalness,
    }),
  );
  cave.position.set(-2.7, BOARD_PLACEHOLDER.landmarks.y + 0.12, -3);
  cave.scale.set(1.6, 0.65, 1);
  cave.castShadow = true;
  group.add(cave);

  const mouth = new THREE.Mesh(
    new THREE.CircleGeometry(
      BOARD_PLACEHOLDER.landmarks.rockRadius,
      BOARD_PLACEHOLDER.spaces.segments,
    ),
    new THREE.MeshStandardMaterial({
      color: PALETTE.ink,
      roughness: BOARD_PLACEHOLDER.materials.island.roughness,
      metalness: BOARD_PLACEHOLDER.materials.island.metalness,
    }),
  );
  mouth.position.set(-2.7, BOARD_PLACEHOLDER.landmarks.y + 0.1, -2.55);
  mouth.rotation.x = BOARD_PLACEHOLDER.rotations.flatMarkerX;
  mouth.scale.set(1.15, 0.62, 1);
  group.add(mouth);
}

function addVolcanoLandmark(group: THREE.Group): void {
  const volcano = new THREE.Mesh(
    new THREE.ConeGeometry(
      BOARD_PLACEHOLDER.landmarks.volcanoRadius,
      BOARD_PLACEHOLDER.landmarks.volcanoHeight,
      BOARD_PLACEHOLDER.spaces.segments,
    ),
    new THREE.MeshStandardMaterial({
      color: PALETTE.rock,
      roughness: BOARD_PLACEHOLDER.materials.trap.roughness,
      metalness: BOARD_PLACEHOLDER.materials.trap.metalness,
    }),
  );
  volcano.position.set(0.65, BOARD_PLACEHOLDER.landmarks.y + 0.45, 4.75);
  volcano.castShadow = true;
  group.add(volcano);

  const lava = new THREE.Mesh(
    new THREE.ConeGeometry(
      BOARD_PLACEHOLDER.landmarks.volcanoRadius * 0.38,
      BOARD_PLACEHOLDER.landmarks.volcanoHeight * 0.32,
      BOARD_PLACEHOLDER.spaces.segments,
    ),
    new THREE.MeshStandardMaterial({
      color: PALETTE.lava,
      emissive: PALETTE.coral,
      roughness: BOARD_PLACEHOLDER.materials.event.roughness,
      metalness: BOARD_PLACEHOLDER.materials.event.metalness,
    }),
  );
  lava.position.set(0.65, BOARD_PLACEHOLDER.landmarks.y + 0.92, 4.75);
  group.add(lava);
}

function addWaterfallLandmark(group: THREE.Group): void {
  addWaterPatch(group, -6.8, 4.6, 0.62, 1.45, PALETTE.foam);
  addWaterPatch(group, -6.2, 3.75, 0.36, 1.5, PALETTE.tide);
}

function addSwampLandmark(group: THREE.Group): void {
  addWaterPatch(group, -5.35, -1.35, 1.4, 1, PALETTE.swamp);
  [-5.9, -5.35, -4.8].forEach((x) => {
    const reed = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, BOARD_PLACEHOLDER.landmarks.reedHeight, 6),
      new THREE.MeshStandardMaterial({
        color: PALETTE.jungle,
        roughness: BOARD_PLACEHOLDER.materials.grass.roughness,
        metalness: BOARD_PLACEHOLDER.materials.grass.metalness,
      }),
    );
    reed.position.set(x, BOARD_PLACEHOLDER.landmarks.y + 0.18, -1.9);
    reed.rotation.z = (x + 5.35) * 0.35;
    group.add(reed);
  });
}

function addCliffLandmark(group: THREE.Group): void {
  [
    { x: -1.3, z: -4.05 },
    { x: -0.35, z: -4.25 },
    { x: 0.65, z: -3.95 },
  ].forEach((point) => {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(BOARD_PLACEHOLDER.landmarks.rockRadius),
      new THREE.MeshStandardMaterial({
        color: PALETTE.rock,
        roughness: BOARD_PLACEHOLDER.materials.island.roughness,
        metalness: BOARD_PLACEHOLDER.materials.island.metalness,
      }),
    );
    rock.position.set(point.x, BOARD_PLACEHOLDER.landmarks.y + 0.16, point.z);
    rock.castShadow = true;
    group.add(rock);
  });
}

function addTreeCluster(group: THREE.Group, points: readonly { x: number; z: number }[]): void {
  points.forEach((point) => {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.055, BOARD_PLACEHOLDER.landmarks.treeHeight, 8),
      new THREE.MeshStandardMaterial({
        color: PALETTE.wood,
        roughness: BOARD_PLACEHOLDER.materials.island.roughness,
        metalness: BOARD_PLACEHOLDER.materials.island.metalness,
      }),
    );
    trunk.position.set(point.x, BOARD_PLACEHOLDER.landmarks.y + 0.18, point.z);
    trunk.castShadow = true;

    const canopy = new THREE.Mesh(
      new THREE.ConeGeometry(
        BOARD_PLACEHOLDER.landmarks.treeRadius,
        BOARD_PLACEHOLDER.landmarks.treeHeight,
        BOARD_PLACEHOLDER.markers.finishSegments,
      ),
      new THREE.MeshStandardMaterial({
        color: PALETTE.jungle,
        roughness: BOARD_PLACEHOLDER.materials.grass.roughness,
        metalness: BOARD_PLACEHOLDER.materials.grass.metalness,
      }),
    );
    canopy.position.set(point.x, BOARD_PLACEHOLDER.landmarks.y + 0.5, point.z);
    canopy.castShadow = true;
    group.add(trunk, canopy);
  });
}

function addMeadowLandmark(group: THREE.Group): void {
  [
    { x: 2.3, z: 4.55 },
    { x: 2.75, z: 4.25 },
    { x: 1.95, z: 4.85 },
  ].forEach((point) => {
    const flower = new THREE.Mesh(
      new THREE.SphereGeometry(BOARD_PLACEHOLDER.landmarks.flowerRadius, 10, 10),
      new THREE.MeshStandardMaterial({
        color: PALETTE.amber,
        roughness: BOARD_PLACEHOLDER.materials.event.roughness,
        metalness: BOARD_PLACEHOLDER.materials.event.metalness,
      }),
    );
    flower.position.set(point.x, BOARD_PLACEHOLDER.landmarks.y + 0.08, point.z);
    group.add(flower);
  });
}

function addPondLandmark(group: THREE.Group): void {
  addWaterPatch(group, 5.05, 5.1, 1.05, 0.7, PALETTE.tide);
}

function addRiverLandmark(group: THREE.Group): void {
  [
    { x: 5.55, z: 2.55 },
    { x: 6.55, z: 2.65 },
    { x: 7.1, z: 3.55 },
    { x: 6.35, z: 4.6 },
  ].forEach((point) => {
    addWaterPatch(group, point.x, point.z, 0.78, 0.34, PALETTE.tide);
  });
}

function addShipwreckLandmark(group: THREE.Group): void {
  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(
      BOARD_PLACEHOLDER.landmarks.shipWidth,
      BOARD_PLACEHOLDER.landmarks.shipHeight,
      BOARD_PLACEHOLDER.landmarks.dockDepth,
    ),
    new THREE.MeshStandardMaterial({
      color: PALETTE.wood,
      roughness: BOARD_PLACEHOLDER.materials.island.roughness,
      metalness: BOARD_PLACEHOLDER.materials.island.metalness,
    }),
  );
  hull.position.set(5.25, BOARD_PLACEHOLDER.landmarks.y + 0.12, 6);
  hull.rotation.y = -0.55;
  hull.castShadow = true;
  group.add(hull);
}

function addFinishLandmark(group: THREE.Group): void {
  const dock = new THREE.Mesh(
    new THREE.BoxGeometry(
      BOARD_PLACEHOLDER.landmarks.dockWidth,
      BOARD_PLACEHOLDER.landmarks.waterHeight,
      BOARD_PLACEHOLDER.landmarks.dockDepth,
    ),
    new THREE.MeshStandardMaterial({
      color: PALETTE.wood,
      roughness: BOARD_PLACEHOLDER.materials.island.roughness,
      metalness: BOARD_PLACEHOLDER.materials.island.metalness,
    }),
  );
  dock.position.set(1.05, BOARD_PLACEHOLDER.landmarks.y + 0.08, 5.15);
  dock.castShadow = true;
  group.add(dock);
}

function addWaterPatch(
  group: THREE.Group,
  x: number,
  z: number,
  scaleX: number,
  scaleZ: number,
  color: number,
): void {
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(
      BOARD_PLACEHOLDER.landmarks.waterWidth,
      BOARD_PLACEHOLDER.landmarks.waterWidth,
      BOARD_PLACEHOLDER.landmarks.waterHeight,
      BOARD_PLACEHOLDER.spaces.segments,
    ),
    new THREE.MeshStandardMaterial({
      color,
      roughness: BOARD_PLACEHOLDER.materials.ocean.roughness,
      metalness: BOARD_PLACEHOLDER.materials.ocean.metalness,
    }),
  );
  water.position.set(x, BOARD_PLACEHOLDER.landmarks.y, z);
  water.scale.set(scaleX, 1, scaleZ);
  water.receiveShadow = true;
  group.add(water);
}

function addRegionLabels(group: THREE.Group): void {
  Object.entries(BOARD_PLACEHOLDER.labels.anchors).forEach(([region, position]) => {
    const label = createRegionLabel(region);

    label.position.set(position.x, BOARD_PLACEHOLDER.labels.y, position.z);
    group.add(label);
  });
}

function createRegionLabel(region: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = BOARD_PLACEHOLDER.labels.textureWidth;
  canvas.height = BOARD_PLACEHOLDER.labels.textureHeight;
  const context = canvas.getContext("2d");

  if (context !== null) {
    context.fillStyle = "rgba(8, 22, 36, 0.72)";
    context.strokeStyle = "rgba(242, 225, 182, 0.55)";
    context.lineWidth = 3;
    context.shadowColor = "rgba(0, 0, 0, 0.48)";
    context.shadowBlur = BOARD_PLACEHOLDER.labels.shadowBlur;
    context.beginPath();
    context.roundRect(8, 8, canvas.width - 16, canvas.height - 16, 24);
    context.fill();
    context.stroke();
    context.shadowBlur = 0;
    context.fillStyle = "#fff7e8";
    context.font = BOARD_PLACEHOLDER.labels.font;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(region, canvas.width / 2, canvas.height / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    }),
  );
  sprite.scale.set(BOARD_PLACEHOLDER.labels.width, BOARD_PLACEHOLDER.labels.height, 1);

  return sprite;
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
