import { For } from "solid-js";
import type { SetCard } from "../types";
import { CardView } from "./CardView";

interface BoardGridProps {
  cards: SetCard[];
  focusedIndex: number;
  invalidIndexes: Set<number>;
}

export function BoardGrid(props: BoardGridProps) {
  const rows = () => {
    const rowCount = Math.ceil(props.cards.length / 4);
    return Array.from({ length: rowCount }, (_, rowIndex) =>
      props.cards.slice(rowIndex * 4, rowIndex * 4 + 4),
    );
  };

  return (
    <box
      id="board-grid"
      width={149}
      height={Math.max(11, rows().length * 11 + Math.max(0, rows().length - 1))}
      flexDirection="column"
      rowGap={1}
    >
      <For each={rows()}>
        {(row, rowIndex) => (
          <box flexDirection="row" columnGap={3} height={11}>
            <For each={row}>
              {(card, columnIndex) => (
                <CardView
                  card={card}
                  focused={props.focusedIndex === rowIndex() * 4 + columnIndex()}
                  invalid={props.invalidIndexes.has(card.index)}
                />
              )}
            </For>
          </box>
        )}
      </For>
    </box>
  );
}
