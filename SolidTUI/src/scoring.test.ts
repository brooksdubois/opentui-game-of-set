import { describe, expect, test } from "bun:test";
import { toBonusTickerEvents } from "./scoring";

describe("bonus ticker mapping", () => {
  test("formats signed labels from engine score events", () => {
    const mapped = toBonusTickerEvents(
      [
        { label: "Set", points: 3 },
        { label: "Invalid set", points: -2 },
      ],
      1_000,
    );

    expect(mapped.map((event) => event.label)).toEqual(["+3 Set", "-2 Invalid set"]);
  });
});
