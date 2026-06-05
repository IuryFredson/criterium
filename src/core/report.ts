import type { ResumeProfile } from "./resume.js";
import type { SkillCategory, SkillMatch } from "./skills.js";

export type CheckLevel = "pass" | "warn" | "fail";

export type Check = {
  level: CheckLevel;
  code: string;
  message: string;
};

export type CategoryScore = {
  category: SkillCategory;
  found: number;
  required: number;
  score: number;
};

export type DimensionScore = {
  dimension: "keywords" | "required" | "contact" | "structure" | "role";
  score: number;
  status: "pass" | "warn" | "fail";
};

export type ActionPriority = "high" | "medium" | "low";

export type ReportAction = {
  priority: ActionPriority;
  code: string;
  title: string;
  detail: string;
};

export function buildCategoryScores(requiredSkills: SkillMatch[], foundSkills: SkillMatch[]): CategoryScore[] {
  const categories = new Set(requiredSkills.map((skill) => skill.category));
  const foundNames = new Set(foundSkills.map((skill) => skill.name));

  return [...categories].map((category) => {
    const required = requiredSkills.filter((skill) => skill.category === category);
    const found = required.filter((skill) => foundNames.has(skill.name));

    return {
      category,
      found: found.length,
      required: required.length,
      score: required.length === 0 ? 100 : Math.round((found.length / required.length) * 100)
    };
  });
}

export function buildDimensionScores(input: {
  requiredSkillCount: number;
  foundSkillCount: number;
  requiredSkillGapCount: number;
  resumeProfile: ResumeProfile;
  targetRoleMatched: boolean;
}) {
  const keywordScore =
    input.requiredSkillCount === 0 ? 50 : Math.round((input.foundSkillCount / input.requiredSkillCount) * 100);
  const requiredScore =
    input.requiredSkillCount === 0
      ? 50
      : Math.round(((input.requiredSkillCount - input.requiredSkillGapCount) / input.requiredSkillCount) * 100);
  const structureHits = [input.resumeProfile.signals.hasExperienceSection, input.resumeProfile.signals.hasSkillsSection].filter(
    Boolean
  ).length;

  return [
    toDimensionScore("keywords", keywordScore),
    toDimensionScore("required", requiredScore),
    toDimensionScore("contact", input.resumeProfile.contact.emails.length > 0 ? 100 : 0),
    toDimensionScore("structure", Math.round((structureHits / 2) * 100)),
    toDimensionScore("role", input.targetRoleMatched ? 100 : 60)
  ];
}

export function buildPrioritizedActions(checks: Check[]): ReportAction[] {
  return checks
    .filter((check) => check.level !== "pass")
    .map((check) => ({
      priority: toActionPriority(check.level, check.code),
      code: check.code,
      title: toActionTitle(check.code),
      detail: check.message
    }))
    .sort((a, b) => priorityWeight(a.priority) - priorityWeight(b.priority));
}

export function calculateOverallScore(input: {
  requiredSkillCount: number;
  foundSkillCount: number;
  checks: Check[];
}) {
  const keywordScore =
    input.requiredSkillCount === 0 ? 50 : Math.round((input.foundSkillCount / input.requiredSkillCount) * 80);
  const penalties = input.checks.reduce((total, check) => {
    if (check.level === "fail") return total + 20;
    if (check.level === "warn") return total + 5;
    return total;
  }, 0);

  return Math.max(0, Math.min(100, keywordScore + 20 - penalties));
}

function toDimensionScore(dimension: DimensionScore["dimension"], score: number): DimensionScore {
  return {
    dimension,
    score,
    status: score >= 80 ? "pass" : score >= 50 ? "warn" : "fail"
  };
}

function toActionPriority(level: CheckLevel, code: string): ActionPriority {
  if (level === "fail") return "high";
  if (code === "MISSING_KEYWORD" || code === "TARGET_ROLE_NOT_EXPLICIT") return "medium";
  return "low";
}

function toActionTitle(code: string) {
  const titles: Record<string, string> = {
    MISSING_REQUIRED_KEYWORD: "Add or address a required skill gap",
    MISSING_KEYWORD: "Review a missing job keyword",
    MISSING_EMAIL: "Add a contact email",
    MISSING_EXPERIENCE_SECTION: "Add an experience section",
    MISSING_SKILLS_SECTION: "Add a skills section",
    TARGET_ROLE_NOT_EXPLICIT: "Make the target role explicit",
    NO_KNOWN_JOB_KEYWORDS: "Clarify technical requirements"
  };

  return titles[code] ?? "Review this issue";
}

function priorityWeight(priority: ActionPriority) {
  if (priority === "high") return 0;
  if (priority === "medium") return 1;
  return 2;
}
