import { describe, expect, it } from "vitest";
import { findSkills } from "../src/core/skills.js";

describe("skill matching", () => {
  it("does not infer JavaScript from Node.js suffix", () => {
    const skills = findSkills("backend work with node.js and docker").map((skill) => skill.name);

    expect(skills).toContain("Node.js");
    expect(skills).not.toContain("JavaScript");
  });

  it("maps aliases to canonical skill names", () => {
    const skills = findSkills("built api rest with postgres and amazon web services").map((skill) => skill.name);

    expect(skills).toEqual(expect.arrayContaining(["REST", "PostgreSQL", "AWS"]));
  });
});
