import { testRender } from "@opentui/solid";
import { App } from "./components/App";

const setup = await testRender(() => <App />, { width: 160, height: 44 });
await setup.renderOnce();

const frame = setup.captureCharFrame();
setup.renderer.destroy();

const expectedText = ["Welcome to the Set Game", ".-'''-.", ".''.", "'-___-'"];
const missingText = expectedText.filter((text) => !frame.includes(text));

if (missingText.length > 0) {
  throw new Error(`Static TUI smoke test failed. Missing: ${missingText.join(", ")}`);
}

if (frame.includes("Enter 3 cells")) {
  throw new Error("Static TUI smoke test failed. Prompt footer is still visible.");
}

console.log("Static TUI smoke test passed");
