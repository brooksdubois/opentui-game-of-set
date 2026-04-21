import { For } from "solid-js";
import type { SetCard } from "../types";
import { CardView } from "./CardView";

interface BoardGridProps {
  cards: SetCard[];
}

function rowLabel(rowIndex: number): string {
  return String.fromCharCode("a".charCodeAt(0) + rowIndex);
}

export function BoardGrid(props: BoardGridProps) {
  const rows = () => [
    props.cards.slice(0, 4),
    props.cards.slice(4, 8),
    props.cards.slice(8, 12),
  ];

  return (
    <box
      id="board-grid"
      border
      borderColor="#52616b"
      title=" Board "
      padding={1}
      flexDirection="column"
      gap={1}
      flexGrow={1}
      minHeight={35}
    >
      <For each={rows()}>
        {(row, rowIndex) => (
          <box flexDirection="row" columnGap={1} height={10}>
            <For each={row}>
              {(card, columnIndex) => (
                <CardView card={card} label={`${rowLabel(rowIndex())}${columnIndex() + 1}`} />
              )}
            </For>
          </box>
        )}
      </For>
    </box>
  );
}
