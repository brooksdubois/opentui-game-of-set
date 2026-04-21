import type { CardColor, Fill, SetCard, Shape } from "./types";

const blockHeight = 7;
const cardBodyWidth = 33;

export const colorByCardColor: Record<CardColor, string> = {
  red: "#ff5f5f",
  green: "#5fff87",
  blue: "#5fafff",
};

const fillCharByFill: Record<Fill, string> = {
  empty: " ",
  shaded: "⣉",
  full: "▓",
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

function getSquiggle(fill: string): string {
  return [
    "  .''.   ",
    `  ╲${fill}${fill}${fill}╲  `,
    `  ╱${fill}${fill}${fill}╱  `,
    ` ╱${fill}${fill}${fill}╲   `,
    `  ╲${fill}${fill}${fill}╲  `,
    `  ╱${fill}${fill}${fill}╱  `,
    "  '..'   ",
  ].join("\n");
}

function getDiamond(fill: string): string {
  return [
    "    A    ",
    `   ╱${fill}╲   `,
    `  ╱${fill}${fill}${fill}╲  `,
    ` <${fill}${fill}${fill}${fill}${fill}> `,
    `  ╲${fill}${fill}${fill}╱  `,
    `   ╲${fill}╱   `,
    "    V    ",
  ].join("\n");
}

function getOval(fill: string): string {
  return [
    " .-'''-. ",
    ` |${fill}${fill}${fill}${fill}${fill}| `,
    ` |${fill}${fill}${fill}${fill}${fill}| `,
    ` |${fill}${fill}${fill}${fill}${fill}| `,
    ` |${fill}${fill}${fill}${fill}${fill}| `,
    ` |${fill}${fill}${fill}${fill}${fill}| `,
    " '-___-' ",
  ].join("\n");
}

function getShape(shape: Shape, fill: string): string {
  if (shape === "oval") {
    return getOval(fill);
  }

  if (shape === "diamond") {
    return getDiamond(fill);
  }

  return getSquiggle(fill);
}

function stripOuterCardEdges(cardBody: string): string {
  return lines(cardBody)
    .map((line) => line.slice(1, -1).replaceAll("`", " "))
    .join("\n");
}

function drawCard1(shape: Shape, fill: Fill): string {
  const fillCode = fillCharByFill[fill];
  const asciiShape = getShape(shape, fillCode);
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
  const fillCode = fillCharByFill[fill];
  const asciiShape = getShape(shape, fillCode);
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
  const fillCode = fillCharByFill[fill];
  const asciiShape = getShape(shape, fillCode);
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
