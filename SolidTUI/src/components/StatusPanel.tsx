import type { GameViewState } from "../types";

interface StatusPanelProps {
  state: GameViewState | null;
  focusedIndex: number;
  message: string;
  busy: boolean;
}

export function StatusPanel(props: StatusPanelProps) {
  const selectedCount = () => props.state?.board.filter((card) => card.selected).length ?? 0;
  const statusText = () => {
    if (!props.state) return props.busy ? "Starting engine..." : props.message;

    return `Status: ${props.state.status} | Deck: ${props.state.remainingCards} | Sets: ${
      props.state.foundSets
    } | Selected: ${selectedCount()} | Focus: ${props.focusedIndex + 1} ${
      props.busy ? "| Working..." : props.message ? `| ${props.message}` : ""
    }`;
  };
  const clearedStatusText = () => statusText().padEnd(180, " ");

  return (
    <box border borderColor="#3a4a50" paddingX={2} height={3} alignItems="center" width="100%">
      <text fg="#d7e0e5" content={clearedStatusText()} wrapMode="none" truncate />
    </box>
  );
}
