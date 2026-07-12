export const PALETTE = {
  midnight: 0x0b2239,
  deepSea: 0x12395b,
  tide: 0x2b6c7e,
  jungle: 0x2f5d50,
  gold: 0xd2a03a,
  amber: 0xe0b85c,
  coral: 0xc96a42,
  parchment: 0xf2e1b6,
  mist: 0xfff7e8,
  ink: 0x1d160d,
} as const;

export const CSS_PALETTE = {
  midnight: "#0b2239",
  deepSea: "#12395b",
  tide: "#2b6c7e",
  jungle: "#2f5d50",
  gold: "#d2a03a",
  amber: "#e0b85c",
  coral: "#c96a42",
  parchment: "#f2e1b6",
  mist: "#fff7e8",
  ink: "#1d160d",
} as const;

export const INITIAL_RNG_SEED = 0x5eed1234;

export const TITLE_SCREEN_DIE_SIDES = 6;

export const FIRST_PLAYER_INDEX = 0;

export const DEFAULT_PLAYER_COUNT = 2;

export const BOARD_PLACEHOLDER = {
  renderer: {
    maxPixelRatio: 2,
    shadowMapSize: 1024,
  },
  animation: {
    swaySpeed: 0.00018,
    swayAmount: 0.025,
  },
  fog: {
    near: 14,
    far: 32,
  },
  camera: {
    fov: 42,
    near: 0.1,
    far: 100,
    position: {
      x: 0,
      y: 11,
      z: 12,
    },
  },
  table: {
    width: 14,
    depth: 10,
    height: 0.35,
    y: -0.34,
  },
  island: {
    radius: 4.2,
    height: 0.35,
    segments: 48,
    scaleX: 1.25,
    scaleZ: 0.82,
  },
  grass: {
    radiusScaleTop: 0.72,
    radiusScaleBottom: 0.76,
    height: 0.08,
    x: -0.3,
    y: 0.23,
    z: -0.08,
    scaleX: 1.18,
    scaleZ: 0.72,
  },
  spaces: {
    radius: 0.36,
    height: 0.14,
    segments: 28,
    y: 0.38,
  },
  connections: {
    radius: 0.055,
    y: 0.34,
  },
  rim: {
    radiusScale: 0.82,
    tubeRadius: 0.025,
    radialSegments: 8,
    tubularSegments: 32,
    y: 0.085,
  },
  markers: {
    y: 0.18,
    coinRadius: 0.14,
    coinHeight: 0.05,
    treasureWidth: 0.26,
    treasureHeight: 0.16,
    treasureDepth: 0.2,
    treasureRotationY: 0.4,
    trapRadius: 0.16,
    trapHeight: 0.28,
    trapSegments: 4,
    trapYExtra: 0.04,
    eventRadius: 0.17,
    eventFloatAmount: 0.015,
    actionWidth: 0.28,
    actionHeight: 0.07,
    actionDepth: 0.08,
  },
  rotations: {
    flatMarkerX: Math.PI / 2,
    trapY: Math.PI / 4,
  },
  materials: {
    table: {
      roughness: 0.72,
      metalness: 0.05,
    },
    island: {
      roughness: 0.86,
      metalness: 0,
    },
    grass: {
      roughness: 0.9,
      metalness: 0,
    },
    space: {
      roughness: 0.58,
      metalness: 0.02,
    },
    rim: {
      roughness: 0.52,
      metalness: 0.08,
    },
    coin: {
      roughness: 0.36,
      metalness: 0.28,
    },
    treasure: {
      roughness: 0.42,
      metalness: 0.16,
    },
    trap: {
      roughness: 0.48,
      metalness: 0.04,
    },
    event: {
      roughness: 0.22,
      metalness: 0.12,
    },
    action: {
      roughness: 0.46,
      metalness: 0.1,
    },
    connection: {
      roughness: 0.72,
      metalness: 0.02,
    },
  },
  lights: {
    ambientIntensity: 2.1,
    keyIntensity: 2.6,
    keyPosition: {
      x: -4,
      y: 8,
      z: 6,
    },
    fillIntensity: 0.9,
    fillPosition: {
      x: 5,
      y: 4,
      z: -3,
    },
  },
} as const;
