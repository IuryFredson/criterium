import { hasTerm } from "./text.js";

export type SkillCategory = "language" | "frontend" | "backend" | "database" | "devops" | "testing" | "api";

export type SkillDefinition = {
  name: string;
  category: SkillCategory;
  aliases: string[];
};

export type SkillMatch = {
  name: string;
  category: SkillCategory;
};

export const skillTaxonomy: SkillDefinition[] = [
  { name: "JavaScript", category: "language", aliases: ["javascript"] },
  { name: "TypeScript", category: "language", aliases: ["typescript"] },
  { name: "Python", category: "language", aliases: ["python"] },
  { name: "Java", category: "language", aliases: ["java"] },
  { name: "Go", category: "language", aliases: ["golang"] },
  { name: "React", category: "frontend", aliases: ["react", "react.js", "reactjs"] },
  { name: "Vue", category: "frontend", aliases: ["vue", "vue.js", "vuejs"] },
  { name: "Angular", category: "frontend", aliases: ["angular"] },
  { name: "Node.js", category: "backend", aliases: ["node.js", "nodejs", "node"] },
  { name: "Next.js", category: "backend", aliases: ["next.js", "nextjs", "next"] },
  { name: "NestJS", category: "backend", aliases: ["nestjs", "nest.js"] },
  { name: "Express", category: "backend", aliases: ["express", "express.js"] },
  { name: "PostgreSQL", category: "database", aliases: ["postgresql", "postgres"] },
  { name: "MySQL", category: "database", aliases: ["mysql"] },
  { name: "MongoDB", category: "database", aliases: ["mongodb", "mongo"] },
  { name: "Redis", category: "database", aliases: ["redis"] },
  { name: "Docker", category: "devops", aliases: ["docker"] },
  { name: "Kubernetes", category: "devops", aliases: ["kubernetes", "k8s"] },
  { name: "AWS", category: "devops", aliases: ["aws", "amazon web services"] },
  { name: "GCP", category: "devops", aliases: ["gcp", "google cloud"] },
  { name: "Azure", category: "devops", aliases: ["azure"] },
  { name: "CI/CD", category: "devops", aliases: ["ci/cd", "cicd", "continuous integration", "continuous delivery"] },
  { name: "REST", category: "api", aliases: ["rest", "restful", "api rest", "apis rest"] },
  { name: "GraphQL", category: "api", aliases: ["graphql"] },
  { name: "Jest", category: "testing", aliases: ["jest"] },
  { name: "Cypress", category: "testing", aliases: ["cypress"] },
  { name: "Playwright", category: "testing", aliases: ["playwright"] }
];

export function findSkills(text: string): SkillMatch[] {
  return skillTaxonomy
    .filter((skill) => skill.aliases.some((alias) => hasTerm(text, alias)))
    .map(({ name, category }) => ({ name, category }));
}

export function diffSkills(requiredSkills: SkillMatch[], candidateSkills: SkillMatch[]) {
  const candidateSkillNames = new Set(candidateSkills.map((skill) => skill.name));

  return {
    found: requiredSkills.filter((skill) => candidateSkillNames.has(skill.name)),
    missing: requiredSkills.filter((skill) => !candidateSkillNames.has(skill.name))
  };
}
