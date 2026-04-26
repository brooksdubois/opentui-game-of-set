import type { GameViewState } from "./types";

export const mockGameState: GameViewState = {
  title: "Welcome to the Set Game",
  remainingCards: 69,
  foundSets: 0,
  score: 0,
  leaderboard: [],
  leaderboardPendingEntry: false,
  status: "Running",
  hasAnySetOnBoard: true,
  gameComplete: false,
  board: [
    { id: "a1", index: 0, shape: "oval", color: "red", fill: "shaded", count: 1, selected: false },
    { id: "a2", index: 1, shape: "squiggle", color: "green", fill: "empty", count: 2, selected: false },
    { id: "a3", index: 2, shape: "diamond", color: "blue", fill: "full", count: 3, selected: false },
    { id: "a4", index: 3, shape: "oval", color: "green", fill: "full", count: 2, selected: false },
    { id: "b1", index: 4, shape: "diamond", color: "red", fill: "empty", count: 1, selected: false },
    { id: "b2", index: 5, shape: "squiggle", color: "blue", fill: "shaded", count: 3, selected: false },
    { id: "b3", index: 6, shape: "oval", color: "blue", fill: "empty", count: 2, selected: false },
    { id: "b4", index: 7, shape: "diamond", color: "green", fill: "shaded", count: 1, selected: false },
    { id: "c1", index: 8, shape: "squiggle", color: "red", fill: "full", count: 2, selected: false },
    { id: "c2", index: 9, shape: "diamond", color: "blue", fill: "empty", count: 2, selected: false },
    { id: "c3", index: 10, shape: "oval", color: "red", fill: "full", count: 3, selected: false },
    { id: "c4", index: 11, shape: "squiggle", color: "green", fill: "shaded", count: 1, selected: false },
  ],
};
