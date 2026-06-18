#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { analyzeResumeForJob } from "./services/analyze.js";
import { extractTextFromDocument } from "./services/extractText.js";

export type CliOptions = {
  command: "analyze";
  resumePath: string;
  jobPath: string;
  targetRole?: string;
  pretty: boolean;
};

export async function main(argv = process.argv.slice(2)) {
  try {
    const options = parseArgs(argv);
    const [resumeText, jobText] = await Promise.all([readDocumentText(options.resumePath), readDocumentText(options.jobPath)]);
    const result = analyzeResumeForJob({ resumeText, jobText, targetRole: options.targetRole });

    process.stdout.write(JSON.stringify(result, null, options.pretty ? 2 : 0));
    process.stdout.write("\n");
  } catch (error) {
    if (error instanceof CliError) {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = error.exitCode;
      return;
    }

    process.stderr.write(error instanceof Error ? `${error.message}\n` : "Unknown CLI error\n");
    process.exitCode = 1;
  }
}

export function parseArgs(argv: string[]): CliOptions {
  if (argv.includes("--help") || argv.includes("-h")) {
    throw new CliError(usage(), 0);
  }

  const [command, ...rest] = argv;
  if (command !== "analyze") {
    throw new CliError(usage(), 1);
  }

  const values = parseFlags(rest);
  const resumePath = values.get("resume") ?? values.get("r");
  const jobPath = values.get("job") ?? values.get("j");
  const targetRole = values.get("target-role");

  if (!resumePath) {
    throw new CliError("Missing required option: --resume <file>", 1);
  }

  if (!jobPath) {
    throw new CliError("Missing required option: --job <file>", 1);
  }

  return {
    command,
    resumePath,
    jobPath,
    targetRole,
    pretty: !values.has("compact")
  };
}

class CliError extends Error {
  constructor(message: string, readonly exitCode: number) {
    super(message);
    this.name = "CliError";
  }
}

async function readDocumentText(filePath: string) {
  const buffer = await readFile(filePath);

  return extractTextFromDocument({
    buffer,
    mimetype: inferMimeType(filePath),
    filename: path.basename(filePath)
  });
}

function inferMimeType(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".pdf") return "application/pdf";
  if (extension === ".docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return "text/plain";
}

function parseFlags(args: string[]) {
  const values = new Map<string, string | undefined>();

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("-")) continue;

    const name = arg.replace(/^--?/, "");
    const next = args[index + 1];

    if (!next || next.startsWith("-")) {
      values.set(name, undefined);
      continue;
    }

    values.set(name, next);
    index += 1;
  }

  return values;
}

function usage() {
  return `Usage:\n  criterium analyze --resume <file> --job <file> [--target-role <role>] [--compact]\n\nSupported files: .txt, .pdf, .docx`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
