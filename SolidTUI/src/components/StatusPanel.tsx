import type { MockGameState } from "../types";

interface StatusPanelProps {
  state: MockGameState;
}

export function StatusPanel(props: StatusPanelProps) {
  return (
    <box border borderColor="#3a4a50" paddingX={2} height={3} alignItems="center">
      <text fg="#d7e0e5">
        Status: Running | Remaining deck: {props.state.remainingCards} | Found sets: {props.state.foundSets}
      </text>
    </box>
  );
}
