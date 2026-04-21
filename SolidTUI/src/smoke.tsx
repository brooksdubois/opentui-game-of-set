import { testRender } from "@opentui/solid";
import { App } from "./components/App";

const setup = await testRender(() => <App />, { width: 130, height: 58 });
await setup.renderOnce();

const frame = setup.captureCharFrame();
setup.renderer.destroy();

const expectedText = ["Welcome to the Set Game", "Remaining deck: 69", "Enter 3 cells", "a1", "c4"];
const missingText = expectedText.filter((text) => !frame.includes(text));

if (missingText.length > 0) {
  throw new Error(`Static TUI smoke test failed. Missing: ${missingText.join(", ")}`);
}

console.log("Static TUI smoke test passed");
