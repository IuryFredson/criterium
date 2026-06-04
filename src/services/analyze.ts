import { calculateOverallScore, buildCategoryScores, type Check } from "../core/report.js";
import { diffSkills, findSkills, type SkillMatch } from "../core/skills.js";
import { hasEmail, normalizeText } from "../core/text.js";
import type { AnalyzeRequest } from "../schemas/analyze.js";

export function analyzeResumeForJob(input: AnalyzeRequest) {
  const resumeText = normalizeText(input.resumeText);
  const jobText = normalizeText(input.jobText);
  const targetRole = input.targetRole ? normalizeText(input.targetRole) : undefined;

  const jobSkills = findSkills(jobText);
  const resumeSkills = findSkills(resumeText);
  const { found, missing } = diffSkills(jobSkills, resumeSkills);
  const checks = buildChecks({
    resumeText,
    targetRole,
    jobSkills,
    foundSkills: found,
    missingSkills: missing
  });

  return {
    overallScore: calculateOverallScore({
      requiredSkillCount: jobSkills.length,
      foundSkillCount: found.length,
      checks
    }),
    targetRole: input.targetRole ?? null,
    summary: {
      requiredSkills: jobSkills.length,
      matchedSkills: found.length,
      missingSkills: missing.length
    },
    categoryScores: buildCategoryScores(jobSkills, found),
    foundKeywords: found.map((skill) => skill.name),
    missingKeywords: missing.map((skill) => skill.name),
    checks
  };
}

function buildChecks(input: {
  resumeText: string;
  targetRole?: string;
  jobSkills: SkillMatch[];
  foundSkills: SkillMatch[];
  missingSkills: SkillMatch[];
}): Check[] {
  const checks: Check[] = [];

  if (input.jobSkills.length === 0) {
    checks.push({
      level: "warn",
      code: "NO_KNOWN_JOB_KEYWORDS",
      message: "No known technical keywords were detected in the job description."
    });
  }

  if (input.foundSkills.length > 0) {
    checks.push({
      level: "pass",
      code: "TECH_KEYWORDS_FOUND",
      message: `Resume matches ${input.foundSkills.length} technical keyword(s) from the job description.`
    });
  }

  for (const skill of input.missingSkills.slice(0, 8)) {
    checks.push({
      level: "warn",
      code: "MISSING_KEYWORD",
      message: `The job mentions ${skill.name}, but the resume does not.`
    });
  }

  if (!hasEmail(input.resumeText)) {
    checks.push({
      level: "fail",
      code: "MISSING_EMAIL",
      message: "Resume does not include a detectable email address."
    });
  }

  if (input.targetRole && !input.resumeText.includes(input.targetRole)) {
    checks.push({
      level: "warn",
      code: "TARGET_ROLE_NOT_EXPLICIT",
      message: "Target role was not explicitly found in the resume text."
    });
  }

  return checks;
}
