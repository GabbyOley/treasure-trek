import { describe, expect, it } from "vitest";

import {
  BOARD_SPACES,
  FINISH_SPACE_ID,
  START_SPACE_ID,
  type BoardRegion,
  type BoardSpaceType,
} from "../board";
import { MINI_QUESTS } from "../miniQuests";
import { SHOPS } from "../shops";

const REQUIRED_SPACE_TYPES: BoardSpaceType[] = [
  "blank",
  "coin",
  "treasure",
  "trap",
  "event",
  "action",
  "goldenKey",
  "finish",
];

const REQUIRED_REGIONS: BoardRegion[] = [
  "Campground",
  "Cave",
  "Volcano",
  "Field",
  "Waterfall",
  "Swamp",
  "Cliff",
  "Jungle",
  "Deep Jungle",
  "Meadow",
  "Pond",
  "River",
  "Shipwreck",
  "Finish",
];

describe("board data", () => {
  it("has unique space IDs", () => {
    const ids = BOARD_SPACES.map((space) => space.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has a start space", () => {
    expect(BOARD_SPACES.some((space) => space.id === START_SPACE_ID)).toBe(true);
  });

  it("has a valid Finish space", () => {
    const finishSpace = BOARD_SPACES.find((space) => space.id === FINISH_SPACE_ID);

    expect(finishSpace).toMatchObject({
      id: FINISH_SPACE_ID,
      name: "Finish",
      type: "finish",
      nextSpaceIds: [],
    });
  });

  it("has a Golden Key space", () => {
    const goldenKeySpace = BOARD_SPACES.find((space) => space.type === "goldenKey");

    expect(goldenKeySpace).toMatchObject({
      id: "river-5",
      name: "Golden Key Sandbar",
      region: "River",
    });
  });

  it("only connects to existing spaces", () => {
    const ids = new Set(BOARD_SPACES.map((space) => space.id));
    const missingConnections = BOARD_SPACES.flatMap((space) =>
      space.nextSpaceIds.filter((nextSpaceId) => !ids.has(nextSpaceId)),
    );

    expect(missingConnections).toEqual([]);
  });

  it("Finish is reachable from Start", () => {
    const spacesById = new Map(BOARD_SPACES.map((space) => [space.id, space]));
    const visited = new Set<string>();
    const queue = [START_SPACE_ID];

    while (queue.length > 0) {
      const spaceId = queue.shift();

      if (spaceId === undefined || visited.has(spaceId)) {
        continue;
      }

      visited.add(spaceId);
      spacesById.get(spaceId)?.nextSpaceIds.forEach((nextSpaceId) => {
        queue.push(nextSpaceId);
      });
    }

    expect(visited.has(FINISH_SPACE_ID)).toBe(true);
  });

  it("has a larger prototype-board space count", () => {
    expect(BOARD_SPACES.length).toBeGreaterThanOrEqual(60);
    expect(BOARD_SPACES.length).toBeLessThanOrEqual(90);
  });

  it("includes every required island region", () => {
    const regions = new Set(BOARD_SPACES.map((space) => space.region));

    REQUIRED_REGIONS.forEach((region) => {
      expect(regions.has(region)).toBe(true);
    });
  });

  it("has multiple branching spaces", () => {
    const branchingSpaces = BOARD_SPACES.filter((space) => space.nextSpaceIds.length > 1);

    expect(branchingSpaces.length).toBeGreaterThanOrEqual(3);
  });

  it("has multiple reconnect points", () => {
    const incomingCounts = new Map<string, number>();

    BOARD_SPACES.forEach((space) => {
      space.nextSpaceIds.forEach((nextSpaceId) => {
        incomingCounts.set(nextSpaceId, (incomingCounts.get(nextSpaceId) ?? 0) + 1);
      });
    });

    const reconnectPoints = [...incomingCounts.values()].filter((count) => count > 1);

    expect(reconnectPoints.length).toBeGreaterThanOrEqual(3);
  });

  it("offers a final three-way Meadow, Pond, or River choice", () => {
    const finalChoice = BOARD_SPACES.find((space) => space.id === "final-choice");

    expect(finalChoice?.nextSpaceIds).toEqual(["meadow-1", "pond-1", "river-1"]);
  });

  it("River reaches Shipwreck before Finish", () => {
    const spacesById = new Map(BOARD_SPACES.map((space) => [space.id, space]));
    const queue: { spaceId: string; hasReachedShipwreck: boolean }[] = [
      { spaceId: "river-1", hasReachedShipwreck: false },
    ];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const route = queue.shift();

      if (route === undefined) {
        continue;
      }

      const visitKey = `${route.spaceId}:${String(route.hasReachedShipwreck)}`;

      if (visited.has(visitKey)) {
        continue;
      }

      visited.add(visitKey);

      if (route.spaceId === FINISH_SPACE_ID && route.hasReachedShipwreck) {
        expect(route.hasReachedShipwreck).toBe(true);
        return;
      }

      const space = spacesById.get(route.spaceId);

      space?.nextSpaceIds.forEach((nextSpaceId) => {
        queue.push({
          spaceId: nextSpaceId,
          hasReachedShipwreck:
            route.hasReachedShipwreck || nextSpaceId.startsWith("shipwreck-"),
        });
      });
    }

    throw new Error("River did not reach Finish through Shipwreck.");
  });

  it("contains every required space type", () => {
    const types = new Set(BOARD_SPACES.map((space) => space.type));

    REQUIRED_SPACE_TYPES.forEach((type) => {
      expect(types.has(type)).toBe(true);
    });
  });

  it("Action spaces can reference valid mini-quest IDs", () => {
    const miniQuestIds = new Set(MINI_QUESTS.map((miniQuest) => miniQuest.id));
    const invalidMiniQuestIds = BOARD_SPACES.flatMap((space) =>
      space.miniQuestId !== undefined && !miniQuestIds.has(space.miniQuestId)
        ? [space.miniQuestId]
        : [],
    );

    expect(invalidMiniQuestIds).toEqual([]);
  });

  it("every assigned mini-quest ID on the board exists in the catalog", () => {
    const miniQuestIds = new Set(MINI_QUESTS.map((miniQuest) => miniQuest.id));
    const assignedMiniQuestIds = BOARD_SPACES.flatMap((space) =>
      space.miniQuestId === undefined ? [] : [space.miniQuestId],
    );

    expect(assignedMiniQuestIds.length).toBeGreaterThan(0);
    assignedMiniQuestIds.forEach((miniQuestId) => {
      expect(miniQuestIds.has(miniQuestId)).toBe(true);
    });
  });

  it("board shop references point to valid shop IDs", () => {
    const shopIds = new Set(SHOPS.map((shop) => shop.id));
    const assignedShopIds = BOARD_SPACES.flatMap((space) =>
      space.shopId === undefined ? [] : [space.shopId],
    );
    const invalidShopIds = assignedShopIds.filter((shopId) => !shopIds.has(shopId));

    expect(assignedShopIds.length).toBeGreaterThanOrEqual(2);
    expect(invalidShopIds).toEqual([]);
  });
});
