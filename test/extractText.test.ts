import { describe, expect, it } from "vitest";
import { extractTextFromDocument, UnsupportedDocumentError } from "../src/services/extractText.js";

describe("extractTextFromDocument", () => {
  it("extracts plain text documents", async () => {
    await expect(
      extractTextFromDocument({
        buffer: Buffer.from("Backend Developer with Node.js"),
        mimetype: "text/plain",
        filename: "resume.txt"
      })
    ).resolves.toBe("Backend Developer with Node.js");
  });

  it("rejects unsupported documents", async () => {
    await expect(
      extractTextFromDocument({
        buffer: Buffer.from("nope"),
        mimetype: "application/octet-stream",
        filename: "resume.bin"
      })
    ).rejects.toBeInstanceOf(UnsupportedDocumentError);
  });
});
