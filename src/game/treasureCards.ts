import { TREASURE_RESALE_VALUES } from "../utils/constants";
import { stepSeededRng } from "./rng";

export type TreasureCardId =
  | "compass"
  | "shop"
  | "aid"
  | "time-machine"
  | "shovel"
  | "crab"
  | "whistle";

export type TreasureCard = {
  id: TreasureCardId;
  name: string;
  resaleValue: number;
};

export type TreasureCardDraw = {
  card: TreasureCard;
  nextSeed: number;
};

export const TREASURE_CARDS = [
  {
    id: "compass",
    name: "Compass",
    resaleValue: TREASURE_RESALE_VALUES.compass,
  },
  {
    id: "shop",
    name: "Shop",
    resaleValue: TREASURE_RESALE_VALUES.shop,
  },
  {
    id: "aid",
    name: "Aid",
    resaleValue: TREASURE_RESALE_VALUES.aid,
  },
  {
    id: "time-machine",
    name: "Time Machine",
    resaleValue: TREASURE_RESALE_VALUES.timeMachine,
  },
  {
    id: "shovel",
    name: "Shovel",
    resaleValue: TREASURE_RESALE_VALUES.shovel,
  },
  {
    id: "crab",
    name: "Crab",
    resaleValue: TREASURE_RESALE_VALUES.crab,
  },
  {
    id: "whistle",
    name: "Whistle",
    resaleValue: TREASURE_RESALE_VALUES.whistle,
  },
] as const satisfies readonly TreasureCard[];

export function drawTreasureCard(seed: number): TreasureCardDraw {
  const step = stepSeededRng(seed);
  const cardIndex = Math.floor(step.value * TREASURE_CARDS.length);

  return {
    card: TREASURE_CARDS[cardIndex] ?? TREASURE_CARDS[0],
    nextSeed: step.nextSeed,
  };
}

export function getTreasureCardName(cardId: TreasureCardId): string {
  return TREASURE_CARDS.find((card) => card.id === cardId)?.name ?? cardId;
}

export function getTreasureCard(cardId: TreasureCardId): TreasureCard {
  return TREASURE_CARDS.find((card) => card.id === cardId) ?? TREASURE_CARDS[0];
}
