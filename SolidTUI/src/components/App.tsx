import type { EngineClient } from "../engine/engineClient";
import { createKotlinEngineClient } from "../engine/engineClient";
import { GameScreen } from "./GameScreen";

interface AppProps {
  client?: EngineClient;
}

export function App(props: AppProps) {
  const client = props.client ?? createKotlinEngineClient();
  return <GameScreen client={client} />;
}
