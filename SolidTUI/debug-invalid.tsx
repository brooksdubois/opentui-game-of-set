import { testRender } from "@opentui/solid";
import { KeyEvent } from "@opentui/core";
import { App } from "./src/components/App";
import type { EngineClient } from "./src/engine/engineClient";
import type { EngineCommand, EngineResponse } from "./src/engine/protocol";
import { mockGameState } from "./src/mockState";

const selectedIndexes = new Set<number>();
const commands: EngineCommand[] = [];
const fakeClient: EngineClient = {
  async send(command: EngineCommand): Promise<EngineResponse> {
    commands.push(command);
    const submissionIndexes = command.command === "submit_selection" ? [...selectedIndexes] : [];
    if (command.command === "new_game") selectedIndexes.clear();
    if (command.command === "toggle_select" && command.index !== undefined) {
      if (selectedIndexes.has(command.index)) selectedIndexes.delete(command.index);
      else selectedIndexes.add(command.index);
    }
    if (command.command === "submit_selection") selectedIndexes.clear();
    return {
      type: "state",
      ok: true,
      command: command.command,
      submission: command.command === "submit_selection" ? { isSet: false, selectedIndexes: submissionIndexes } : undefined,
      state: {
        board: mockGameState.board.map((card) => ({
          index: card.index,
          shape: card.shape === "oval" ? "O" : card.shape === "diamond" ? "D" : "S",
          color: card.color === "red" ? "R" : card.color === "green" ? "G" : "B",
          fill: card.fill === "empty" ? "L" : card.fill === "shaded" ? "S" : "F",
          count: String(card.count) as "1" | "2" | "3",
          selected: selectedIndexes.has(card.index),
        })),
        selectedIndexes: [...selectedIndexes],
        remainingCards: command.command === "deal_more" ? 66 : mockGameState.remainingCards,
        foundSets: mockGameState.foundSets,
        status: mockGameState.status,
        hasAnySetOnBoard: mockGameState.hasAnySetOnBoard,
        gameComplete: mockGameState.gameComplete,
        gameOver: false,
      },
    };
  },
  async shutdown(): Promise<void> {},
};
const setup = await testRender(() => <App client={fakeClient} />, { width: 160, height: 44 });
await setup.renderOnce();
await Bun.sleep(20);
await setup.renderOnce();
await Bun.sleep(50);
await setup.renderOnce();

function pressKey(name: string, sequence = name, raw = sequence): void {
  setup.renderer.keyInput.emit("keypress", new KeyEvent({ name, sequence, raw, ctrl: false, meta: false, shift: false, option: false, number: false, eventType: "press", source: "raw" }));
}

pressKey("right", "\u001b[C");
pressKey("return", "\r");
await Bun.sleep(20);
await setup.renderOnce();
pressKey("right", "\u001b[C");
pressKey("return", "\r");
await Bun.sleep(20);
await setup.renderOnce();
pressKey("right", "\u001b[C");
pressKey("return", "\r");
await Bun.sleep(120);
await setup.renderOnce();
console.log(commands.map((c)=>c.command+":"+(c.index??"")));
console.log(setup.captureCharFrame());
setup.renderer.destroy();
