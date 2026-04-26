import { testRender } from "@opentui/solid";
import { KeyEvent } from "@opentui/core";
import { App } from "./components/App";
import type { EngineClient } from "./engine/engineClient";
import type { EngineCardDto, EngineCommand, EngineResponse, EngineScoreEventDto } from "./engine/protocol";
import { mockGameState } from "./mockState";

const selectedIndexes = new Set<number>();
const commands: EngineCommand[] = [];
let fakeScore = 0;

function toEngineCard(
  card: (typeof mockGameState.board)[number],
  selected = selectedIndexes.has(card.index),
): EngineCardDto {
  return {
    index: card.index,
    shape: card.shape === "oval" ? "O" : card.shape === "diamond" ? "D" : "S",
    color: card.color === "red" ? "R" : card.color === "green" ? "G" : "B",
    fill: card.fill === "empty" ? "L" : card.fill === "shaded" ? "S" : "F",
    count: String(card.count) as "1" | "2" | "3",
    selected,
  };
}

function createStateResponse(
  command: EngineCommand["command"],
  options: {
    board?: EngineCardDto[];
    selectedIndexes?: number[];
    remainingCards?: number;
    foundSets?: number;
    score?: number;
    leaderboard?: Array<{ initials: string; score: number; achievedAt: string }>;
    leaderboardPendingEntry?: boolean;
    status?: string;
    hasAnySetOnBoard?: boolean;
    gameComplete?: boolean;
    submission?: { isSet: boolean; selectedIndexes: number[] };
    scoreEvents?: EngineScoreEventDto[];
  } = {},
): EngineResponse {
  return {
    type: "state",
    ok: true,
    command,
    submission: options.submission,
    scoreEvents: options.scoreEvents,
    state: {
      board: options.board ?? mockGameState.board.map((card) => toEngineCard(card)),
      selectedIndexes: options.selectedIndexes ?? [...selectedIndexes],
      remainingCards: options.remainingCards ?? mockGameState.remainingCards,
      foundSets: options.foundSets ?? mockGameState.foundSets,
      score: options.score ?? fakeScore,
      leaderboard: options.leaderboard ?? mockGameState.leaderboard,
      leaderboardPendingEntry: options.leaderboardPendingEntry ?? mockGameState.leaderboardPendingEntry,
      status: options.status ?? mockGameState.status,
      hasAnySetOnBoard: options.hasAnySetOnBoard ?? mockGameState.hasAnySetOnBoard,
      gameComplete: options.gameComplete ?? mockGameState.gameComplete,
      gameOver: options.gameComplete ?? mockGameState.gameComplete,
    },
  };
}

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
    if (command.command === "new_game") {
      selectedIndexes.clear();
      fakeScore = 0;
      return createStateResponse(command.command, { score: 0 });
    }
    if (command.command === "toggle_select" && command.index !== undefined) {
      if (selectedIndexes.has(command.index)) {
        selectedIndexes.delete(command.index);
      } else {
        selectedIndexes.add(command.index);
      }
      return createStateResponse(command.command);
    }
    if (command.command === "submit_selection") {
      selectedIndexes.clear();
      fakeScore -= 2;
      return createStateResponse(command.command, {
        submission: { isSet: false, selectedIndexes: submissionIndexes },
        scoreEvents: [{ label: "Invalid set", points: -2 }],
      });
    }
    if (command.command === "deal_more") {
      return createStateResponse(command.command, { remainingCards: 66 });
    }
    if (command.command === "re_deal") {
      fakeScore -= 3;
      return createStateResponse(command.command, {
        scoreEvents: [{ label: "Redeal penalty", points: -3 }],
      });
    }

    return createStateResponse(command.command);
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

const expectedText = [".-'''-.", ".──.", "'-___-'"];
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

