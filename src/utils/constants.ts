export const PALETTE = {
  midnight: 0x0b2239,
  deepSea: 0x12395b,
  tide: 0x2b6c7e,
  jungle: 0x2f5d50,
  meadow: 0x6f9f5d,
  swamp: 0x4d6b45,
  rock: 0x5f5c55,
  lava: 0xd94f2f,
  foam: 0xbfe7df,
  wood: 0x6f4427,
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
  meadow: "#6f9f5d",
  swamp: "#4d6b45",
  rock: "#5f5c55",
  lava: "#d94f2f",
  foam: "#bfe7df",
  wood: "#6f4427",
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
  start: { x: -7.4, z: -2.6 },
  campCoin: { x: -6.65, z: -2.05 },
  campBlank: { x: -5.85, z: -1.55 },
  campEvent: { x: -5.15, z: -0.95 },
  campFork: { x: -4.3, z: -0.25 },
  fieldEntry: { x: -3.55, z: 0.85 },
  fieldAction: { x: -2.75, z: 1.75 },
  fieldEvent: { x: -1.65, z: 2.1 },
  fieldCoin: { x: -0.55, z: 1.75 },
  fieldBlank: { x: 0.25, z: 0.95 },
  caveMouth: { x: -3.55, z: -1.4 },
  caveCoin: { x: -2.6, z: -2.25 },
  caveTrap: { x: -1.45, z: -2.55 },
  caveTreasure: { x: -0.25, z: -2.2 },
  caveEvent: { x: 0.6, z: -1.35 },
  rejoinBridge: { x: 1.25, z: 0.2 },
  lookoutBlank: { x: 2.15, z: 0.85 },
  lookoutCoin: { x: 2.95, z: 1.55 },
  lookoutEvent: { x: 3.55, z: 2.35 },
  sliceEnd: { x: 3.0, z: 3.35 },
  volcanoAsh: { x: 2.0, z: 4.0 },
  volcanoCoin: { x: 0.8, z: 4.25 },
  volcanoTrap: { x: -0.45, z: 4.05 },
  volcanoAction: { x: -1.35, z: 3.35 },
  volcanoEvent: { x: -2.05, z: 2.45 },
  waterfallFork: { x: -3.0, z: 1.55 },
  waterfall1: { x: -4.15, z: 1.9 },
  waterfall2: { x: -5.25, z: 2.5 },
  waterfall3: { x: -6.25, z: 3.15 },
  waterfall4: { x: -6.8, z: 4.05 },
  waterfall5: { x: -5.8, z: 4.6 },
  swampEntry: { x: -3.65, z: 0.55 },
  swampCoin: { x: -4.65, z: -0.05 },
  swampTrap: { x: -5.25, z: -0.95 },
  swampAction: { x: -4.75, z: -1.95 },
  swampRejoin: { x: -3.55, z: -2.35 },
  cliff1: { x: -2.4, z: -3.05 },
  cliffEvent: { x: -1.15, z: -3.5 },
  cliffTrap: { x: 0.15, z: -3.45 },
  cliffShop: { x: 1.25, z: -2.8 },
  jungleEntry: { x: 2.5, z: -2.65 },
  jungleCoin: { x: 3.55, z: -2.0 },
  jungleFork: { x: 4.35, z: -1.1 },
  deepJungle1: { x: 5.45, z: -1.85 },
  deepJungle2: { x: 6.45, z: -2.15 },
  deepJungle3: { x: 7.25, z: -1.45 },
  deepJungle4: { x: 7.05, z: -0.35 },
  jungleEvent: { x: 5.15, z: -0.1 },
  jungleCoin2: { x: 5.75, z: 0.75 },
  jungleRejoin: { x: 5.2, z: 1.65 },
  finalChoice: { x: 4.25, z: 2.55 },
  meadow1: { x: 3.0, z: 3.35 },
  meadow2: { x: 1.75, z: 3.95 },
  pond1: { x: 4.55, z: 3.75 },
  pond2: { x: 5.25, z: 4.6 },
  pond3: { x: 4.15, z: 5.15 },
  river1: { x: 5.45, z: 2.4 },
  river2: { x: 6.55, z: 2.1 },
  river3: { x: 7.45, z: 2.75 },
  river4: { x: 7.7, z: 3.8 },
  river5: { x: 6.9, z: 4.65 },
  shipwreck1: { x: 6.0, z: 5.45 },
  shipwreck2: { x: 4.75, z: 5.9 },
  shipwreck3: { x: 3.45, z: 5.65 },
  finishGate: { x: 2.35, z: 4.85 },
  finish: { x: 1.15, z: 4.55 },
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
    fov: 44,
    near: 0.1,
    far: 100,
    position: {
      x: 0,
      y: 18,
      z: 17,
    },
  },
  ocean: {
    radius: 14,
    height: 0.12,
    y: -0.24,
    segments: 96,
  },
  terrainShape: [
    { x: -8.4, z: -3.3 },
    { x: -7.3, z: -4.55 },
    { x: -5.15, z: -4.85 },
    { x: -2.6, z: -4.5 },
    { x: -0.35, z: -4.95 },
    { x: 2.45, z: -4.25 },
    { x: 5.15, z: -3.35 },
    { x: 7.75, z: -2.25 },
    { x: 8.65, z: -0.2 },
    { x: 8.85, z: 2.25 },
    { x: 7.95, z: 4.65 },
    { x: 5.95, z: 6.25 },
    { x: 3.35, z: 6.55 },
    { x: 1.0, z: 5.75 },
    { x: -1.35, z: 5.55 },
    { x: -3.95, z: 5.25 },
    { x: -6.75, z: 4.75 },
    { x: -7.85, z: 3.0 },
    { x: -8.35, z: 0.55 },
  ],
  island: {
    height: 0.38,
    y: -0.08,
    bevelSize: 0.16,
    bevelSegments: 2,
  },
  grass: {
    scale: 0.82,
    height: 0.08,
    y: 0.28,
  },
  spaces: {
    radius: 0.25,
    height: 0.14,
    segments: 28,
    y: 0.52,
  },
  player: {
    radius: 0.18,
    height: 0.52,
    segments: 24,
    y: 1,
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
    radius: 0.045,
    y: 0.48,
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
  labels: {
    y: 0.9,
    width: 1.4,
    height: 0.38,
    font: "700 28px Palatino Linotype, Georgia, serif",
    shadowBlur: 10,
    textureWidth: 280,
    textureHeight: 76,
    anchors: {
      Campground: { x: -6.25, z: -2.9 },
      Cave: { x: -1.65, z: -3.05 },
      Volcano: { x: 0.7, z: 4.75 },
      Field: { x: -1.35, z: 2.55 },
      Waterfall: { x: -6.05, z: 3.75 },
      Swamp: { x: -5.7, z: -1.65 },
      Cliff: { x: -0.45, z: -4.05 },
      Jungle: { x: 4.85, z: -2.55 },
      "Deep Jungle": { x: 6.65, z: -0.95 },
      Meadow: { x: 2.45, z: 4.55 },
      Pond: { x: 5.1, z: 5.35 },
      River: { x: 7.15, z: 3.15 },
      Shipwreck: { x: 5.1, z: 6.25 },
      Finish: { x: 1.0, z: 5.15 },
    },
  },
  landmarks: {
    y: 0.54,
    treeHeight: 0.42,
    treeRadius: 0.16,
    tentWidth: 0.48,
    tentHeight: 0.34,
    campfireRadius: 0.1,
    rockRadius: 0.32,
    volcanoRadius: 0.62,
    volcanoHeight: 0.95,
    waterWidth: 0.32,
    waterHeight: 0.05,
    reedHeight: 0.34,
    flowerRadius: 0.055,
    shipWidth: 0.88,
    shipHeight: 0.2,
    dockWidth: 0.72,
    dockDepth: 0.28,
  },
  rotations: {
    flatTerrainX: -Math.PI / 2,
    flatMarkerX: Math.PI / 2,
    trapY: Math.PI / 4,
  },
  materials: {
    ocean: {
      roughness: 0.44,
      metalness: 0.08,
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
