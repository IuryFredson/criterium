import { describe, expect, it } from "vitest";
import { parseJobProfile } from "../src/core/job.js";

describe("parseJobProfile", () => {
  it("detects required and preferred skills from English job descriptions", () => {
    const profile = parseJobProfile(`
      Senior Backend Developer - Remote
      Requirements:
      - Must have Node.js, TypeScript and PostgreSQL experience
      - Required Docker experience
      Nice to have:
      - AWS and Kubernetes are a plus
    `);

    expect(profile.seniority).toBe("senior");
    expect(profile.workModel).toBe("remote");
    expect(profile.language).toBe("en");
    expect(profile.requiredSkills.map((skill) => skill.skill)).toEqual(
      expect.arrayContaining(["Node.js", "TypeScript", "PostgreSQL", "Docker"])
    );
    expect(profile.preferredSkills.map((skill) => skill.skill)).toEqual(expect.arrayContaining(["AWS", "Kubernetes"]));
  });

  it("detects Portuguese seniority and work model", () => {
    const profile = parseJobProfile(`
      Vaga Desenvolvedor Backend Pleno Híbrido
      Requisitos obrigatórios: Node.js, TypeScript e PostgreSQL.
      Diferencial: AWS e CI/CD.
    `);

    expect(profile.seniority).toBe("mid");
    expect(profile.workModel).toBe("hybrid");
    expect(profile.language).toBe("pt");
    expect(profile.requiredSkills.map((skill) => skill.skill)).toEqual(
      expect.arrayContaining(["Node.js", "TypeScript", "PostgreSQL"])
    );
    expect(profile.preferredSkills.map((skill) => skill.skill)).toEqual(expect.arrayContaining(["AWS", "CI/CD"]));
  });

  it("keeps preferred skills preferred when sections are on one line", () => {
    const profile = parseJobProfile(
      "Senior Backend Developer Remote. Requirements: Must have Node.js, TypeScript, PostgreSQL and Docker experience. Nice to have: AWS and Kubernetes."
    );

    expect(profile.requiredSkills.map((skill) => skill.skill)).toEqual(
      expect.arrayContaining(["Node.js", "TypeScript", "PostgreSQL", "Docker"])
    );
    expect(profile.requiredSkills.map((skill) => skill.skill)).not.toEqual(expect.arrayContaining(["AWS", "Kubernetes"]));
    expect(profile.preferredSkills.map((skill) => skill.skill)).toEqual(expect.arrayContaining(["AWS", "Kubernetes"]));
  });
});