if (!frame.includes("Score: 0")) {
  setup.renderer.destroy();
  throw new Error("Static TUI smoke test failed. Score was not rendered in the status line.");
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
  fakeScore = 0;
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

function findFirstCardTopRow(frameText: string): number {
  const singleTopBorder = "┌─────────────────────────────────┐";
  const doubleTopBorder = "╔═════════════════════════════════╗";
  const y = frameText
    .split("\n")
    .findIndex((line) => line.includes(singleTopBorder) || line.includes(doubleTopBorder));
  if (y < 0) throw new Error("Could not locate a card border in the smoke frame.");

  return y;
}

function countCardTopBorders(frameText: string): number {
  const singleTopBorder = "┌─────────────────────────────────┐";
  const doubleTopBorder = "╔═════════════════════════════════╗";

  return (
    (frameText.match(new RegExp(singleTopBorder, "g")) ?? []).length +
    (frameText.match(new RegExp(doubleTopBorder, "g")) ?? []).length
  );
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
pressKey("n");
await Bun.sleep(20);
await setup.renderOnce();
resetFakeState();
pressKey("right", "\u001b[C");
pressKey("return", "\r");
await Bun.sleep(80);
await setup.renderOnce();

pressKey("right", "\u001b[C");
pressKey("return", "\r");
await Bun.sleep(80);
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

if (!/Score:\s*-2\b/.test(submitFrame)) {
  setup.renderer.destroy();
  throw new Error("Static TUI smoke test failed. Invalid set penalty was not reflected in the score.");
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

const normalFirstCardTopRow = findFirstCardTopRow(frame);
const compactSelectedIndexes = new Set<number>();
let compactBoard = [...mockGameState.board];
const compactExtraCards = mockGameState.board.slice(0, 3).map((card, index) => ({
  ...card,
  id: `compact-extra-${index}`,
  index: 12 + index,
}));

const compactClient: EngineClient = {
  async send(command: EngineCommand): Promise<EngineResponse> {
    const submissionIndexes = command.command === "submit_selection" ? [...compactSelectedIndexes] : [];
    let compactScoreEvents: EngineScoreEventDto[] | undefined;
    let compactScore = compactBoard.length > 12 ? 0 : 0;

    if (command.command === "new_game") {
      compactBoard = [...mockGameState.board];
      compactSelectedIndexes.clear();
      compactScore = 0;
    }

    if (command.command === "deal_more") {
      compactBoard = [...mockGameState.board, ...compactExtraCards];
      compactSelectedIndexes.clear();
      compactScore = 0;
    }

    if (command.command === "toggle_select" && command.index !== undefined) {
      if (compactSelectedIndexes.has(command.index)) {
        compactSelectedIndexes.delete(command.index);
      } else {
        compactSelectedIndexes.add(command.index);
      }
    }

    if (command.command === "submit_selection") {
      compactBoard = [...mockGameState.board];
      compactSelectedIndexes.clear();
      compactScore = 16;
      compactScoreEvents = [
        { label: "Set", points: 3 },
        { label: "Color bonus", points: 1 },
        { label: "Shading bonus", points: 1 },
        { label: "Shape bonus", points: 1 },
        { label: "Quick set", points: 10 },
      ];
    }

    return {
      type: "state",
      ok: true,
      command: command.command,
      submission:
        command.command === "submit_selection"
          ? { isSet: true, selectedIndexes: submissionIndexes }
          : undefined,
      scoreEvents: compactScoreEvents,
      state: {
        board: compactBoard.map((card) => toEngineCard(card, compactSelectedIndexes.has(card.index))),
        selectedIndexes: [...compactSelectedIndexes],
        remainingCards: compactBoard.length > 12 ? 66 : mockGameState.remainingCards,
        foundSets: command.command === "submit_selection" ? 1 : mockGameState.foundSets,
        score: compactScore,
        leaderboard: [],
        leaderboardPendingEntry: false,
        status: mockGameState.status,
        hasAnySetOnBoard: mockGameState.hasAnySetOnBoard,
        gameComplete: mockGameState.gameComplete,
        gameOver: false,
      },
    };
  },
  async shutdown(): Promise<void> {},
};

const compactSetup = await testRender(() => <App client={compactClient} />, { width: 160, height: 44 });
await compactSetup.renderOnce();
await Bun.sleep(30);
await compactSetup.renderOnce();

function pressCompactKey(name: string, sequence = name, raw = sequence): void {
  compactSetup.renderer.keyInput.emit("keypress", new KeyEvent({
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

(compactSetup.renderer as unknown as { setupInput?: () => void }).setupInput?.();
pressCompactKey("d");
await Bun.sleep(30);
await compactSetup.renderOnce();
const compactFrame = compactSetup.captureCharFrame();

if (countCardTopBorders(compactFrame) !== 15) {
  compactSetup.renderer.destroy();
  setup.renderer.destroy();
  throw new Error("Static TUI smoke test failed. Compact board did not render all 15 cards.");
}

if (findFirstCardTopRow(compactFrame) >= normalFirstCardTopRow) {
  compactSetup.renderer.destroy();
  setup.renderer.destroy();
  throw new Error("Static TUI smoke test failed. Compact board did not reclaim header space.");
}

pressCompactKey("return", "\r");
await Bun.sleep(30);
await compactSetup.renderOnce();
pressCompactKey("right", "\u001b[C");
pressCompactKey("return", "\r");
await Bun.sleep(30);
await compactSetup.renderOnce();
pressCompactKey("right", "\u001b[C");
pressCompactKey("return", "\r");
await Bun.sleep(80);
await compactSetup.renderOnce();
const restoredFrame = compactSetup.captureCharFrame();

if (compactBoard.length !== 12) {
  compactSetup.renderer.destroy();
  setup.renderer.destroy();
  throw new Error("Static TUI smoke test failed. Clearing a compact set did not restore a 12-card board.");
}

if (findFirstCardTopRow(restoredFrame) < normalFirstCardTopRow) {
  compactSetup.renderer.destroy();
  setup.renderer.destroy();
  throw new Error("Static TUI smoke test failed. Clearing a compact set did not restore the normal header layout.");
}

if (!restoredFrame.includes("Score: 16")) {
  compactSetup.renderer.destroy();
  setup.renderer.destroy();
  throw new Error("Static TUI smoke test failed. Quick-set scoring did not reach the expected total.");
}

if (!restoredFrame.includes("Quick set")) {
  compactSetup.renderer.destroy();
  setup.renderer.destroy();
  throw new Error("Static TUI smoke test failed. Bonus ticker did not render quick-set feedback.");
}

const seededLeaderboard = Array.from({ length: 9 }, (_, index) => ({
  initials: `P${index}`,
  score: 99 - index,
  achievedAt: `2026-03-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
}));

const winCommands: EngineCommand[] = [];
let winState: "won" | "fresh" = "won";
let winLeaderboard = [...seededLeaderboard];
let winPendingEntry = true;

const winClient: EngineClient = {
  async send(command: EngineCommand): Promise<EngineResponse> {
    winCommands.push(command);
    if (command.command === "new_game" && winState === "fresh") {
      return {
        type: "state",
        ok: true,
        command: command.command,
        state: {
          board: mockGameState.board.map((card) => ({
            index: card.index,
            shape: card.shape === "oval" ? "O" : card.shape === "diamond" ? "D" : "S",
            color: card.color === "red" ? "R" : card.color === "green" ? "G" : "B",
            fill: card.fill === "empty" ? "L" : card.fill === "shaded" ? "S" : "F",
            count: String(card.count) as "1" | "2" | "3",
            selected: false,
          })),
          selectedIndexes: [],
          remainingCards: mockGameState.remainingCards,
          foundSets: 0,
          score: 0,
          leaderboard: winLeaderboard,
          leaderboardPendingEntry: false,
          status: "Running",
          hasAnySetOnBoard: true,
          gameComplete: false,
          gameOver: false,
        },
      };
    }

    if (command.command === "submit_high_score" && command.initials) {
      winLeaderboard = [
        {
          initials: command.initials.toUpperCase(),
          score: 100,
          achievedAt: "2026-04-25T00:00:00.000Z",
        },
        ...winLeaderboard,
      ];
      winPendingEntry = false;
      return {
        type: "state",
        ok: true,
        command: command.command,
        message: `high score saved for ${command.initials.toUpperCase()}`,
        state: {
          board: [],
          selectedIndexes: [],
          remainingCards: 0,
          foundSets: 9,
          score: 100,
          leaderboard: winLeaderboard,
          leaderboardPendingEntry: false,
          status: "Won",
          hasAnySetOnBoard: false,
          gameComplete: true,
          gameOver: false,
        },
      };
    }

    winState = "fresh";
    return {
      type: "state",
      ok: true,
      command: command.command,
      state: {
        board: [],
        selectedIndexes: [],
        remainingCards: 0,
        foundSets: 9,
        score: 100,
        leaderboard: winLeaderboard,
        leaderboardPendingEntry: winPendingEntry,
        status: "Won",
        hasAnySetOnBoard: false,
        gameComplete: true,
        gameOver: false,
      },
    };
  },
  async shutdown(): Promise<void> {},
};

const winSetup = await testRender(() => <App client={winClient} />, { width: 160, height: 44 });
await winSetup.renderOnce();
await Bun.sleep(30);
await winSetup.renderOnce();
await Bun.sleep(30);
await winSetup.renderOnce();

function pressWinKey(name: string, sequence = name, raw = sequence): void {
  winSetup.renderer.keyInput.emit("keypress", new KeyEvent({
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

(winSetup.renderer as unknown as { setupInput?: () => void }).setupInput?.();
const winFrame = winSetup.captureCharFrame();
if (!winFrame.includes("Enter initials: ___")) {
  winSetup.renderer.destroy();
  compactSetup.renderer.destroy();
  setup.renderer.destroy();
  throw new Error("Static TUI smoke test failed. Qualifying win did not prompt for three initials.");
}

pressWinKey("a", "a", "a");
pressWinKey("b", "b", "b");
await Bun.sleep(20);
await winSetup.renderOnce();
const partialWinFrame = winSetup.captureCharFrame();
if (!partialWinFrame.includes("Enter initials: AB_")) {
  winSetup.renderer.destroy();
  compactSetup.renderer.destroy();
  setup.renderer.destroy();
  throw new Error("Static TUI smoke test failed. Win screen did not reflect partial initials entry.");
}

pressWinKey("c", "c", "c");
await Bun.sleep(80);
await winSetup.renderOnce();
const savedWinFrame = winSetup.captureCharFrame();
if (!savedWinFrame.includes("Saved: ABC")) {
  winSetup.renderer.destroy();
  compactSetup.renderer.destroy();
  setup.renderer.destroy();
  throw new Error("Static TUI smoke test failed. Win screen did not confirm saved initials.");
}

if (!savedWinFrame.includes("ABC  100")) {
  winSetup.renderer.destroy();
  compactSetup.renderer.destroy();
  setup.renderer.destroy();
  throw new Error("Static TUI smoke test failed. Saved leaderboard entry was not rendered.");
}

if (!winCommands.some((command) => command.command === "submit_high_score" && command.initials === "ABC")) {
  winSetup.renderer.destroy();
  compactSetup.renderer.destroy();
  setup.renderer.destroy();
  throw new Error("Static TUI smoke test failed. Win flow did not submit initials back to the engine.");
}

pressWinKey("n");
await Bun.sleep(30);
await winSetup.renderOnce();
if (winCommands.filter((command) => command.command === "new_game").length !== 2) {
  winSetup.renderer.destroy();
  compactSetup.renderer.destroy();
  setup.renderer.destroy();
  throw new Error("Static TUI smoke test failed. N did not start a new game after initials were saved.");
}

if (!winSetup.captureCharFrame().includes("Score: 0")) {
  winSetup.renderer.destroy();
  compactSetup.renderer.destroy();
  setup.renderer.destroy();
  throw new Error("Static TUI smoke test failed. New game did not restore the normal score line after win flow.");
}

winSetup.renderer.destroy();
compactSetup.renderer.destroy();
setup.renderer.destroy();
console.log("Static TUI smoke test passed");
