import { For, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import type { MouseEvent } from "@opentui/core";
import type { SetCard } from "../types";
import { CardView } from "./CardView";
import type { BonusTickerEvent } from "../scoring";

interface BoardGridProps {
  cards: SetCard[];
  focusedIndex: number;
  hoveredIndex: number | null;
  invalidIndexes: Set<number>;
  bonusEvents?: BonusTickerEvent[];
  compact?: boolean;
  onCardClick: (position: number, card: SetCard, event: MouseEvent) => void;
  onCardHover: (position: number | null, event?: MouseEvent) => void;
}

export function BoardGrid(props: BoardGridProps) {
  const rowHeight = 11;
  const rowGap = () => (props.compact ? 0 : 1);
  const [now, setNow] = createSignal(Date.now());
  const rows = () => {
    const rowCount = Math.ceil(props.cards.length / 4);
    return Array.from({ length: rowCount }, (_, rowIndex) =>
      props.cards.slice(rowIndex * 4, rowIndex * 4 + 4),
    );
  };
  const gridHeight = () =>
    Math.max(rowHeight, rows().length * rowHeight + Math.max(0, rows().length - 1) * rowGap());
  let interval: ReturnType<typeof setInterval> | undefined;

  onMount(() => {
    interval = setInterval(() => setNow(Date.now()), 120);
  });

  onCleanup(() => {
    if (interval) clearInterval(interval);
  });

  const activeBonusEvents = createMemo(() =>
    (props.bonusEvents ?? [])
      .filter((event) => now() - event.createdAt < event.ttlMs)
      .sort((left, right) => left.createdAt - right.createdAt),
  );

  const tickerColor = (event: BonusTickerEvent) => {
    const progress = (now() - event.createdAt) / event.ttlMs;
    if (progress > 0.75) return event.points >= 0 ? "#8ea4b3" : "#b69090";
    if (progress > 0.45) return event.points >= 0 ? "#c7b76a" : "#d79a9a";
    return event.points >= 0 ? "#f6d365" : "#ff8d8d";
  };

  return (
    <box
      id="board-grid"
      width={149}
      height={gridHeight()}
      flexDirection="column"
      rowGap={rowGap()}
      position="relative"
    >
      <For each={rows()}>
        {(row, rowIndex) => (
          <box flexDirection="row" columnGap={3} height={rowHeight}>
            <For each={row}>
              {(card, columnIndex) => (
                <CardView
                  card={card}
                  focused={props.focusedIndex === rowIndex() * 4 + columnIndex()}
                  hovered={props.hoveredIndex === rowIndex() * 4 + columnIndex()}
                  invalid={props.invalidIndexes.has(card.index)}
                  onClick={(event) => props.onCardClick(rowIndex() * 4 + columnIndex(), card, event)}
                  onHoverStart={(event) => props.onCardHover(rowIndex() * 4 + columnIndex(), event)}
                  onHoverEnd={() => props.onCardHover(null)}
                />
              )}
            </For>
          </box>
        )}
      </For>
      <For each={activeBonusEvents()}>
        {(event, index) => {
          const age = now() - event.createdAt;
          const rise = Math.floor(age / 250);
          return (
            <text
              position="absolute"
              left={Math.max(0, 149 - event.label.length - 3)}
              top={Math.max(0, gridHeight() - 2 - index() - rise)}
              fg={tickerColor(event)}
              content={event.label}
              wrapMode="none"
              selectable={false}
            />
          );
        }}
      </For>
    </box>
  );
}
