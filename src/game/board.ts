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
};

export const START_SPACE_ID = "start";

export const BOARD_SPACES = [
  {
    id: START_SPACE_ID,
    name: "Start Camp",
    type: "blank",
    region: "Campground",
    risk: "safe",
    nextSpaceIds: ["camp-coin"],
    position: { x: -4.8, z: 1.8 },
  },
  {
    id: "camp-coin",
    name: "Supply Stump",
    type: "coin",
    region: "Campground",
    risk: "safe",
    nextSpaceIds: ["camp-blank"],
    position: { x: -3.9, z: 1.1 },
  },
  {
    id: "camp-blank",
    name: "Quiet Trail",
    type: "blank",
    region: "Campground",
    risk: "safe",
    nextSpaceIds: ["camp-event"],
    position: { x: -3, z: 0.7 },
  },
  {
    id: "camp-event",
    name: "Trail Sign",
    type: "event",
    region: "Campground",
    risk: "safe",
    nextSpaceIds: ["camp-fork"],
    position: { x: -2.05, z: 1.05 },
  },
  {
    id: "camp-fork",
    name: "Forked Footpath",
    type: "action",
    region: "Campground",
    risk: "safe",
    nextSpaceIds: ["field-entry", "cave-mouth"],
    position: { x: -1.15, z: 0.25 },
  },
  {
    id: "field-entry",
    name: "Field Gate",
    type: "blank",
    region: "Field",
    risk: "quest",
    nextSpaceIds: ["field-action"],
    position: { x: -0.15, z: 1.2 },
  },
  {
    id: "field-action",
    name: "Rolling Challenge",
    type: "action",
    region: "Field",
    risk: "quest",
    nextSpaceIds: ["field-event"],
    position: { x: 0.95, z: 1.55 },
  },
  {
    id: "field-event",
    name: "Tall Grass",
    type: "event",
    region: "Field",
    risk: "quest",
    nextSpaceIds: ["field-coin"],
    position: { x: 1.95, z: 1.1 },
  },
  {
    id: "field-coin",
    name: "Sunlit Cache",
    type: "coin",
    region: "Field",
    risk: "quest",
    nextSpaceIds: ["field-blank"],
    position: { x: 2.8, z: 0.45 },
  },
  {
    id: "field-blank",
    name: "Meadow Bend",
    type: "blank",
    region: "Field",
    risk: "quest",
    nextSpaceIds: ["rejoin-bridge"],
    position: { x: 3.3, z: -0.35 },
  },
  {
    id: "cave-mouth",
    name: "Cave Mouth",
    type: "trap",
    region: "Cave",
    risk: "danger",
    nextSpaceIds: ["cave-coin"],
    position: { x: -0.25, z: -0.9 },
  },
  {
    id: "cave-coin",
    name: "Glittering Wall",
    type: "coin",
    region: "Cave",
    risk: "danger",
    nextSpaceIds: ["cave-trap"],
    position: { x: 0.7, z: -1.65 },
  },
  {
    id: "cave-trap",
    name: "Loose Stones",
    type: "trap",
    region: "Cave",
    risk: "danger",
    nextSpaceIds: ["cave-treasure"],
    position: { x: 1.75, z: -1.9 },
  },
  {
    id: "cave-treasure",
    name: "Buried Chest",
    type: "treasure",
    region: "Cave",
    risk: "danger",
    nextSpaceIds: ["cave-event"],
    position: { x: 2.65, z: -1.35 },
  },
  {
    id: "cave-event",
    name: "Echo Chamber",
    type: "event",
    region: "Cave",
    risk: "danger",
    nextSpaceIds: ["rejoin-bridge"],
    position: { x: 3.2, z: -1.05 },
  },
  {
    id: "rejoin-bridge",
    name: "Rope Bridge",
    type: "action",
    region: "Field",
    risk: "quest",
    nextSpaceIds: ["lookout-blank"],
    position: { x: 4.05, z: -0.65 },
  },
  {
    id: "lookout-blank",
    name: "Lookout Trail",
    type: "blank",
    region: "Field",
    risk: "quest",
    nextSpaceIds: ["lookout-coin"],
    position: { x: 4.45, z: 0.15 },
  },
  {
    id: "lookout-coin",
    name: "Old Marker",
    type: "coin",
    region: "Field",
    risk: "quest",
    nextSpaceIds: ["lookout-event"],
    position: { x: 3.85, z: 0.85 },
  },
  {
    id: "lookout-event",
    name: "Windy Ridge",
    type: "event",
    region: "Field",
    risk: "quest",
    nextSpaceIds: ["slice-end"],
    position: { x: 3.05, z: 1.35 },
  },
  {
    id: "slice-end",
    name: "Map Edge",
    type: "treasure",
    region: "Field",
    risk: "quest",
    nextSpaceIds: [],
    position: { x: 2.15, z: 1.65 },
  },
] as const satisfies readonly BoardSpace[];

export function getBoardSpace(spaceId: string): BoardSpace | undefined {
  return BOARD_SPACES.find((space) => space.id === spaceId);
}
