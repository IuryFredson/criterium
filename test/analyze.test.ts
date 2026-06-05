import { describe, expect, it } from "vitest";
import { analyzeResumeForJob } from "../src/services/analyze.js";

const resumeText = `
  Iury Developer
  iury@example.com
  https://github.com/iury

  Summary
  Backend Developer with 4 years of experience.

  Skills
  Node.js, TypeScript, Docker, REST APIs

  Experience
  Built backend systems with Node.js and TypeScript.
`;

const jobText = `
  We need a Backend Developer with Node.js, TypeScript, PostgreSQL, Docker, REST APIs and AWS experience.
`;

describe("analyzeResumeForJob", () => {
  it("returns deterministic keyword gaps, category scores, and resume profile", () => {
    const result = analyzeResumeForJob({ resumeText, jobText, targetRole: "Backend Developer" });

    expect(result.foundKeywords).toEqual(expect.arrayContaining(["Node.js", "TypeScript", "Docker", "REST"]));
    expect(result.missingKeywords).toEqual(expect.arrayContaining(["PostgreSQL", "AWS"]));
    expect(result.summary).toMatchObject({
      requiredSkills: 6,
      matchedSkills: 4,
      missingSkills: 2,
      requiredSkillGaps: 2,
      resumeSkills: 4,
      resumeExperienceYears: 4
    });
    expect(result.resumeProfile.contact.emails).toEqual(["iury@example.com"]);
    expect(result.resumeProfile.signals.hasExperienceSection).toBe(true);
    expect(result.categoryScores).toContainEqual({ category: "database", found: 0, required: 1, score: 0 });
    expect(result.dimensionScores).toEqual(
      expect.arrayContaining([
        { dimension: "keywords", score: 67, status: "warn" },
        { dimension: "required", score: 67, status: "warn" },
        { dimension: "contact", score: 100, status: "pass" },
        { dimension: "structure", score: 100, status: "pass" },
        { dimension: "role", score: 100, status: "pass" }
      ])
    );
    expect(result.actions[0]).toMatchObject({ priority: "high", code: "MISSING_REQUIRED_KEYWORD" });
  });

  it("flags missing contact email", () => {
    const result = analyzeResumeForJob({
      resumeText: `
        Summary
        Backend Developer with Node.js, TypeScript and Docker experience across production systems.
        Skills
        Node.js, TypeScript, Docker
        Experience
        Built APIs.
      `,
      jobText,
      targetRole: "Backend Developer"
    });

    expect(result.checks).toContainEqual({
      level: "fail",
      code: "MISSING_EMAIL",
      message: "Resume does not include a detectable email address."
    });
  });

  it("promotes missing required skills to fail checks", () => {
    const result = analyzeResumeForJob({
      resumeText,
      jobText: `
        Backend Developer
        Requirements:
        - Must have Node.js, TypeScript, PostgreSQL and AWS experience.
      `,
      targetRole: "Backend Developer"
    });

    expect(result.summary.requiredSkillGaps).toBe(2);
    expect(result.checks).toEqual(
      expect.arrayContaining([
        {
          level: "fail",
          code: "MISSING_REQUIRED_KEYWORD",
          message: "The job marks PostgreSQL as required, but the resume does not mention it."
        },
        {
          level: "fail",
          code: "MISSING_REQUIRED_KEYWORD",
          message: "The job marks AWS as required, but the resume does not mention it."
        }
      ])
    );
  });

  it("flags missing resume structure sections", () => {
    const result = analyzeResumeForJob({
      resumeText: "Iury Developer iury@example.com Backend Developer with Node.js and TypeScript.",
      jobText,
      targetRole: "Backend Developer"
    });

    expect(result.checks).toEqual(
      expect.arrayContaining([
        {
          level: "warn",
          code: "MISSING_EXPERIENCE_SECTION",
          message: "Resume does not include a detectable experience section."
        },
        {
          level: "warn",
          code: "MISSING_SKILLS_SECTION",
          message: "Resume does not include a detectable skills section."
        }
      ])
    );
  });
});
