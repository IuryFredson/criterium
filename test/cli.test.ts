import { describe, expect, it } from "vitest";
import { parseArgs } from "../src/cli.js";

describe("parseArgs", () => {
  it("parses analyze options", () => {
    expect(
      parseArgs(["analyze", "--resume", "resume.pdf", "--job", "job.txt", "--target-role", "Backend Developer"])
    ).toEqual({
      command: "analyze",
      resumePath: "resume.pdf",
      jobPath: "job.txt",
      targetRole: "Backend Developer",
      pretty: true
    });
  });

  it("supports short aliases and compact output", () => {
    expect(parseArgs(["analyze", "-r", "resume.txt", "-j", "job.txt", "--compact"])).toEqual({
      command: "analyze",
      resumePath: "resume.txt",
      jobPath: "job.txt",
      targetRole: undefined,
      pretty: false
    });
  });

  it("requires a resume path", () => {
    expect(() => parseArgs(["analyze", "--job", "job.txt"])).toThrow("Missing required option: --resume <file>");
  });
});
