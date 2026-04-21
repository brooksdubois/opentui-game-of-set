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

const frame = setup.captureCharFrame();

const expectedText = [".-'''-.", ".''.", "'-___-'"];
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

function resetFakeState(): void {
  commands.length = 0;
  selectedIndexes.clear();
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

function findFirstCardCenter(frameText: string): { x: number; y: number } {
  const lines = frameText.split("\n");
  const topBorder = "╔═════════════════════════════════╗";
  const y = lines.findIndex((line) => line.includes(topBorder));
  if (y < 0) throw new Error("Could not locate a card border in the smoke frame.");
  const line = lines[y] ?? "";

  const x = line.indexOf(topBorder);
  if (x < 0) throw new Error("Could not locate a card column in the smoke frame.");

  return { x: x + 10, y: y + 5 };
}

(setup.renderer as unknown as { setupInput?: () => void }).setupInput?.();
resetFakeState();
const firstCardCenter = findFirstCardCenter(frame);
const secondCardCenter = { x: firstCardCenter.x + 38, y: firstCardCenter.y };
await setup.mockMouse.moveTo(secondCardCenter.x, secondCardCenter.y);
await Bun.sleep(20);
await setup.renderOnce();
await setup.mockMouse.click(secondCardCenter.x, secondCardCenter.y);
await Bun.sleep(30);
await setup.renderOnce();
if (commands.find((command) => command.command === "toggle_select")?.index !== 1) {
  setup.renderer.destroy();
  throw new Error("Static TUI smoke test failed. Mouse click did not toggle the clicked card.");
}
if (!setup.captureCharFrame().includes("Focus: 2")) {
  setup.renderer.destroy();
  throw new Error("Static TUI smoke test failed. Mouse click did not move focus to the clicked card.");
}

pressKey("n");
await Bun.sleep(20);
await setup.renderOnce();
resetFakeState();
pressKey("left", "\u001b[D");
pressKey("space", " ", " ");
await Bun.sleep(20);
await setup.renderOnce();
const leftWrapIndex = commands.find((command) => command.command === "toggle_select")?.index;
if (leftWrapIndex !== 3) {
  setup.renderer.destroy();
  throw new Error(`Static TUI smoke test failed. Left wrap did not focus the rightmost card. Got ${leftWrapIndex}.`);
}

pressKey("right", "\u001b[C");
pressKey("space", " ", " ");
await Bun.sleep(20);
await setup.renderOnce();
if (commands.filter((command) => command.command === "toggle_select").at(-1)?.index !== 0) {
  setup.renderer.destroy();
  throw new Error("Static TUI smoke test failed. Right wrap did not focus the leftmost card.");
}

pressKey("up", "\u001b[A");
pressKey("space", " ", " ");
await Bun.sleep(20);
await setup.renderOnce();
if (commands.filter((command) => command.command === "toggle_select").at(-1)?.index !== 8) {
  setup.renderer.destroy();
  throw new Error("Static TUI smoke test failed. Up wrap did not focus the bottom card.");
}

pressKey("down", "\u001b[B");
pressKey("space", " ", " ");
await Bun.sleep(20);
await setup.renderOnce();
if (commands.filter((command) => command.command === "toggle_select").at(-1)?.index !== 0) {
  setup.renderer.destroy();
  throw new Error("Static TUI smoke test failed. Down wrap did not focus the top card.");
}

resetFakeState();
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
  throw new Error("Static TUI smoke test failed. Enter submitted before the third card was toggled.");
}

pressKey("right", "\u001b[C");
pressKey("return", "\r");
await Bun.sleep(20);
await setup.renderOnce();

if (!commands.some((command) => command.command === "submit_selection")) {
  setup.renderer.destroy();
  throw new Error("Static TUI smoke test failed. Third toggle did not submit automatically.");
}

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
