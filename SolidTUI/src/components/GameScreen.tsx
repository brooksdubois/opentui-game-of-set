import type { MockGameState } from "../types";
import { BoardGrid } from "./BoardGrid";
import { Header } from "./Header.tsx";
import { StatusPanel } from "./StatusPanel.tsx";

interface GameScreenProps {
  state: MockGameState;
}

export function GameScreen(props: GameScreenProps) {
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
      <Header title={props.state.title} />
      <box flexGrow={1} alignItems="center" justifyContent="center" padding={1}>
        <BoardGrid cards={props.state.board} />
      </box>
      <StatusPanel state={props.state} />
    </box>
  );
}
