import { describe, expect, it } from "vitest";

import { BOARD_SPACES, START_SPACE_ID, type BoardSpaceType } from "../board";
import { MINI_QUESTS } from "../miniQuests";
import { SHOPS } from "../shops";

const REQUIRED_SPACE_TYPES: BoardSpaceType[] = [
  "blank",
  "coin",
  "treasure",
  "trap",
  "event",
  "action",
];

describe("board data", () => {
  it("has unique space IDs", () => {
    const ids = BOARD_SPACES.map((space) => space.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has a start space", () => {
    expect(BOARD_SPACES.some((space) => space.id === START_SPACE_ID)).toBe(true);
  });

  it("only connects to existing spaces", () => {
    const ids = new Set(BOARD_SPACES.map((space) => space.id));
    const missingConnections = BOARD_SPACES.flatMap((space) =>
      space.nextSpaceIds.filter((nextSpaceId) => !ids.has(nextSpaceId)),
    );

    expect(missingConnections).toEqual([]);
  });

  it("has at least one branching space", () => {
    expect(BOARD_SPACES.some((space) => space.nextSpaceIds.length > 1)).toBe(true);
  });

  it("has at least one reconnect point", () => {
    const incomingCounts = new Map<string, number>();

    BOARD_SPACES.forEach((space) => {
      space.nextSpaceIds.forEach((nextSpaceId) => {
        incomingCounts.set(nextSpaceId, (incomingCounts.get(nextSpaceId) ?? 0) + 1);
      });
    });

    expect([...incomingCounts.values()].some((count) => count > 1)).toBe(true);
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

    expect(assignedShopIds.length).toBeGreaterThan(0);
    expect(invalidShopIds).toEqual([]);
  });
});
