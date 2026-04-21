import { mockGameState } from "../mockState";
import { GameScreen } from "./GameScreen";

export function App() {
  return <GameScreen state={mockGameState} />;
}
