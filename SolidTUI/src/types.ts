export type Shape = "oval" | "diamond" | "squiggle";
export type CardColor = "red" | "green" | "blue";
export type Fill = "empty" | "shaded" | "full";
export type Count = 1 | 2 | 3;

export interface SetCard {
  id: string;
  index: number;
  shape: Shape;
  color: CardColor;
  fill: Fill;
  count: Count;
  selected: boolean;
}

export interface GameViewState {
  title: string;
  board: SetCard[];
  remainingCards: number;
  foundSets: number;
  status: string;
  hasAnySetOnBoard: boolean;
  gameComplete: boolean;
}
