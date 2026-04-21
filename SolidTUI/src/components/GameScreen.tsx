import type { MockGameState } from "../types";
import { BoardGrid } from "./BoardGrid";
import { FooterHelp } from "./FooterHelp";
import { Header } from "./Header";
import { StatusPanel } from "./StatusPanel";

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
      padding={1}
      backgroundColor="#0b0f10"
      gap={1}
    >
      <Header title={props.state.title} />
      <StatusPanel state={props.state} />
      <BoardGrid cards={props.state.board} />
      <FooterHelp prompt={props.state.prompt} />
    </box>
  );
}
