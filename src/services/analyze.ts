import type { AnalyzeRequest } from "../schemas/analyze.js";

type CheckLevel = "pass" | "warn" | "fail";

type Check = {
  level: CheckLevel;
  code: string;
  message: string;
};

const skillAliases: Record<string, string[]> = {
  JavaScript: ["javascript"],
  TypeScript: ["typescript"],
  React: ["react", "react.js", "reactjs"],
  "Node.js": ["node.js", "nodejs", "node"],
  "Next.js": ["next.js", "nextjs", "next"],
  NestJS: ["nestjs", "nest.js"],
  Express: ["express", "express.js"],
  PostgreSQL: ["postgresql", "postgres", "postgre"],
  MySQL: ["mysql"],
  MongoDB: ["mongodb", "mongo"],
  Redis: ["redis"],
  Docker: ["docker"],
  Kubernetes: ["kubernetes", "k8s"],
  AWS: ["aws", "amazon web services"],
  GCP: ["gcp", "google cloud"],
  Azure: ["azure"],
  "CI/CD": ["ci/cd", "cicd", "continuous integration", "continuous delivery"],
  REST: ["rest", "restful", "api rest", "apis rest"],
  GraphQL: ["graphql"],
  Jest: ["jest"],
  Cypress: ["cypress"],
  Playwright: ["playwright"]
};

export function analyzeResumeForJob(input: AnalyzeRequest) {
  const resumeText = normalize(input.resumeText);
  const jobText = normalize(input.jobText);

  const jobKeywords = findKnownSkills(jobText);
  const foundKeywords = jobKeywords.filter((skill) => hasSkill(resumeText, skill));
  const missingKeywords = jobKeywords.filter((skill) => !foundKeywords.includes(skill));
  const checks = buildChecks({
    resumeText,
    targetRole: input.targetRole,
    jobKeywords,
    foundKeywords,
    missingKeywords
  });

  return {
    overallScore: calculateScore(jobKeywords.length, foundKeywords.length, checks),
    targetRole: input.targetRole ?? null,
    foundKeywords,
    missingKeywords,
    checks
  };
}

function buildChecks(input: {
  resumeText: string;
  targetRole?: string;
  jobKeywords: string[];
  foundKeywords: string[];
  missingKeywords: string[];
}): Check[] {
  const checks: Check[] = [];

  if (input.jobKeywords.length === 0) {
    checks.push({
      level: "warn",
      code: "NO_KNOWN_JOB_KEYWORDS",
      message: "No known technical keywords were detected in the job description."
    });
  }

  if (input.foundKeywords.length > 0) {
    checks.push({
      level: "pass",
      code: "TECH_KEYWORDS_FOUND",
      message: `Resume matches ${input.foundKeywords.length} technical keyword(s) from the job description.`
    });
  }

  for (const skill of input.missingKeywords.slice(0, 8)) {
    checks.push({
      level: "warn",
      code: "MISSING_KEYWORD",
      message: `The job mentions ${skill}, but the resume does not.`
    });
  }

  if (!hasEmail(input.resumeText)) {
    checks.push({
      level: "fail",
      code: "MISSING_EMAIL",
      message: "Resume does not include a detectable email address."
    });
  }

  if (input.targetRole && !input.resumeText.includes(normalize(input.targetRole))) {
    checks.push({
      level: "warn",
      code: "TARGET_ROLE_NOT_EXPLICIT",
      message: "Target role was not explicitly found in the resume text."
    });
  }

  return checks;
}

function findKnownSkills(text: string) {
  return Object.keys(skillAliases).filter((skill) => hasSkill(text, skill));
}

function hasSkill(text: string, skill: string) {
  return skillAliases[skill].some((alias) => hasTerm(text, alias));
}

function hasTerm(text: string, term: string) {
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(^|[^a-z0-9])${escapedTerm}([^a-z0-9]|$)`, "i");

  return pattern.test(text);
}

function hasEmail(text: string) {
  return /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text);
}

function calculateScore(jobKeywordCount: number, foundKeywordCount: number, checks: Check[]) {
  const keywordScore = jobKeywordCount === 0 ? 50 : Math.round((foundKeywordCount / jobKeywordCount) * 80);
  const penalties = checks.reduce((total, check) => {
    if (check.level === "fail") return total + 20;
    if (check.level === "warn") return total + 5;
    return total;
  }, 0);

  return Math.max(0, Math.min(100, keywordScore + 20 - penalties));
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}
