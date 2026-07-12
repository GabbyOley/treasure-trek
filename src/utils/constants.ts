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
  path: [
    { x: -4.2, z: 1.7, type: "blank" },
    { x: -3.25, z: 0.85, type: "coin" },
    { x: -2.1, z: 0.35, type: "event" },
    { x: -0.85, z: 0.95, type: "blank" },
    { x: 0.25, z: 0.2, type: "trap" },
    { x: 1.35, z: -0.45, type: "coin" },
    { x: 2.55, z: -0.1, type: "event" },
    { x: 3.55, z: -0.85, type: "treasure" },
  ],
} as const;
