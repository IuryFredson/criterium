export function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function extractEmails(text: string) {
  return unique(text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi) ?? []);
}

export function hasEmail(text: string) {
  return extractEmails(text).length > 0;
}

export function extractUrls(text: string) {
  return unique(text.match(/https?:\/\/[^\s)]+|(?:github|linkedin)\.com\/[^\s)]+/gi) ?? []);
}

export function hasTerm(text: string, term: string) {
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(^|[^a-z0-9])${escapedTerm}([^a-z0-9]|$)`, "i");

  return pattern.test(text);
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()))];
}
