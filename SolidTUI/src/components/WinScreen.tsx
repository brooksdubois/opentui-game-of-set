import { For, createMemo, createSignal, onCleanup, onMount } from "solid-js";

const stageWidth = 149;
const stageHeight = 31;
const fireworkCycle = 18;

const colors = ["#ff5f5f", "#f6d365", "#5fff87", "#5fafff", "#c3befd"];
const sparkChars = ["*", "+", ".", "`"];

const bursts = [
  { x: 24, y: 6, offset: 0 },
  { x: 122, y: 7, offset: 4 },
  { x: 38, y: 24, offset: 8 },
  { x: 112, y: 23, offset: 12 },
  { x: 74, y: 5, offset: 15 },
];

const directions = [
  { x: 0, y: -1 },
  { x: 1, y: -1 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
  { x: -1, y: 1 },
  { x: -1, y: 0 },
  { x: -1, y: -1 },
];

interface Spark {
  id: string;
  x: number;
  y: number;
  char: string;
  color: string;
}

export function WinScreen() {
  const [tick, setTick] = createSignal(0);
  let interval: ReturnType<typeof setInterval> | undefined;

  onMount(() => {
    interval = setInterval(() => setTick((current) => current + 1), 120);
  });

  onCleanup(() => {
    if (interval) clearInterval(interval);
  });

  const sparks = createMemo<Spark[]>(() => {
    const currentTick = tick();

    return bursts.flatMap((burst, burstIndex) => {
      const age = (currentTick + burst.offset) % fireworkCycle;
      if (age < 2 || age > 11) return [];

      const radius = age - 1;
      const char = sparkChars[Math.min(sparkChars.length - 1, Math.floor(radius / 3))] ?? ".";
      const color = colors[(burstIndex + Math.floor(currentTick / 3)) % colors.length] ?? "#f6d365";

      return directions
        .map((direction, directionIndex) => ({
          id: `${burstIndex}-${directionIndex}-${age}`,
          x: burst.x + direction.x * radius * 2,
          y: burst.y + direction.y * radius,
          char,
          color,
        }))
        .filter((spark) => spark.x >= 0 && spark.x < stageWidth && spark.y >= 0 && spark.y < stageHeight);
    });
  });

  return (
    <box
      id="win-screen"
      width={stageWidth}
      height={stageHeight}
      position="relative"
      backgroundColor="#0b0f10"
      overflow="hidden"
    >
      <For each={sparks()}>
        {(spark) => (
          <text
            position="absolute"
            left={spark.x}
            top={spark.y}
            zIndex={0}
            fg={spark.color}
            content={spark.char}
            wrapMode="none"
            selectable={false}
          />
        )}
      </For>
      <box
        width="100%"
        height="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        zIndex={1}
      >
        <ascii_font text="Win!" font="huge" color="#f6d365" backgroundColor="#0b0f10" selectable={false} />
      </box>
    </box>
  );
}
