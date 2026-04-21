import { testRender } from "@opentui/solid";
import { KeyEvent } from "@opentui/core";
import { App } from "./components/App";
import type { EngineClient } from "./engine/engineClient";
import type { EngineCommand, EngineResponse } from "./engine/protocol";
import { mockGameState } from "./mockState";

const selectedIndexes = new Set<number>();
const commands: EngineCommand[] = [];

const loadingSetup = await testRender(
  () => (
    <App
      client={{
        send: async () => new Promise<EngineResponse>(() => {}),
        shutdown: async () => {},
      }}
    />
  ),
  { width: 160, height: 44 },
);
await loadingSetup.renderOnce();
const loadingFrame = loadingSetup.captureCharFrame();
if (loadingFrame.includes("Starting engine") || loadingFrame.includes("Status:")) {
  loadingSetup.renderer.destroy();
  throw new Error("Static TUI smoke test failed. Loading text leaked into the status bar.");
}
if (loadingFrame.includes("loading...")) {
  loadingSetup.renderer.destroy();
  throw new Error("Static TUI smoke test failed. Removed loading banner is visible.");
}
loadingSetup.renderer.destroy();

const fakeClient: EngineClient = {
  async send(command: EngineCommand): Promise<EngineResponse> {
    commands.push(command);
    const submissionIndexes = command.command === "submit_selection" ? [...selectedIndexes] : [];
    if (command.command === "new_game") selectedIndexes.clear();
    if (command.command === "toggle_select" && command.index !== undefined) {
      if (selectedIndexes.has(command.index)) {
        selectedIndexes.delete(command.index);
      } else {
        selectedIndexes.add(command.index);
      }
    }
    if (command.command === "submit_selection") selectedIndexes.clear();

    return {
      type: "state",
      ok: true,
      command: command.command,
      submission:
        command.command === "submit_selection"
          ? { isSet: false, selectedIndexes: submissionIndexes }
          : undefined,
      state: {
        board: mockGameState.board.map((card) => ({
          index: card.index,
          shape: card.shape === "oval" ? "O" : card.shape === "diamond" ? "D" : "S",
          color: card.color === "red" ? "R" : card.color === "green" ? "G" : "B",
          fill: card.fill === "empty" ? "L" : card.fill === "shaded" ? "S" : "F",
          count: String(card.count) as "1" | "2" | "3",
          selected: selectedIndexes.has(card.index),
        })),
        selectedIndexes: [],
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

const frame = setup.captureCharFrame();

const expectedText = ["Welcome to the Set Game", ".-'''-.", ".''.", "'-___-'"];
const missingText = expectedText.filter((text) => !frame.includes(text));

if (missingText.length > 0) {
  setup.renderer.destroy();
  throw new Error(`Static TUI smoke test failed. Missing: ${missingText.join(", ")}`);
}

if (frame.includes("Enter 3 cells")) {
  setup.renderer.destroy();
  throw new Error("Static TUI smoke test failed. Prompt footer is still visible.");
}

if ((frame.match(/Status:/g) ?? []).length !== 1) {
  setup.renderer.destroy();
  throw new Error("Static TUI smoke test failed. Status line is duplicated.");
}

if (frame.includes("Starting engine")) {
  setup.renderer.destroy();
  throw new Error("Static TUI smoke test failed. Startup text is still visible after state loaded.");
}

if (frame.includes("loading...")) {
  setup.renderer.destroy();
  throw new Error("Static TUI smoke test failed. Loading banner is still visible after state loaded.");
}

function pressKey(name: string, sequence = name, raw = sequence): void {
  setup.renderer.keyInput.emit("keypress", new KeyEvent({
    name,
    sequence,
    raw,
    ctrl: false,
    meta: false,
    shift: false,
    option: false,
    number: false,
    eventType: "press",
    source: "raw",
  }));
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
await Bun.sleep(20);
await setup.renderOnce();

if (commands.some((command) => command.command === "submit_selection")) {
  setup.renderer.destroy();
  throw new Error("Static TUI smoke test failed. Enter submitted before three selected cards were confirmed.");
}

pressKey("return", "\r");
await Bun.sleep(20);
await setup.renderOnce();

const submitFrame = setup.captureCharFrame();
if (!submitFrame.includes("Not a set")) {
  setup.renderer.destroy();
  throw new Error("Static TUI smoke test failed. Invalid submit message is missing.");
}

pressKey("d");
await Bun.sleep(20);
pressKey("r");
await Bun.sleep(20);
pressKey("n");
await Bun.sleep(20);
await setup.renderOnce();

const commandNames = commands.map((command) => command.command);
for (const expectedCommand of ["new_game", "toggle_select", "submit_selection", "deal_more", "re_deal", "new_game"]) {
  if (!commandNames.includes(expectedCommand as EngineCommand["command"])) {
    setup.renderer.destroy();
    throw new Error(`Static TUI smoke test failed. Missing command: ${expectedCommand}`);
  }
}

const toggleCommand = commands.find((command) => command.command === "toggle_select");
if (toggleCommand?.index !== 1) {
  setup.renderer.destroy();
  throw new Error(`Static TUI smoke test failed. Expected focused toggle index 1, got ${toggleCommand?.index}`);
}

const toggleCommands = commands.filter((command) => command.command === "toggle_select");
if (toggleCommands.length < 3) {
  setup.renderer.destroy();
  throw new Error(`Static TUI smoke test failed. Expected Enter to toggle three cards, got ${toggleCommands.length}.`);
}

setup.renderer.destroy();
console.log("Static TUI smoke test passed");
