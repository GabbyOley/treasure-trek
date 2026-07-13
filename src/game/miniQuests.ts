export type MiniQuestId =
  | "gold-mine"
  | "fishing-spot"
  | "monkey-business"
  | "buried-treasure"
  | "hidden-cave";

export type MiniQuest = {
  id: MiniQuestId;
  name: string;
};

export const MINI_QUESTS = [
  {
    id: "gold-mine",
    name: "Gold Mine",
  },
  {
    id: "fishing-spot",
    name: "Fishing Spot",
  },
  {
    id: "monkey-business",
    name: "Monkey Business",
  },
  {
    id: "buried-treasure",
    name: "Buried Treasure",
  },
  {
    id: "hidden-cave",
    name: "Hidden Cave",
  },
] as const satisfies readonly MiniQuest[];

export function getMiniQuest(miniQuestId: MiniQuestId): MiniQuest {
  return (
    MINI_QUESTS.find((miniQuest) => miniQuest.id === miniQuestId) ?? MINI_QUESTS[0]
  );
}
