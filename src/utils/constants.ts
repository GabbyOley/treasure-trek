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

export const INITIAL_PLAYER_COINS = 0;

export const COIN_SPACE_REWARD = 10;

export const TRAP_COIN_LOSS = 20;

export const EVENT_COIN_REWARD = 20;

export const CARD_FIXED_MOVE_STEPS = 2;

export const MINI_QUEST_SMALL_COIN_REWARD = 10;

export const MINI_QUEST_MEDIUM_COIN_REWARD = 20;

export const MINI_QUEST_LARGE_COIN_REWARD = 40;

export const MINI_QUEST_COIN_LOSS = 10;

export const SHOP_PURCHASE_PRICE = 40;

// Finish placement and Golden Key bonuses are unresolved, so v1 awards no finish bonus.
export const FINISH_BONUS_V1 = 0;

export const GOLDEN_KEY_FINISH_BONUS = 100;

export const GOLD_MINE_MEDIUM_REWARD_MIN_ROLL = 4;

export const GOLD_MINE_LARGE_REWARD_ROLL = 6;

export const BURIED_TREASURE_TWO_CARD_MIN_ROLL = 5;

export const HIDDEN_CAVE_TRAP_MAX_ROLL = 3;

export const EVEN_ROLL_DIVISOR = 2;

export const EVEN_ROLL_REMAINDER = 0;

export const MAX_TREASURE_HAND_SIZE = 3;

export const TREASURE_RESALE_VALUES = {
  compass: 10,
  shop: 10,
  aid: 20,
  timeMachine: 20,
  shovel: 20,
  crab: 30,
  whistle: 50,
} as const;

export const BOARD_POSITION_HINTS = {
  start: { x: 0, z: 0 },
  campCoin: { x: 2, z: 0 },
  campBlank: { x: 4, z: 0 },
  campEvent: { x: 6, z: 0 },
  campFork: { x: 8, z: 0 },
  fieldEntry: { x: 10, z: 1 },
  fieldAction: { x: 12, z: 1 },
  fieldEvent: { x: 14, z: 1 },
  fieldCoin: { x: 16, z: 1 },
  fieldBlank: { x: 18, z: 1 },
  caveMouth: { x: 10, z: -1 },
  caveCoin: { x: 12, z: -1 },
  caveTrap: { x: 14, z: -1 },
  caveTreasure: { x: 16, z: -1 },
  volcanoAction: { x: 18, z: -1 },
  caveEvent: { x: 20, z: -1 },
  rejoinBridge: { x: 22, z: 0 },
  lookoutBlank: { x: 24, z: 0 },
  swampAction: { x: 26, z: 0 },
  cliffShop: { x: 28, z: 0 },
  jungleEntry: { x: 30, z: 0 },
  jungleCoin: { x: 32, z: 0 },
  jungleFork: { x: 34, z: 0 },
  jungleEvent: { x: 36, z: 0.85 },
  jungleCoin2: { x: 38, z: 0.85 },
  cliff1: { x: 36, z: -0.85 },
  cliffTrap: { x: 38, z: -0.85 },
  deepJungle2: { x: 40, z: -0.85 },
  jungleRejoin: { x: 42, z: 0 },
  finalChoice: { x: 44, z: 0 },
  meadow1: { x: 48, z: 1.25 },
  meadow2: { x: 54, z: 1.25 },
  pond1: { x: 48, z: 0 },
  pond2: { x: 51, z: 0 },
  pond3: { x: 54, z: 0 },
  river1: { x: 48, z: -1.25 },
  river2: { x: 50, z: -1.25 },
  river3: { x: 52, z: -1.25 },
  river4: { x: 54, z: -1.25 },
  river5: { x: 56, z: -1.25 },
  shipwreck1: { x: 58, z: -1.25 },
  shipwreck2: { x: 60, z: -1.25 },
  shipwreck3: { x: 62, z: -1.25 },
  finishGate: { x: 64, z: 0 },
  finish: { x: 66, z: 0 },
} as const;

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
    near: 18,
    far: 42,
  },
  camera: {
    fov: 46,
    near: 0.1,
    far: 100,
    position: {
      x: 0,
      y: 15,
      z: 15,
    },
  },
  table: {
    width: 18,
    depth: 13,
    height: 0.35,
    y: -0.34,
  },
  island: {
    radius: 5.7,
    height: 0.35,
    segments: 48,
    scaleX: 1.28,
    scaleZ: 0.92,
  },
  grass: {
    radiusScaleTop: 0.72,
    radiusScaleBottom: 0.76,
    height: 0.08,
    x: 0.05,
    y: 0.23,
    z: -0.08,
    scaleX: 1.24,
    scaleZ: 0.82,
  },
  spaces: {
    radius: 0.3,
    height: 0.14,
    segments: 28,
    y: 0.38,
  },
  player: {
    radius: 0.18,
    height: 0.52,
    segments: 24,
    y: 0.86,
    stepMs: 180,
    activeScale: 1.14,
    inactiveScale: 0.92,
    activeRingRadius: 0.3,
    activeRingTubeRadius: 0.025,
    activeRingY: -0.34,
    colors: [PALETTE.gold, PALETTE.tide],
    fallbackOffset: { x: 0, z: 0 },
    offsets: [
      { x: -0.12, z: -0.12 },
      { x: 0.12, z: 0.12 },
    ],
  },
  choiceHighlight: {
    radius: 0.48,
    tubeRadius: 0.035,
    radialSegments: 8,
    tubularSegments: 32,
    y: 0.18,
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
    finishRadius: 0.18,
    finishHeight: 0.34,
    finishSegments: 5,
    finishYExtra: 0.04,
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
    player: {
      roughness: 0.34,
      metalness: 0.18,
    },
    choiceHighlight: {
      roughness: 0.2,
      metalness: 0.2,
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
