import { BOARD_POSITION_HINTS } from "../utils/constants";
import type { MiniQuestId } from "./miniQuests";

export type BoardSpaceType =
  | "blank"
  | "coin"
  | "treasure"
  | "trap"
  | "event"
  | "action";

export type BoardRegion = "Campground" | "Field" | "Cave";

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
};

export const START_SPACE_ID = "start";

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
    nextSpaceIds: ["cave-event"],
    position: BOARD_POSITION_HINTS.caveTreasure,
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
    miniQuestId: "fishing-spot",
  },
  {
    id: "lookout-blank",
    name: "Lookout Trail",
    type: "action",
    region: "Field",
    risk: "quest",
    nextSpaceIds: ["lookout-coin"],
    position: BOARD_POSITION_HINTS.lookoutBlank,
    miniQuestId: "monkey-business",
  },
  {
    id: "lookout-coin",
    name: "Old Marker",
    type: "coin",
    region: "Field",
    risk: "quest",
    nextSpaceIds: ["lookout-event"],
    position: BOARD_POSITION_HINTS.lookoutCoin,
  },
  {
    id: "lookout-event",
    name: "Windy Ridge",
    type: "event",
    region: "Field",
    risk: "quest",
    nextSpaceIds: ["slice-end"],
    position: BOARD_POSITION_HINTS.lookoutEvent,
  },
  {
    id: "slice-end",
    name: "Map Edge",
    type: "treasure",
    region: "Field",
    risk: "quest",
    nextSpaceIds: [],
    position: BOARD_POSITION_HINTS.sliceEnd,
  },
];

export function getBoardSpace(spaceId: string): BoardSpace | undefined {
  return BOARD_SPACES.find((space) => space.id === spaceId);
}
