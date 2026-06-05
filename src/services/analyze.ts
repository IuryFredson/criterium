import { parseJobProfile, type JobRequirement } from "../core/job.js";
import { calculateOverallScore, buildCategoryScores, type Check } from "../core/report.js";
import { parseResumeProfile, type ResumeProfile } from "../core/resume.js";
import { diffSkills, findSkills, type SkillMatch } from "../core/skills.js";
import { normalizeText } from "../core/text.js";
import type { AnalyzeRequest } from "../schemas/analyze.js";

export function analyzeResumeForJob(input: AnalyzeRequest) {
  const resumeText = normalizeText(input.resumeText);
  const jobText = normalizeText(input.jobText);
  const targetRole = input.targetRole ? normalizeText(input.targetRole) : undefined;

  const jobProfile = parseJobProfile(input.jobText);
  const resumeProfile = parseResumeProfile(input.resumeText);
  const jobSkills = findSkills(jobText);
  const resumeSkills = resumeProfile.skills;
  const { found, missing } = diffSkills(jobSkills, resumeSkills);
  const missingRequiredSkills = getMissingRequiredSkills(jobProfile.requiredSkills, found);
  const checks = buildChecks({
    resumeText,
    targetRole,
    resumeProfile,
    jobSkills,
    foundSkills: found,
    missingSkills: missing,
    missingRequiredSkills
  });

  return {
    overallScore: calculateOverallScore({
      requiredSkillCount: jobSkills.length,
      foundSkillCount: found.length,
      checks
    }),
    targetRole: input.targetRole ?? null,
    jobProfile,
    resumeProfile,
    summary: {
      requiredSkills: jobSkills.length,
      matchedSkills: found.length,
      missingSkills: missing.length,
      requiredSkillGaps: missingRequiredSkills.length,
      resumeSkills: resumeSkills.length,
      resumeExperienceYears: resumeProfile.experienceYears
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
  resumeProfile: ResumeProfile;
  jobSkills: SkillMatch[];
  foundSkills: SkillMatch[];
  missingSkills: SkillMatch[];
  missingRequiredSkills: JobRequirement[];
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

  for (const skill of input.missingRequiredSkills.slice(0, 8)) {
    checks.push({
      level: "fail",
      code: "MISSING_REQUIRED_KEYWORD",
      message: `The job marks ${skill.skill} as required, but the resume does not mention it.`
    });
  }

  const missingRequiredNames = new Set(input.missingRequiredSkills.map((skill) => skill.skill));
  for (const skill of input.missingSkills.filter((skill) => !missingRequiredNames.has(skill.name)).slice(0, 8)) {
    checks.push({
      level: "warn",
      code: "MISSING_KEYWORD",
      message: `The job mentions ${skill.name}, but the resume does not.`
    });
  }

  if (input.resumeProfile.contact.emails.length === 0) {
    checks.push({
      level: "fail",
      code: "MISSING_EMAIL",
      message: "Resume does not include a detectable email address."
    });
  }

  if (!input.resumeProfile.signals.hasExperienceSection) {
    checks.push({
      level: "warn",
      code: "MISSING_EXPERIENCE_SECTION",
      message: "Resume does not include a detectable experience section."
    });
  }

  if (!input.resumeProfile.signals.hasSkillsSection) {
    checks.push({
      level: "warn",
      code: "MISSING_SKILLS_SECTION",
      message: "Resume does not include a detectable skills section."
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

function getMissingRequiredSkills(requiredSkills: JobRequirement[], foundSkills: SkillMatch[]) {
  const foundNames = new Set(foundSkills.map((skill) => skill.name));

  return requiredSkills.filter((skill) => !foundNames.has(skill.skill));
}
