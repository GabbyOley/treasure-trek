import * as THREE from "three";

import {
  BOARD_SPACES,
  getBoardSpace,
  type BoardRegion,
  type BoardRisk,
  type BoardSpace,
  type BoardSpaceType,
} from "../game/board";
import { BOARD_PLACEHOLDER, PALETTE } from "../utils/constants";

type SpaceStyle = {
  color: number;
  marker: "none" | "coin" | "treasure" | "trap" | "event" | "action";
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
  destroy: () => void;
};

export function renderBoardScreen(container: HTMLDivElement): BoardScreenView {
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

  return createBoardScene(canvasWrap);
}

function createBoardScene(container: HTMLDivElement): BoardScreenView {
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
  scene.add(board);
  addLights(scene);

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
    destroy: () => {
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
