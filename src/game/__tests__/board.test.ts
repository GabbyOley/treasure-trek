import { describe, expect, it } from "vitest";

import { BOARD_SPACES, START_SPACE_ID, type BoardSpaceType } from "../board";

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
});
