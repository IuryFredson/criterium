import { describe, expect, it } from "vitest";
import { analyzeResumeForJob } from "../src/services/analyze.js";

const resumeText = `
  Iury Developer
  iury@example.com
  Backend Developer with Node.js, TypeScript, Docker and REST APIs experience.
`;

const jobText = `
  We need a Backend Developer with Node.js, TypeScript, PostgreSQL, Docker, REST APIs and AWS experience.
`;

describe("analyzeResumeForJob", () => {
  it("returns deterministic keyword gaps and category scores", () => {
    const result = analyzeResumeForJob({ resumeText, jobText, targetRole: "Backend Developer" });

    expect(result.foundKeywords).toEqual(expect.arrayContaining(["Node.js", "TypeScript", "Docker", "REST"]));
    expect(result.missingKeywords).toEqual(expect.arrayContaining(["PostgreSQL", "AWS"]));
    expect(result.summary).toEqual({ requiredSkills: 6, matchedSkills: 4, missingSkills: 2, requiredSkillGaps: 2 });
    expect(result.categoryScores).toContainEqual({ category: "database", found: 0, required: 1, score: 0 });
  });

  it("flags missing contact email", () => {
    const result = analyzeResumeForJob({
      resumeText: "Backend Developer with Node.js, TypeScript and Docker experience across production systems.",
      jobText,
      targetRole: "Backend Developer"
    });

    expect(result.checks).toContainEqual({
      level: "fail",
      code: "MISSING_EMAIL",
      message: "Resume does not include a detectable email address."
    });
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
