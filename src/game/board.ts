import { BOARD_POSITION_HINTS } from "../utils/constants";
import type { MiniQuestId } from "./miniQuests";
import type { ShopId } from "./shops";

export type BoardSpaceType =
  | "blank"
  | "coin"
  | "treasure"
  | "trap"
  | "event"
  | "action"
  | "golden-key"
  | "finish";

export type BoardRegion =
  | "Campground"
  | "Cave"
  | "Volcano"
  | "Field"
  | "Waterfall"
  | "Swamp"
  | "Cliff"
  | "Jungle"
  | "Deep Jungle"
  | "Meadow"
  | "Pond"
  | "River"
  | "Shipwreck"
  | "Finish";

export type BoardRisk = "safe" | "quest" | "danger";

export type BoardPositionHint = {
  x: number;
  z: number;
};

export type BoardSpace = {
  id: string;
  name: string;
  type: BoardSpaceType;
  region: BoardRegion;
  risk: BoardRisk;
  nextSpaceIds: string[];
  position: BoardPositionHint;
  miniQuestId?: MiniQuestId;
  shopId?: ShopId;
};

export const START_SPACE_ID = "start";
export const FINISH_SPACE_ID = "finish";

export const BOARD_SPACES: readonly BoardSpace[] = [
  {
    id: START_SPACE_ID,
    name: "Start Camp",
    type: "blank",
    region: "Campground",
    risk: "safe",
    nextSpaceIds: ["camp-coin"],
    position: BOARD_POSITION_HINTS.start,
  },
  {
    id: "camp-coin",
    name: "Supply Stump",
    type: "coin",
    region: "Campground",
    risk: "safe",
    nextSpaceIds: ["camp-blank"],
    position: BOARD_POSITION_HINTS.campCoin,
  },
  {
    id: "camp-blank",
    name: "Quiet Trail",
    type: "blank",
    region: "Campground",
    risk: "safe",
    nextSpaceIds: ["camp-event"],
    position: BOARD_POSITION_HINTS.campBlank,
  },
  {
    id: "camp-event",
    name: "Trail Sign",
    type: "event",
    region: "Campground",
    risk: "safe",
    nextSpaceIds: ["camp-fork"],
    position: BOARD_POSITION_HINTS.campEvent,
  },
  {
    id: "camp-fork",
    name: "Forked Footpath",
    type: "action",
    region: "Campground",
    risk: "safe",
    nextSpaceIds: ["field-entry", "cave-mouth"],
    position: BOARD_POSITION_HINTS.campFork,
    miniQuestId: "hidden-cave",
  },
  {
    id: "field-entry",
    name: "Field Gate",
    type: "blank",
    region: "Field",
    risk: "quest",
    nextSpaceIds: ["field-action"],
    position: BOARD_POSITION_HINTS.fieldEntry,
  },
  {
    id: "field-action",
    name: "Rolling Challenge",
    type: "action",
    region: "Field",
    risk: "quest",
    nextSpaceIds: ["field-event"],
    position: BOARD_POSITION_HINTS.fieldAction,
    miniQuestId: "gold-mine",
  },
  {
    id: "field-event",
    name: "Tall Grass",
    type: "event",
    region: "Field",
    risk: "quest",
    nextSpaceIds: ["field-coin"],
    position: BOARD_POSITION_HINTS.fieldEvent,
  },
  {
    id: "field-coin",
    name: "Sunlit Cache",
    type: "coin",
    region: "Field",
    risk: "quest",
    nextSpaceIds: ["field-blank"],
    position: BOARD_POSITION_HINTS.fieldCoin,
  },
  {
    id: "field-blank",
    name: "Meadow Bend",
    type: "action",
    region: "Field",
    risk: "quest",
    nextSpaceIds: ["rejoin-bridge"],
    position: BOARD_POSITION_HINTS.fieldBlank,
    miniQuestId: "buried-treasure",
  },
  {
    id: "cave-mouth",
    name: "Cave Mouth",
    type: "trap",
    region: "Cave",
    risk: "danger",
    nextSpaceIds: ["cave-coin"],
    position: BOARD_POSITION_HINTS.caveMouth,
  },
  {
    id: "cave-coin",
    name: "Glittering Wall",
    type: "coin",
    region: "Cave",
    risk: "danger",
    nextSpaceIds: ["cave-trap"],
    position: BOARD_POSITION_HINTS.caveCoin,
  },
  {
    id: "cave-trap",
    name: "Loose Stones",
    type: "trap",
    region: "Cave",
    risk: "danger",
    nextSpaceIds: ["cave-treasure"],
    position: BOARD_POSITION_HINTS.caveTrap,
  },
  {
    id: "cave-treasure",
    name: "Buried Chest",
    type: "treasure",
    region: "Cave",
    risk: "danger",
    nextSpaceIds: ["volcano-action"],
    position: BOARD_POSITION_HINTS.caveTreasure,
  },
  {
    id: "volcano-action",
    name: "Gold Mine",
    type: "action",
    region: "Volcano",
    risk: "danger",
    nextSpaceIds: ["cave-event"],
    position: BOARD_POSITION_HINTS.volcanoAction,
    miniQuestId: "gold-mine",
  },
  {
    id: "cave-event",
    name: "Echo Chamber",
    type: "event",
    region: "Cave",
    risk: "danger",
    nextSpaceIds: ["rejoin-bridge"],
    position: BOARD_POSITION_HINTS.caveEvent,
  },
  {
    id: "rejoin-bridge",
    name: "Rope Bridge",
    type: "action",
    region: "Field",
    risk: "quest",
    nextSpaceIds: ["lookout-blank"],
    position: BOARD_POSITION_HINTS.rejoinBridge,
    shopId: "trail-shop",
  },
  {
    id: "lookout-blank",
    name: "Swamp Crossing",
    type: "trap",
    region: "Swamp",
    risk: "danger",
    nextSpaceIds: ["swamp-action"],
    position: BOARD_POSITION_HINTS.lookoutBlank,
  },
  {
    id: "swamp-action",
    name: "Fishing Spot",
    type: "action",
    region: "Swamp",
    risk: "danger",
    nextSpaceIds: ["cliff-shop"],
    position: BOARD_POSITION_HINTS.swampAction,
    miniQuestId: "fishing-spot",
  },
  {
    id: "cliff-shop",
    name: "Cliffside Shop",
    type: "action",
    region: "Cliff",
    risk: "danger",
    nextSpaceIds: ["jungle-entry"],
    position: BOARD_POSITION_HINTS.cliffShop,
    shopId: "trail-shop",
  },
  {
    id: "jungle-entry",
    name: "Jungle Gate",
    type: "event",
    region: "Jungle",
    risk: "safe",
    nextSpaceIds: ["jungle-coin"],
    position: BOARD_POSITION_HINTS.jungleEntry,
  },
  {
    id: "jungle-coin",
    name: "Fruit Cache",
    type: "coin",
    region: "Jungle",
    risk: "safe",
    nextSpaceIds: ["jungle-fork"],
    position: BOARD_POSITION_HINTS.jungleCoin,
  },
  {
    id: "jungle-fork",
    name: "Vine Split",
    type: "event",
    region: "Jungle",
    risk: "safe",
    nextSpaceIds: ["jungle-event", "cliff-1"],
    position: BOARD_POSITION_HINTS.jungleFork,
  },
  {
    id: "cliff-1",
    name: "Cliff Steps",
    type: "trap",
    region: "Cliff",
    risk: "danger",
    nextSpaceIds: ["cliff-trap"],
    position: BOARD_POSITION_HINTS.cliff1,
  },
  {
    id: "cliff-trap",
    name: "Loose Ledge",
    type: "trap",
    region: "Cliff",
    risk: "danger",
    nextSpaceIds: ["deep-jungle-2"],
    position: BOARD_POSITION_HINTS.cliffTrap,
  },
  {
    id: "deep-jungle-2",
    name: "Monkey Business",
    type: "action",
    region: "Jungle",
    risk: "danger",
    nextSpaceIds: ["jungle-rejoin"],
    position: BOARD_POSITION_HINTS.deepJungle2,
    miniQuestId: "monkey-business",
  },
  {
    id: "jungle-event",
    name: "Parrot Path",
    type: "event",
    region: "Jungle",
    risk: "safe",
    nextSpaceIds: ["jungle-coin-2"],
    position: BOARD_POSITION_HINTS.jungleEvent,
  },
  {
    id: "jungle-coin-2",
    name: "Banana Coins",
    type: "coin",
    region: "Jungle",
    risk: "safe",
    nextSpaceIds: ["jungle-rejoin"],
    position: BOARD_POSITION_HINTS.jungleCoin2,
  },
  {
    id: "jungle-rejoin",
    name: "Canopy Clearing",
    type: "blank",
    region: "Jungle",
    risk: "safe",
    nextSpaceIds: ["final-choice"],
    position: BOARD_POSITION_HINTS.jungleRejoin,
  },
  {
    id: "final-choice",
    name: "Three Trails",
    type: "blank",
    region: "Meadow",
    risk: "safe",
    nextSpaceIds: ["meadow-1", "pond-1", "river-1"],
    position: BOARD_POSITION_HINTS.finalChoice,
  },
  {
    id: "meadow-1",
    name: "Soft Meadow",
    type: "blank",
    region: "Meadow",
    risk: "safe",
    nextSpaceIds: ["meadow-2"],
    position: BOARD_POSITION_HINTS.meadow1,
  },
  {
    id: "meadow-2",
    name: "Quiet Flowers",
    type: "event",
    region: "Meadow",
    risk: "safe",
    nextSpaceIds: ["finish-gate"],
    position: BOARD_POSITION_HINTS.meadow2,
  },
  {
    id: "pond-1",
    name: "Pond Bank",
    type: "coin",
    region: "Pond",
    risk: "safe",
    nextSpaceIds: ["pond-2"],
    position: BOARD_POSITION_HINTS.pond1,
  },
  {
    id: "pond-2",
    name: "Lily Coins",
    type: "coin",
    region: "Pond",
    risk: "safe",
    nextSpaceIds: ["pond-3"],
    position: BOARD_POSITION_HINTS.pond2,
  },
  {
    id: "pond-3",
    name: "Fishing Spot",
    type: "action",
    region: "Pond",
    risk: "safe",
    nextSpaceIds: ["finish-gate"],
    position: BOARD_POSITION_HINTS.pond3,
    miniQuestId: "fishing-spot",
  },
  {
    id: "river-1",
    name: "River Bend",
    type: "coin",
    region: "River",
    risk: "danger",
    nextSpaceIds: ["river-2"],
    position: BOARD_POSITION_HINTS.river1,
  },
  {
    id: "river-2",
    name: "Fast Current",
    type: "trap",
    region: "River",
    risk: "danger",
    nextSpaceIds: ["river-3"],
    position: BOARD_POSITION_HINTS.river2,
  },
  {
    id: "river-3",
    name: "River Cache",
    type: "treasure",
    region: "River",
    risk: "danger",
    nextSpaceIds: ["river-4"],
    position: BOARD_POSITION_HINTS.river3,
  },
  {
    id: "river-4",
    name: "Rapids",
    type: "trap",
    region: "River",
    risk: "danger",
    nextSpaceIds: ["river-5"],
    position: BOARD_POSITION_HINTS.river4,
  },
  {
    id: "river-5",
    name: "Golden Key Sandbar",
    type: "golden-key",
    region: "River",
    risk: "danger",
    nextSpaceIds: ["shipwreck-1"],
    position: BOARD_POSITION_HINTS.river5,
  },
  {
    id: "shipwreck-1",
    name: "Shipwreck Bow",
    type: "treasure",
    region: "Shipwreck",
    risk: "danger",
    nextSpaceIds: ["shipwreck-2"],
    position: BOARD_POSITION_HINTS.shipwreck1,
  },
  {
    id: "shipwreck-2",
    name: "Broken Mast",
    type: "event",
    region: "Shipwreck",
    risk: "danger",
    nextSpaceIds: ["shipwreck-3"],
    position: BOARD_POSITION_HINTS.shipwreck2,
  },
  {
    id: "shipwreck-3",
    name: "Captain's Chest",
    type: "treasure",
    region: "Shipwreck",
    risk: "danger",
    nextSpaceIds: ["finish-gate"],
    position: BOARD_POSITION_HINTS.shipwreck3,
  },
  {
    id: "finish-gate",
    name: "Finish Gate",
    type: "blank",
    region: "Finish",
    risk: "safe",
    nextSpaceIds: [FINISH_SPACE_ID],
    position: BOARD_POSITION_HINTS.finishGate,
  },
  {
    id: FINISH_SPACE_ID,
    name: "Finish",
    type: "finish",
    region: "Finish",
    risk: "safe",
    nextSpaceIds: [],
    position: BOARD_POSITION_HINTS.finish,
  },
];

export function getBoardSpace(spaceId: string): BoardSpace | undefined {
  return BOARD_SPACES.find((space) => space.id === spaceId);
}
