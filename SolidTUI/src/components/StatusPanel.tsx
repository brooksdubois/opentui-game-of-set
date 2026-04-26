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
    if (!props.state) return "";

    return `Status: ${props.state.status} | Score: ${props.state.score} | Deck: ${props.state.remainingCards} | Sets: ${
      props.state.foundSets
    } | Selected: ${selectedCount()} | Focus: ${props.focusedIndex + 1} ${
      props.busy ? "| Working..." : props.message ? `| ${props.message}` : ""
    }`;
  };
  return (
    <box backgroundColor="#0b0f10" paddingX={2} height={1} alignItems="center" width="100%">
      <text fg="#d7e0e5" content={statusText()} wrapMode="none" truncate />
    </box>
  );
}
