import type { CardColor, Fill, SetCard, Shape } from "./types";

export const colorByCardColor: Record<CardColor, string> = {
  red: "#ff5f5f",
  green: "#5fff87",
  blue: "#5fafff",
};

const fillCharByFill: Record<Fill, string> = {
  empty: " ",
  shaded: ".",
  full: "=",
};

function shapeLines(shape: Shape, fill: string): string[] {
  if (shape === "oval") {
    return [
      " .-'''-. ",
      ` |${fill.repeat(5)}| `,
      " '-___-' ",
    ];
  }

  if (shape === "diamond") {
    return [
      "    A    ",
      `  /${fill.repeat(3)}\\  `,
      "    V    ",
    ];
  }

  return [
    "  .''.   ",
    ` /${fill.repeat(3)}\\   `,
    "  '..'   ",
  ];
}

export function renderCardArt(card: SetCard): string {
  const fill = fillCharByFill[card.fill];
  const glyph = shapeLines(card.shape, fill);

  if (card.count === 1) {
    return ["         ", ...glyph, "         "].join("\n");
  }

  if (card.count === 2) {
    return [glyph[0], glyph[1], glyph[2], glyph[0], glyph[1], glyph[2]].join("\n");
  }

  return [
    glyph[0],
    glyph[1],
    glyph[2],
    glyph[0],
    glyph[1],
    glyph[2],
    glyph[0],
    glyph[1],
    glyph[2],
  ].join("\n");
}
