import { stepSeededRng } from "./rng";

export type TrapCardId =
  | "safe"
  | "lose-20-coins"
  | "move-back-2"
  | "roll-and-move-back";

export type EventCardId =
  | "found-coins"
  | "move-forward-2"
  | "roll-again"
  | "draw-treasure";

export type TrapCard = {
  id: TrapCardId;
  name: string;
};

export type EventCard = {
  id: EventCardId;
  name: string;
};

export type TrapCardDraw = {
  card: TrapCard;
  nextSeed: number;
};

export type EventCardDraw = {
  card: EventCard;
  nextSeed: number;
};

export const TRAP_CARDS = [
  {
    id: "safe",
    name: "Safe",
  },
  {
    id: "lose-20-coins",
    name: "Lose 20 Coins",
  },
  {
    id: "move-back-2",
    name: "Move Back 2",
  },
  {
    id: "roll-and-move-back",
    name: "Roll and Move Back",
  },
] as const satisfies readonly TrapCard[];

export const EVENT_CARDS = [
  {
    id: "found-coins",
    name: "Found Coins",
  },
  {
    id: "move-forward-2",
    name: "Move Forward 2",
  },
  {
    id: "roll-again",
    name: "Roll Again",
  },
  {
    id: "draw-treasure",
    name: "Draw Treasure",
  },
] as const satisfies readonly EventCard[];

export function drawTrapCard(seed: number): TrapCardDraw {
  const step = stepSeededRng(seed);
  const cardIndex = Math.floor(step.value * TRAP_CARDS.length);

  return {
    card: TRAP_CARDS[cardIndex] ?? TRAP_CARDS[0],
    nextSeed: step.nextSeed,
  };
}

export function drawEventCard(seed: number): EventCardDraw {
  const step = stepSeededRng(seed);
  const cardIndex = Math.floor(step.value * EVENT_CARDS.length);

  return {
    card: EVENT_CARDS[cardIndex] ?? EVENT_CARDS[0],
    nextSeed: step.nextSeed,
  };
}
