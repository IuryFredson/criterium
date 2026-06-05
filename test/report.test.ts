import { describe, expect, it } from "vitest";
import { buildDimensionScores, buildPrioritizedActions } from "../src/core/report.js";
import type { ResumeProfile } from "../src/core/resume.js";

const resumeProfile: ResumeProfile = {
  contact: {
    emails: ["iury@example.com"],
    urls: [],
    hasGithub: false,
    hasLinkedIn: false
  },
  sections: [],
  skills: [],
  experienceYears: null,
  signals: {
    hasExperienceSection: true,
    hasSkillsSection: false,
    hasEducationSection: false,
    hasProjectsSection: false
  }
};

describe("report utilities", () => {
  it("builds dimension scores from deterministic analysis inputs", () => {
    const scores = buildDimensionScores({
      requiredSkillCount: 4,
      foundSkillCount: 2,
      requiredSkillGapCount: 1,
      resumeProfile,
      targetRoleMatched: false
    });

    expect(scores).toEqual(
      expect.arrayContaining([
        { dimension: "keywords", score: 50, status: "warn" },
        { dimension: "required", score: 75, status: "warn" },
        { dimension: "contact", score: 100, status: "pass" },
        { dimension: "structure", score: 50, status: "warn" },
        { dimension: "role", score: 60, status: "warn" }
      ])
    );
  });

  it("prioritizes fail checks before warning actions", () => {
    const actions = buildPrioritizedActions([
      { level: "warn", code: "MISSING_KEYWORD", message: "Missing AWS." },
      { level: "pass", code: "TECH_KEYWORDS_FOUND", message: "Matched skills." },
      { level: "fail", code: "MISSING_EMAIL", message: "Missing email." }
    ]);

    expect(actions).toEqual([
      {
        priority: "high",
        code: "MISSING_EMAIL",
        title: "Add a contact email",
        detail: "Missing email."
      },
      {
        priority: "medium",
        code: "MISSING_KEYWORD",
        title: "Review a missing job keyword",
        detail: "Missing AWS."
      }
    ]);
  });
});
