import { findSkills, type SkillMatch } from "./skills.js";
import { hasTerm, normalizeText } from "./text.js";

export type RequirementPriority = "required" | "preferred" | "mentioned";
export type Seniority = "intern" | "junior" | "mid" | "senior" | "lead" | "unknown";
export type WorkModel = "remote" | "hybrid" | "onsite" | "unknown";
export type Language = "en" | "pt" | "unknown";

export type JobRequirement = {
  skill: string;
  category: SkillMatch["category"];
  priority: RequirementPriority;
};

export type JobProfile = {
  seniority: Seniority;
  workModel: WorkModel;
  language: Language;
  requiredSkills: JobRequirement[];
  preferredSkills: JobRequirement[];
  mentionedSkills: JobRequirement[];
};

const requiredMarkers = [
  "required",
  "requirements",
  "must have",
  "mandatory",
  "needed",
  "we need",
  "you have",
  "you must",
  "requisitos",
  "obrigatorio",
  "obrigatórios",
  "obrigatoria",
  "obrigatórias",
  "necessario",
  "necessário",
  "necessaria",
  "necessária",
  "precisa ter"
];

const preferredMarkers = [
  "preferred",
  "nice to have",
  "nice-to-have",
  "plus",
  "bonus",
  "differential",
  "diferencial",
  "desejavel",
  "desejável",
  "será um plus",
  "seria um plus"
];

export function parseJobProfile(jobText: string): JobProfile {
  const normalizedText = normalizeText(jobText);
  const lines = splitMeaningfulLines(jobText);
  const skills = findSkills(normalizedText);

  const requirements = skills.map((skill) => ({
    skill: skill.name,
    category: skill.category,
    priority: detectSkillPriority(skill.name, lines) ?? "mentioned"
  }));

  return {
    seniority: detectSeniority(normalizedText),
    workModel: detectWorkModel(normalizedText),
    language: detectLanguage(jobText),
    requiredSkills: requirements.filter((requirement) => requirement.priority === "required"),
    preferredSkills: requirements.filter((requirement) => requirement.priority === "preferred"),
    mentionedSkills: requirements.filter((requirement) => requirement.priority === "mentioned")
  };
}

function detectSkillPriority(skillName: string, lines: string[]): RequirementPriority | undefined {
  const skillLines = lines.filter((line) => findSkills(line).some((skill) => skill.name === skillName));

  if (skillLines.some((line) => hasAnyMarker(line, requiredMarkers))) {
    return "required";
  }

  if (skillLines.some((line) => hasAnyMarker(line, preferredMarkers))) {
    return "preferred";
  }

  return undefined;
}

function detectSeniority(text: string): Seniority {
  if (hasAnyTerm(text, ["lead", "staff", "principal", "tech lead", "líder técnico", "lider tecnico"])) return "lead";
  if (hasAnyTerm(text, ["senior", "sênior", "sr.", "sr "])) return "senior";
  if (hasAnyTerm(text, ["mid-level", "mid level", "pleno", "pl.", "pl "])) return "mid";
  if (hasAnyTerm(text, ["junior", "júnior", "jr.", "jr "])) return "junior";
  if (hasAnyTerm(text, ["intern", "internship", "estagio", "estágio", "trainee"])) return "intern";

  return "unknown";
}

function detectWorkModel(text: string): WorkModel {
  if (hasAnyTerm(text, ["hybrid", "hibrido", "híbrido"])) return "hybrid";
  if (hasAnyTerm(text, ["remote", "remoto", "home office", "work from home"])) return "remote";
  if (hasAnyTerm(text, ["onsite", "on-site", "presencial"])) return "onsite";

  return "unknown";
}

function detectLanguage(text: string): Language {
  const normalized = normalizeText(text);
  const portugueseScore = countTerms(normalized, ["vaga", "requisitos", "desejável", "desejavel", "remoto", "presencial"]);
  const englishScore = countTerms(normalized, ["job", "requirements", "preferred", "remote", "onsite", "experience"]);

  if (portugueseScore > englishScore) return "pt";
  if (englishScore > portugueseScore) return "en";

  return "unknown";
}

function splitMeaningfulLines(text: string) {
  return text
    .split(/\r?\n|[•*-]|[.;]\s+/)
    .map((line) => normalizeText(line))
    .filter((line) => line.length > 0);
}

function hasAnyMarker(text: string, markers: string[]) {
  return markers.some((marker) => text.includes(normalizeText(marker)));
}

function hasAnyTerm(text: string, terms: string[]) {
  return terms.some((term) => hasTerm(text, normalizeText(term)));
}

function countTerms(text: string, terms: string[]) {
  return terms.filter((term) => hasTerm(text, normalizeText(term))).length;
}
