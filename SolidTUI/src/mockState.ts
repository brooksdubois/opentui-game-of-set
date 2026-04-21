import type { MockGameState } from "./types";

export const mockGameState: MockGameState = {
  title: "Welcome to the Set Game",
  remainingCards: 69,
  foundSets: 0,
  status: "Running",
  board: [
    { id: "a1", shape: "oval", color: "red", fill: "shaded", count: 1 },
    { id: "a2", shape: "squiggle", color: "green", fill: "empty", count: 2 },
    { id: "a3", shape: "diamond", color: "blue", fill: "full", count: 3 },
    { id: "a4", shape: "oval", color: "green", fill: "full", count: 2 },
    { id: "b1", shape: "diamond", color: "red", fill: "empty", count: 1 },
    { id: "b2", shape: "squiggle", color: "blue", fill: "shaded", count: 3 },
    { id: "b3", shape: "oval", color: "blue", fill: "empty", count: 2 },
    { id: "b4", shape: "diamond", color: "green", fill: "shaded", count: 1 },
    { id: "c1", shape: "squiggle", color: "red", fill: "full", count: 2 },
    { id: "c2", shape: "diamond", color: "blue", fill: "empty", count: 2 },
    { id: "c3", shape: "oval", color: "red", fill: "full", count: 3 },
    { id: "c4", shape: "squiggle", color: "green", fill: "shaded", count: 1 },
  ],
};
