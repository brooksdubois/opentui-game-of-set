import type { EngineStateDto } from "./protocol";
import type { CardColor, Count, Fill, GameViewState, Shape } from "../types";

const shapeMap: Record<string, Shape> = {
  O: "oval",
  D: "diamond",
  S: "squiggle",
};

const colorMap: Record<string, CardColor> = {
  R: "red",
  G: "green",
  B: "blue",
};

const fillMap: Record<string, Fill> = {
  L: "empty",
  S: "shaded",
  F: "full",
};

const countMap: Record<string, Count> = {
  "1": 1,
  "2": 2,
  "3": 3,
};

export function engineStateToViewState(state: EngineStateDto): GameViewState {
  return {
    title: "Welcome to the Set Game",
    board: state.board.map((card) => ({
      id: String(card.index),
      index: card.index,
      shape: shapeMap[card.shape] ?? "oval",
      color: colorMap[card.color] ?? "red",
      fill: fillMap[card.fill] ?? "empty",
      count: countMap[card.count] ?? 1,
      selected: card.selected,
    })),
    remainingCards: state.remainingCards,
    foundSets: state.foundSets,
    status: state.status,
    hasAnySetOnBoard: state.hasAnySetOnBoard,
    gameComplete: state.gameComplete,
  };
}
