import * as THREE from "three";

import { BOARD_PLACEHOLDER, PALETTE } from "../utils/constants";

type SpaceType = (typeof BOARD_PLACEHOLDER.path)[number]["type"];

type SpaceStyle = {
  color: number;
  marker: "none" | "coin" | "treasure" | "trap" | "event";
};

const SPACE_STYLES: Record<SpaceType, SpaceStyle> = {
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
      <div class="board-canvas-wrap" aria-label="3D Treasure Trek board placeholder"></div>
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
      roughness: 0.72,
      metalness: 0.05,
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
      roughness: 0.86,
      metalness: 0,
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
      roughness: 0.9,
      metalness: 0,
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

  BOARD_PLACEHOLDER.path.forEach((space, index) => {
    group.add(createSpace(space.x, space.z, space.type, index));
  });

  return group;
}

function createSpace(x: number, z: number, type: SpaceType, index: number): THREE.Group {
  const style = SPACE_STYLES[type];
  const group = new THREE.Group();
  group.position.set(x, BOARD_PLACEHOLDER.spaces.y, z);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(
      BOARD_PLACEHOLDER.spaces.radius,
      BOARD_PLACEHOLDER.spaces.radius,
      BOARD_PLACEHOLDER.spaces.height,
      BOARD_PLACEHOLDER.spaces.segments,
    ),
    new THREE.MeshStandardMaterial({
      color: style.color,
      roughness: 0.58,
      metalness: 0.02,
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
      roughness: 0.52,
      metalness: 0.08,
    }),
  );
  rim.position.y = BOARD_PLACEHOLDER.rim.y;
  rim.rotation.x = Math.PI / 2;
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
      new THREE.MeshStandardMaterial({ color: PALETTE.amber, roughness: 0.36, metalness: 0.28 }),
    );
    coin.position.y = markerHeight;
    coin.rotation.x = Math.PI / 2;
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
      new THREE.MeshStandardMaterial({ color: PALETTE.gold, roughness: 0.42, metalness: 0.16 }),
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
      new THREE.MeshStandardMaterial({ color: PALETTE.coral, roughness: 0.48, metalness: 0.04 }),
    );
    spike.position.y = markerHeight + BOARD_PLACEHOLDER.markers.trapYExtra;
    spike.rotation.y = Math.PI / 4;
    spike.castShadow = true;
    group.add(spike);
    return;
  }

  if (marker === "event") {
    const eventGem = new THREE.Mesh(
      new THREE.OctahedronGeometry(BOARD_PLACEHOLDER.markers.eventRadius),
      new THREE.MeshStandardMaterial({ color: PALETTE.mist, roughness: 0.22, metalness: 0.12 }),
    );
    eventGem.position.y =
      markerHeight + Math.sin(index) * BOARD_PLACEHOLDER.markers.eventFloatAmount;
    eventGem.castShadow = true;
    group.add(eventGem);
  }
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
