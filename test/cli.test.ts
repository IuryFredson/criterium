import { describe, expect, it } from "vitest";
import { formatResult, parseArgs } from "../src/cli.js";
import { analyzeResumeForJob } from "../src/services/analyze.js";

describe("parseArgs", () => {
  it("parses analyze options", () => {
    expect(
      parseArgs(["analyze", "--resume", "resume.pdf", "--job", "job.txt", "--target-role", "Backend Developer"])
    ).toEqual({
      command: "analyze",
      resumePath: "resume.pdf",
      jobPath: "job.txt",
      targetRole: "Backend Developer",
      format: "json",
      pretty: true
    });
  });

  it("supports short aliases and compact output", () => {
    expect(parseArgs(["analyze", "-r", "resume.txt", "-j", "job.txt", "--compact"])).toEqual({
      command: "analyze",
      resumePath: "resume.txt",
      jobPath: "job.txt",
      targetRole: undefined,
      format: "json",
      pretty: false
    });
  });

  it("supports summary output", () => {
    expect(parseArgs(["analyze", "--resume", "resume.txt", "--job", "job.txt", "--format", "summary"])).toMatchObject({
      format: "summary"
    });
  });

  it("rejects invalid output formats", () => {
    expect(() => parseArgs(["analyze", "--resume", "resume.txt", "--job", "job.txt", "--format", "xml"])).toThrow(
      "Invalid --format value. Expected json or summary."
    );
  });

  it("requires a resume path", () => {
    expect(() => parseArgs(["analyze", "--job", "job.txt"])).toThrow("Missing required option: --resume <file>");
  });
});

describe("formatResult", () => {
  it("formats a human-readable summary", () => {
    const result = analyzeResumeForJob({
      resumeText: `
        Iury Developer
        iury@example.com
        Summary
        Backend Developer with 4 years of experience.
        Skills
        Node.js, TypeScript, Docker
        Experience
        Built APIs.
      `,
      jobText: "Requirements: Must have Node.js, TypeScript, PostgreSQL and Docker experience. Nice to have: AWS.",
      targetRole: "Backend Developer"
    });

    expect(formatResult(result, { format: "summary", pretty: true })).toContain("criterium report");
    expect(formatResult(result, { format: "summary", pretty: true })).toContain("requiredSkillGaps: 1");
    expect(formatResult(result, { format: "summary", pretty: true })).toContain("[high] Add or address a required skill gap");
  });
});
