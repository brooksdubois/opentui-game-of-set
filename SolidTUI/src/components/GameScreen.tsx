import {createEffect, createSignal, onCleanup, onMount, Show} from "solid-js";
import { useKeyboard, useRenderer } from "@opentui/solid";
import type { KeyEvent, MouseEvent } from "@opentui/core";
import type { EngineClient } from "../engine/engineClient";
import { engineStateToViewState } from "../engine/mappers";
import type { EngineCommand, EngineCommandName, EngineResponse } from "../engine/protocol";
import type { GameViewState } from "../types";
import type { SetCard } from "../types";
import { BoardGrid } from "./BoardGrid";
import { Header } from "./Header.tsx";
import { StatusPanel } from "./StatusPanel.tsx";

interface GameScreenProps {
  client: EngineClient;
}

type InputMode = "keyboard" | "mouse";
type MousePoint = { x: number; y: number };

export function GameScreen(props: GameScreenProps) {
  const renderer = useRenderer();
  const [state, setState] = createSignal<GameViewState | null>(null);
  const [focusedIndex, setFocusedIndex] = createSignal(0);
  const [hoveredIndex, setHoveredIndex] = createSignal<number | null>(null);
  const [inputMode, setInputMode] = createSignal<InputMode>("keyboard");
  const [message, setMessage] = createSignal("");
  const [busy, setBusy] = createSignal(false);
  const [invalidIndexes, setInvalidIndexes] = createSignal<Set<number>>(new Set());
  let invalidHighlightTimer: ReturnType<typeof setTimeout> | undefined;
  let lastMousePoint: MousePoint | undefined;
  let suppressedMousePoint: MousePoint | undefined;

  const focusedBoardIndex = () => {
    const board = state()?.board ?? [];
    const focus = focusedIndex();
    return board[focus]?.index ?? -1;
  };
  const visualFocusedIndex = () => (inputMode() === "keyboard" ? focusedIndex() : -1);
  const visualHoveredIndex = () => (inputMode() === "mouse" ? hoveredIndex() : null);
  const selectedCount = () => state()?.board.filter((card) => card.selected).length ?? 0;

  async function runCommand(command: EngineCommand): Promise<void> {
    if (busy()) return;

    clearInvalidHighlight();
    setBusy(true);
    try {
      await executeCommand(command);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function executeCommand(command: EngineCommand): Promise<EngineResponse> {
    const response = await props.client.send(command);
    applyResponse(response, command.command);
    return response;
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
    }, 1000);
  }

  function moveFocus(delta: number): void {
    const boardLength = state()?.board.length ?? 0;
    if (boardLength === 0) return;

    setFocusedIndex((current) => (current + delta + boardLength) % boardLength);
  }

  function moveHorizontal(direction: -1 | 1): void {
    const boardLength = state()?.board.length ?? 0;
    if (boardLength === 0) return;

    const current = focusedIndex();
    const rowStart = Math.floor(current / 4) * 4;
    const rowEnd = Math.min(rowStart + 3, boardLength - 1);

    if (direction === -1) {
      setFocusedIndex(current === rowStart ? rowEnd : current - 1);
      return;
    }

    setFocusedIndex(current === rowEnd ? rowStart : current + 1);
  }

  function toggleFocusedSelection(): void {
    const index = focusedBoardIndex();
    toggleSelectionByBoardIndex(index);
  }

  function toggleSelectionByBoardIndex(index: number): void {
    if (index < 0 || busy()) return;

    clearInvalidHighlight();
    setBusy(true);
    void (async () => {
      try {
        const response = await executeCommand({ command: "toggle_select", index });
        if (response.type === "state" && response.state.board.filter((card) => card.selected).length === 3) {
          await executeCommand({ command: "submit_selection" });
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : String(error));
      } finally {
        setBusy(false);
      }
    })();
  }

  function handleCardClick(position: number, card: SetCard, event: MouseEvent): void {
    lastMousePoint = pointFromMouseEvent(event);
    suppressedMousePoint = undefined;
    setInputMode("mouse");
    setHoveredIndex(position);
    setFocusedIndex(position);
    toggleSelectionByBoardIndex(card.index);
  }

  function handleCardHover(position: number | null, event?: MouseEvent): void {
    if (position !== null) {
      const point = event ? pointFromMouseEvent(event) : undefined;
      if (point && suppressedMousePoint && sameMousePoint(point, suppressedMousePoint)) {
        return;
      }

      lastMousePoint = point;
      suppressedMousePoint = undefined;
      setInputMode("mouse");
    }

    setHoveredIndex(position);
  }

  function enterKeyboardMode(): void {
    if (inputMode() === "mouse") {
      const hovered = hoveredIndex();
      if (hovered !== null) {
        setFocusedIndex(hovered);
      }
      suppressedMousePoint = lastMousePoint;
      setHoveredIndex(null);
      setInputMode("keyboard");
    }
  }

  function handleKey(key: KeyEvent): void {
    const name = key.name.toLowerCase();
    enterKeyboardMode();

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
      setHoveredIndex(null);
      setInputMode("keyboard");
      lastMousePoint = undefined;
      suppressedMousePoint = undefined;
      return;
    }

    if (focusedIndex() >= boardLength) {
      setFocusedIndex(boardLength - 1);
    }

    const hovered = hoveredIndex();
    if (hovered !== null && hovered >= boardLength) {
      setHoveredIndex(null);
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
        <Header />
        <box
            id="main-content"
            width="100%"
            flexGrow={1}
            alignItems="center"
            justifyContent="center"
            padding={1}
            backgroundColor="#0b0f10"
            overflow="hidden"
        >
          <box
              width="100%"
              height="100%"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              backgroundColor="#0b0f10"
          >
            <Show when={state() !== null}>
              <BoardGrid
                  cards={state()?.board ?? []}
                  focusedIndex={visualFocusedIndex()}
                  hoveredIndex={visualHoveredIndex()}
                  invalidIndexes={invalidIndexes()}
                  onCardClick={handleCardClick}
                  onCardHover={handleCardHover}
              />
            </Show>
          </box>
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

function pointFromMouseEvent(event: MouseEvent): MousePoint {
  return { x: event.x, y: event.y };
}

function sameMousePoint(left: MousePoint, right: MousePoint): boolean {
  return left.x === right.x && left.y === right.y;
}
