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
