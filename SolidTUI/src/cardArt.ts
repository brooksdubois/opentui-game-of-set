import type { CardColor, Fill, SetCard, Shape } from "./types";

const blockHeight = 7;
const cardBodyWidth = 33;

export const colorByCardColor: Record<CardColor, string> = {
  red: "#ff5f5f",
  green: "#5fff87",
  blue: "#5fafff",
};

function lines(text: string): string[] {
  return text.split("\n");
}

function combineLineWise(...blocks: string[]): string {
  const splitBlocks = blocks.map(lines);
  const expectedLineCount = splitBlocks[0]?.length ?? 0;

  if (splitBlocks.some((block) => block.length !== expectedLineCount)) {
    throw new Error("Line Length Error");
  }

  return Array.from({ length: expectedLineCount }, (_, lineIndex) =>
    splitBlocks.map((block) => block[lineIndex] ?? "").join(""),
  ).join("\n");
}

function emptySpace(): string {
  return Array.from({ length: blockHeight }, () => " ").join("\n");
}

function getEdgeCard(): string {
  return Array.from({ length: blockHeight }, () => "!").join("\n");
}

function getLeftCard(): string {
  return combineLineWise(getEdgeCard(), emptySpace(), emptySpace(), emptySpace());
}

function getRightCard(): string {
  return combineLineWise(emptySpace(), emptySpace(), emptySpace(), getEdgeCard());
}

const squiggleEmpty = [
  "  .──.   ",
  "  ╲   ╲  ",
  "  ╱   ╱  ",
  " (   │   ",
  "  ╲   ╲  ",
  "  ╱   ╱  ",
  "  '──'   ",
].join("\n");

const squiggleLight = [
  "  .──.   ",
  "  ╲⣉⣉⣉╲  ",
  "  ╱⣉⣉⣉╱  ",
  " (⣉⣉⣉│   ",
  "  ╲⣉⣉⣉╲  ",
  "  ╱⣉⣉⣉╱  ",
  "  '──'    ",
].join("\n");

const squiggleFull = [
  "  ▗▟▙▖   ",
  "  ◥███◣  ",
  "  ◢███◤  ",
  " ◖███▎   ",
  "  ◥███◣  ",
  "  ◢███◤  ",
  "  ▝▜▛▘   ",
].join("\n");

const diamondEmpty = [
  "    A    ",
  "   ╱ ╲   ",
  "  ╱   ╲  ",
  " <     > ",
  "  ╲   ╱  ",
  "   ╲ ╱   ",
  "    V    ",
].join("\n");

const diamondLight = [
  "    A    ",
  "   ╱⣉╲   ",
  "  ╱⣉⣉⣉╲  ",
  " <⣉⣉⣉⣉⣉> ",
  "  ╲⣉⣉⣉╱  ",
  "   ╲⣉╱   ",
  "    V    ",
].join("\n");

const diamondFull = [
  "    ▲    ",
  "   ◢█◣   ",
  "  ◢███◣  ",
  " ◀█████▶ ",
  "  ◥███◤  ",
  "   ◥█◤   ",
  "    ▼    ",
].join("\n");

const ovalEmpty = [
  " .-'''-. ",
  " |     | ",
  " |     | ",
  " |     | ",
  " |     | ",
  " |     | ",
  " '-___-' ",
].join("\n");

const ovalLight = [
  " .-'''-. ",
  " |⣉⣉⣉⣉⣉| ",
  " |⣉⣉⣉⣉⣉| ",
  " |⣉⣉⣉⣉⣉| ",
  " |⣉⣉⣉⣉⣉| ",
  " |⣉⣉⣉⣉⣉| ",
  " '-___-' ",
].join("\n");

const ovalFull = [
  " ▗▅▇█▇▅▖ ",
  " ▐█████▌ ",
  " ▐█████▌ ",
  " ▐█████▌ ",
  " ▐█████▌ ",
  " ▐█████▌ ",
  " ▝▀███▀▘ ",
].join("\n");

const shapeArtByShapeAndFill: Record<Shape, Record<Fill, string>> = {
  oval: {
    empty: ovalEmpty,
    shaded: ovalLight,
    full: ovalFull,
  },
  diamond: {
    empty: diamondEmpty,
    shaded: diamondLight,
    full: diamondFull,
  },
  squiggle: {
    empty: squiggleEmpty,
    shaded: squiggleLight,
    full: squiggleFull,
  },
};

function getShape(shape: Shape, fill: Fill): string {
  return shapeArtByShapeAndFill[shape][fill];
}

function stripOuterCardEdges(cardBody: string): string {
  return lines(cardBody)
    .map((line) => line.slice(1, -1).replaceAll("`", " "))
    .join("\n");
}

function drawCard1(shape: Shape, fill: Fill): string {
  const asciiShape = getShape(shape, fill);
  const body = combineLineWise(
    getLeftCard(),
    emptySpace(),
    emptySpace(),
    emptySpace(),
    emptySpace(),
    emptySpace(),
    emptySpace(),
    emptySpace(),
    emptySpace(),
    emptySpace(),
    asciiShape,
    emptySpace(),
    emptySpace(),
    emptySpace(),
    emptySpace(),
    emptySpace(),
    emptySpace(),
    emptySpace(),
    emptySpace(),
    emptySpace(),
    getRightCard(),
  );

  return stripOuterCardEdges(body);
}

function drawCard2(shape: Shape, fill: Fill): string {
  const asciiShape = getShape(shape, fill);
  const body = combineLineWise(
    getLeftCard(),
    emptySpace(),
    emptySpace(),
    emptySpace(),
    asciiShape,
    emptySpace(),
    emptySpace(),
    emptySpace(),
    asciiShape,
    emptySpace(),
    emptySpace(),
    emptySpace(),
    getRightCard(),
  );

  return stripOuterCardEdges(body);
}

function drawCard3(shape: Shape, fill: Fill): string {
  const asciiShape = getShape(shape, fill);
  const body = combineLineWise(getLeftCard(), asciiShape, asciiShape, asciiShape, getRightCard());

  return stripOuterCardEdges(body);
}

export function renderCardArt(card: SetCard): string {
  const body =
    card.count === 1
      ? drawCard1(card.shape, card.fill)
      : card.count === 2
        ? drawCard2(card.shape, card.fill)
        : drawCard3(card.shape, card.fill);

  return [" ".repeat(cardBodyWidth), body].join("\n");
}
