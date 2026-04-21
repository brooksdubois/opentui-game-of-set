import { For } from "solid-js";
import type { SetCard } from "../types";
import { CardView } from "./CardView";

interface BoardGridProps {
  cards: SetCard[];
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
      width={149}
      height={35}
      flexDirection="column"
      rowGap={1}
    >
      <For each={rows()}>
        {(row) => (
          <box flexDirection="row" columnGap={3} height={11}>
            <For each={row}>
              {(card) => <CardView card={card} />}
            </For>
          </box>
        )}
      </For>
    </box>
  );
}
