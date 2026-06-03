import { z } from "zod";

export const analyzeRequestSchema = z.object({
  resumeText: z.string().min(50, "resumeText must contain at least 50 characters"),
  jobText: z.string().min(50, "jobText must contain at least 50 characters"),
  targetRole: z.string().min(2).max(120).optional()
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
