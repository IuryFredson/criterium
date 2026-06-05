import { findSkills, type SkillMatch } from "./skills.js";
import { extractEmails, extractUrls, hasTerm, normalizeText } from "./text.js";

export type ResumeSectionName = "summary" | "experience" | "skills" | "education" | "projects" | "certifications";

export type ResumeSection = {
  name: ResumeSectionName;
  content: string;
};

export type ResumeProfile = {
  contact: {
    emails: string[];
    urls: string[];
    hasGithub: boolean;
    hasLinkedIn: boolean;
  };
  sections: ResumeSection[];
  skills: SkillMatch[];
  experienceYears: number | null;
  signals: {
    hasExperienceSection: boolean;
    hasSkillsSection: boolean;
    hasEducationSection: boolean;
    hasProjectsSection: boolean;
  };
};

const sectionHeaders: Array<{ name: ResumeSectionName; terms: string[] }> = [
  { name: "summary", terms: ["summary", "profile", "professional summary", "resumo", "perfil"] },
  { name: "experience", terms: ["experience", "work experience", "professional experience", "experiência", "experiencia", "experiência profissional", "experiencia profissional"] },
  { name: "skills", terms: ["skills", "technical skills", "technologies", "competências", "competencias", "habilidades", "tecnologias"] },
  { name: "education", terms: ["education", "academic background", "formação", "formacao", "educação", "educacao"] },
  { name: "projects", terms: ["projects", "personal projects", "projetos"] },
  { name: "certifications", terms: ["certifications", "certificates", "certificações", "certificacoes", "certificados"] }
];

export function parseResumeProfile(resumeText: string): ResumeProfile {
  const normalizedText = normalizeText(resumeText);
  const urls = extractUrls(resumeText);
  const sections = extractSections(resumeText);

  return {
    contact: {
      emails: extractEmails(resumeText),
      urls,
      hasGithub: urls.some((url) => normalizeText(url).includes("github.com")),
      hasLinkedIn: urls.some((url) => normalizeText(url).includes("linkedin.com"))
    },
    sections,
    skills: findSkills(normalizedText),
    experienceYears: extractExperienceYears(normalizedText),
    signals: {
      hasExperienceSection: hasSection(sections, "experience"),
      hasSkillsSection: hasSection(sections, "skills"),
      hasEducationSection: hasSection(sections, "education"),
      hasProjectsSection: hasSection(sections, "projects")
    }
  };
}

function extractSections(text: string): ResumeSection[] {
  const lines = text.split(/\r?\n/);
  const sections: ResumeSection[] = [];
  let current: { name: ResumeSectionName; content: string[] } | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const sectionName = detectSectionHeader(line);
    if (sectionName) {
      if (current) {
        sections.push({ name: current.name, content: current.content.join("\n").trim() });
      }
      current = { name: sectionName, content: [] };
      continue;
    }

    if (current) {
      current.content.push(line);
    }
  }

  if (current) {
    sections.push({ name: current.name, content: current.content.join("\n").trim() });
  }

  return sections.filter((section) => section.content.length > 0);
}

function detectSectionHeader(line: string): ResumeSectionName | null {
  const normalizedLine = normalizeText(line).replace(/:$/, "");

  for (const header of sectionHeaders) {
    if (header.terms.some((term) => normalizedLine === normalizeText(term))) {
      return header.name;
    }
  }

  return null;
}

function extractExperienceYears(text: string) {
  const explicitYears = [...text.matchAll(/(\d{1,2})\+?\s*(?:years|anos)\s+(?:of\s+)?(?:experience|experiência|experiencia)/gi)]
    .map((match) => Number(match[1]))
    .filter((year) => Number.isFinite(year));

  if (explicitYears.length > 0) {
    return Math.max(...explicitYears);
  }

  const yearRanges = [...text.matchAll(/\b(20\d{2}|19\d{2})\s*[-–]\s*(present|current|atual|20\d{2}|19\d{2})\b/gi)]
    .map((match) => estimateRangeYears(Number(match[1]), match[2]))
    .filter((year) => year > 0);

  if (yearRanges.length > 0) {
    return Math.max(...yearRanges);
  }

  return null;
}

function estimateRangeYears(startYear: number, endValue: string) {
  const currentYear = new Date().getFullYear();
  const normalizedEnd = normalizeText(endValue);
  const endYear = hasTerm("present current atual", normalizedEnd) ? currentYear : Number(endValue);

  if (!Number.isFinite(endYear)) return 0;

  return Math.max(0, endYear - startYear);
}

function hasSection(sections: ResumeSection[], name: ResumeSectionName) {
  return sections.some((section) => section.name === name);
}
