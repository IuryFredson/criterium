import { describe, expect, it } from "vitest";
import { hasTerm, normalizeText } from "../src/core/text.js";

describe("text utilities", () => {
  it("normalizes whitespace and casing", () => {
    expect(normalizeText("  Node.js\n  TypeScript  ")).toBe("node.js typescript");
  });

  it("matches full terms without matching inside larger words", () => {
    expect(hasTerm("worked with react and node", "react")).toBe(true);
    expect(hasTerm("created reactive interfaces", "react")).toBe(false);
  });
});
