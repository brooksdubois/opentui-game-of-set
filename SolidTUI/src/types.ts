export type Shape = "oval" | "diamond" | "squiggle";
export type CardColor = "red" | "green" | "blue";
export type Fill = "empty" | "shaded" | "full";
export type Count = 1 | 2 | 3;

export interface SetCard {
  id: string;
  shape: Shape;
  color: CardColor;
  fill: Fill;
  count: Count;
  selected?: boolean;
}

export interface MockGameState {
  title: string;
  board: SetCard[];
  remainingCards: number;
  foundSets: number;
  status: string;
}
