import "dotenv/config";
import multipart, { type MultipartFile, type MultipartValue } from "@fastify/multipart";
import Fastify from "fastify";
import { analyzeRequestSchema } from "./schemas/analyze.js";
import { analyzeResumeForJob } from "./services/analyze.js";
import { extractTextFromDocument, UnsupportedDocumentError } from "./services/extractText.js";

const server = Fastify({
  logger: true
});

await server.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 2,
    fields: 4
  }
});

server.get("/health", async () => {
  return { status: "ok" };
});

server.post("/analyze", async (request, reply) => {
  const parsed = analyzeRequestSchema.safeParse(request.body);

  if (!parsed.success) {
    return reply.status(400).send({
      error: "invalid_request",
      issues: parsed.error.flatten()
    });
  }

  return analyzeResumeForJob(parsed.data);
});

server.post("/analyze-file", async (request, reply) => {
  const parts = request.parts();
  let resumeFile: MultipartFile | undefined;
  let jobFile: MultipartFile | undefined;
  let jobText: string | undefined;
  let targetRole: string | undefined;

  for await (const part of parts) {
    if (part.type === "file") {
      if (part.fieldname === "resumeFile") resumeFile = part;
      if (part.fieldname === "jobFile") jobFile = part;
      continue;
    }

    if (part.fieldname === "jobText") jobText = getMultipartValue(part);
    if (part.fieldname === "targetRole") targetRole = getMultipartValue(part);
  }

  if (!resumeFile) {
    return reply.status(400).send({ error: "missing_resume_file" });
  }

  if (!jobFile && !jobText) {
    return reply.status(400).send({ error: "missing_job_input" });
  }

  try {
    const resumeText = await extractTextFromMultipartFile(resumeFile);
    const resolvedJobText = jobText ?? (jobFile ? await extractTextFromMultipartFile(jobFile) : "");
    const parsed = analyzeRequestSchema.safeParse({ resumeText, jobText: resolvedJobText, targetRole });

    if (!parsed.success) {
      return reply.status(400).send({
        error: "invalid_extracted_text",
        issues: parsed.error.flatten()
      });
    }

    return analyzeResumeForJob(parsed.data);
  } catch (error) {
    if (error instanceof UnsupportedDocumentError) {
      return reply.status(415).send({ error: "unsupported_document", message: error.message });
    }

    request.log.error(error);
    return reply.status(500).send({ error: "document_parse_failed" });
  }
});

const port = Number(process.env.PORT ?? 3333);
const host = process.env.HOST ?? "127.0.0.1";

try {
  await server.listen({ port, host });
} catch (error) {
  server.log.error(error);
  process.exit(1);
}

async function extractTextFromMultipartFile(file: MultipartFile) {
  return extractTextFromDocument({
    buffer: await file.toBuffer(),
    mimetype: file.mimetype,
    filename: file.filename
  });
}

function getMultipartValue(part: MultipartValue) {
  return typeof part.value === "string" ? part.value : String(part.value ?? "");
}
