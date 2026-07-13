export const PALETTE = {
  midnight: 0x0b2239,
  deepSea: 0x12395b,
  lagoon: 0x1f7894,
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
  lagoon: "#1f7894",
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
  start: { x: -4.8, z: 1.8 },
  campCoin: { x: -3.9, z: 1.1 },
  campBlank: { x: -3, z: 0.7 },
  campEvent: { x: -2.05, z: 1.05 },
  campFork: { x: -1.15, z: 0.25 },
  fieldEntry: { x: -0.15, z: 1.2 },
  fieldAction: { x: 0.95, z: 1.55 },
  fieldEvent: { x: 1.95, z: 1.1 },
  fieldCoin: { x: 2.8, z: 0.45 },
  fieldBlank: { x: 3.3, z: -0.35 },
  caveMouth: { x: -0.25, z: -0.9 },
  caveCoin: { x: 0.7, z: -1.65 },
  caveTrap: { x: 1.75, z: -1.9 },
  caveTreasure: { x: 2.65, z: -1.35 },
  caveEvent: { x: 3.2, z: -1.05 },
  rejoinBridge: { x: 4.05, z: -0.65 },
  lookoutBlank: { x: 4.45, z: 0.15 },
  lookoutCoin: { x: 3.85, z: 0.85 },
  lookoutEvent: { x: 3.05, z: 1.35 },
  sliceEnd: { x: 2.15, z: 1.65 },
  volcanoAsh: { x: 1.2, z: 2.25 },
  volcanoCoin: { x: 0.15, z: 2.55 },
  volcanoTrap: { x: -0.95, z: 2.45 },
  volcanoAction: { x: -1.95, z: 2.05 },
  volcanoEvent: { x: -2.7, z: 1.4 },
  waterfallFork: { x: -3.2, z: 0.55 },
  waterfall1: { x: -4.25, z: 0.25 },
  waterfall2: { x: -5.2, z: 0.7 },
  waterfall3: { x: -5.75, z: 1.55 },
  waterfall4: { x: -5.45, z: 2.45 },
  waterfall5: { x: -4.45, z: 2.85 },
  swampEntry: { x: -3.8, z: -0.45 },
  swampCoin: { x: -4.45, z: -1.25 },
  swampTrap: { x: -4.05, z: -2.1 },
  swampAction: { x: -3.05, z: -2.45 },
  swampRejoin: { x: -2.3, z: -1.85 },
  cliff1: { x: -1.45, z: -2.35 },
  cliffEvent: { x: -0.45, z: -2.55 },
  cliffTrap: { x: 0.55, z: -2.35 },
  cliffShop: { x: 1.25, z: -1.75 },
  jungleEntry: { x: 2.0, z: -2.2 },
  jungleCoin: { x: 2.95, z: -2.35 },
  jungleFork: { x: 3.85, z: -1.9 },
  deepJungle1: { x: 4.65, z: -2.65 },
  deepJungle2: { x: 5.55, z: -2.45 },
  deepJungle3: { x: 6.05, z: -1.65 },
  deepJungle4: { x: 5.75, z: -0.8 },
  jungleEvent: { x: 4.35, z: -1.0 },
  jungleCoin2: { x: 4.95, z: -0.25 },
  jungleRejoin: { x: 4.7, z: 0.65 },
  finalChoice: { x: 3.8, z: 1.15 },
  meadow1: { x: 3.0, z: 2.0 },
  meadow2: { x: 2.05, z: 2.35 },
  pond1: { x: 4.25, z: 2.15 },
  pond2: { x: 4.85, z: 2.85 },
  pond3: { x: 3.95, z: 3.35 },
  river1: { x: 4.75, z: 0.55 },
  river2: { x: 5.7, z: 0.45 },
  river3: { x: 6.35, z: 1.05 },
  river4: { x: 6.55, z: 1.9 },
  river5: { x: 5.95, z: 2.55 },
  shipwreck1: { x: 5.15, z: 3.25 },
  shipwreck2: { x: 4.25, z: 3.95 },
  shipwreck3: { x: 3.15, z: 3.75 },
  finishGate: { x: 2.25, z: 3.25 },
  finish: { x: 1.25, z: 3.0 },
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
  ocean: {
    radius: 11.5,
    height: 0.08,
    y: -0.5,
    segments: 96,
    scaleX: 1.12,
    scaleZ: 0.86,
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
    ocean: {
      roughness: 0.58,
      metalness: 0.02,
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
