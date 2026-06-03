import "dotenv/config";
import Fastify from "fastify";
import { analyzeResumeForJob } from "./services/analyze.js";
import { analyzeRequestSchema } from "./schemas/analyze.js";

const server = Fastify({
  logger: true
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

const port = Number(process.env.PORT ?? 3333);
const host = process.env.HOST ?? "127.0.0.1";

try {
  await server.listen({ port, host });
} catch (error) {
  server.log.error(error);
  process.exit(1);
}
