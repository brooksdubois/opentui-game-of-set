import { render } from "@opentui/solid";
import { App } from "./src/components/App";

await render(() => <App />, {
  backgroundColor: "#0b0f10",
  clearOnShutdown: true,
  consoleMode: "disabled",
  exitOnCtrlC: true,
  screenMode: "alternate-screen",
});
