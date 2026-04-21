import { createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { useKeyboard, useRenderer } from "@opentui/solid";
import type { KeyEvent } from "@opentui/core";
import type { EngineClient } from "../engine/engineClient";
import { engineStateToViewState } from "../engine/mappers";
import type { EngineCommand, EngineCommandName, EngineResponse } from "../engine/protocol";
import type { GameViewState } from "../types";
import { BoardGrid } from "./BoardGrid";
import { Header } from "./Header.tsx";
import { StatusPanel } from "./StatusPanel.tsx";

interface GameScreenProps {
  client: EngineClient;
}

export function GameScreen(props: GameScreenProps) {
  const renderer = useRenderer();
  const [state, setState] = createSignal<GameViewState | null>(null);
  const [focusedIndex, setFocusedIndex] = createSignal(0);
  const [message, setMessage] = createSignal("Starting engine...");
  const [busy, setBusy] = createSignal(false);
  const [invalidIndexes, setInvalidIndexes] = createSignal<Set<number>>(new Set());
  let invalidHighlightTimer: ReturnType<typeof setTimeout> | undefined;

  const focusedBoardIndex = () => {
    const board = state()?.board ?? [];
    const focus = focusedIndex();
    return board[focus]?.index ?? -1;
  };
  const selectedCount = () => state()?.board.filter((card) => card.selected).length ?? 0;

  async function runCommand(command: EngineCommand): Promise<void> {
    if (busy()) return;

    clearInvalidHighlight();
    setBusy(true);
    try {
      const response = await props.client.send(command);
      applyResponse(response, command.command);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  function applyResponse(response: EngineResponse, command: EngineCommandName): void {
    if (response.type === "state") {
      setMessage(response.message ?? messageForCommand(command, response));
      setState(engineStateToViewState(response.state));
      if (command === "submit_selection" && response.submission?.isSet === false) {
        flashInvalidSelection(response.submission.selectedIndexes);
      }
      return;
    }

    if (response.type === "error") {
      setMessage(response.message);
      return;
    }

    setMessage(response.message);
  }

  function clearInvalidHighlight(): void {
    if (invalidHighlightTimer) {
      clearTimeout(invalidHighlightTimer);
      invalidHighlightTimer = undefined;
    }
    setInvalidIndexes(new Set<number>());
  }

  function flashInvalidSelection(indexes: number[]): void {
    setInvalidIndexes(new Set(indexes));
    invalidHighlightTimer = setTimeout(() => {
      setInvalidIndexes(new Set<number>());
      invalidHighlightTimer = undefined;
    }, 3000);
  }

  function moveFocus(delta: number): void {
    const boardLength = state()?.board.length ?? 0;
    if (boardLength === 0) return;

    setFocusedIndex((current) => Math.max(0, Math.min(boardLength - 1, current + delta)));
  }

  function moveHorizontal(direction: -1 | 1): void {
    const boardLength = state()?.board.length ?? 0;
    if (boardLength === 0) return;

    const current = focusedIndex();
    const column = current % 4;

    if (direction === -1 && column > 0) moveFocus(-1);
    if (direction === 1 && column < 3) moveFocus(1);
  }

  function toggleFocusedSelection(): void {
    const index = focusedBoardIndex();
    if (index >= 0) void runCommand({ command: "toggle_select", index });
  }

  function handleKey(key: KeyEvent): void {
    const name = key.name.toLowerCase();

    if (name === "q") {
      void props.client.shutdown().finally(() => renderer.destroy());
      return;
    }

    if (name === "left" || name === "arrowleft") {
      moveHorizontal(-1);
      return;
    }

    if (name === "right" || name === "arrowright") {
      moveHorizontal(1);
      return;
    }

    if (name === "up" || name === "arrowup") {
      moveFocus(-4);
      return;
    }

    if (name === "down" || name === "arrowdown") {
      moveFocus(4);
      return;
    }

    if (name === "space" || key.sequence === " " || key.raw === " ") {
      toggleFocusedSelection();
      return;
    }

    if (name === "return" || name === "enter") {
      if (selectedCount() >= 3) {
        void runCommand({ command: "submit_selection" });
      } else {
        toggleFocusedSelection();
      }
      return;
    }

    if (name === "d") {
      void runCommand({ command: "deal_more" });
      return;
    }

    if (name === "r") {
      void runCommand({ command: "re_deal" });
      return;
    }

    if (name === "n") {
      setFocusedIndex(0);
      void runCommand({ command: "new_game" });
    }
  }

  useKeyboard(handleKey);

  onMount(() => {
    void runCommand({ command: "new_game" });
  });

  onCleanup(() => {
    clearInvalidHighlight();
    void props.client.shutdown();
  });

  createEffect(() => {
    const boardLength = state()?.board.length ?? 0;
    if (boardLength === 0) {
      setFocusedIndex(0);
      return;
    }

    if (focusedIndex() >= boardLength) {
      setFocusedIndex(boardLength - 1);
    }
  });

  return (
    <box
      id="game-screen"
      flexDirection="column"
      width="100%"
      height="100%"
      padding={0}
      backgroundColor="#0b0f10"
      gap={0}
    >
      <Header title={state()?.title ?? "Welcome to the Set Game"} />
      <box flexGrow={1} alignItems="center" justifyContent="center" padding={1}>
        <BoardGrid cards={state()?.board ?? []} focusedIndex={focusedIndex()} invalidIndexes={invalidIndexes()} />
      </box>
      <StatusPanel state={state()} focusedIndex={focusedIndex()} message={message()} busy={busy()} />
    </box>
  );
}

function messageForCommand(command: EngineCommandName, response: EngineResponse): string {
  if (response.type !== "state") return "";
  if (command === "toggle_select") return "Selection updated";
  if (command === "submit_selection" && response.submission) {
    return response.submission.isSet ? "Set accepted" : "Not a set";
  }
  if (command === "new_game") return "New game";
  return response.message ?? "";
}
