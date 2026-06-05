import { describe, expect, it } from "vitest";
import { parseResumeProfile } from "../src/core/resume.js";

describe("parseResumeProfile", () => {
  it("extracts contact data, sections, skills, and explicit experience years", () => {
    const profile = parseResumeProfile(`
      Iury Developer
      iury@example.com
      https://github.com/iury
      linkedin.com/in/iury

      Summary
      Backend Developer with 5 years of experience.

      Skills
      Node.js, TypeScript, PostgreSQL, Docker, REST APIs

      Experience
      Company A - Backend Developer
      Built APIs with Node.js.

      Education
      Computer Science
    `);

    expect(profile.contact.emails).toEqual(["iury@example.com"]);
    expect(profile.contact.hasGithub).toBe(true);
    expect(profile.contact.hasLinkedIn).toBe(true);
    expect(profile.experienceYears).toBe(5);
    expect(profile.skills.map((skill) => skill.name)).toEqual(
      expect.arrayContaining(["Node.js", "TypeScript", "PostgreSQL", "Docker", "REST"])
    );
    expect(profile.signals).toMatchObject({
      hasExperienceSection: true,
      hasSkillsSection: true,
      hasEducationSection: true
    });
  });

  it("estimates experience years from date ranges", () => {
    const profile = parseResumeProfile(`
      Experience
      Backend Developer | 2020 - 2024
      Skills
      Node.js and TypeScript
    `);

    expect(profile.experienceYears).toBe(4);
  });
});
