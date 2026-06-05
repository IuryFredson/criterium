import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export type SupportedDocument = {
  buffer: Buffer;
  mimetype: string;
  filename?: string;
};

export async function extractTextFromDocument(document: SupportedDocument) {
  if (isPlainText(document)) {
    return document.buffer.toString("utf8");
  }

  if (isPdf(document)) {
    const parser = new PDFParse({ data: document.buffer });
    const result = await parser.getText();
    await parser.destroy();

    return result.text;
  }

  if (isDocx(document)) {
    const result = await mammoth.extractRawText({ buffer: document.buffer });

    return result.value;
  }

  throw new UnsupportedDocumentError(document.mimetype, document.filename);
}

export class UnsupportedDocumentError extends Error {
  constructor(mimetype: string, filename?: string) {
    super(`Unsupported document type: ${mimetype}${filename ? ` (${filename})` : ""}`);
    this.name = "UnsupportedDocumentError";
  }
}

function isPlainText(document: SupportedDocument) {
  return document.mimetype === "text/plain" || hasExtension(document.filename, ".txt");
}

function isPdf(document: SupportedDocument) {
  return document.mimetype === "application/pdf" || hasExtension(document.filename, ".pdf");
}

function isDocx(document: SupportedDocument) {
  return (
    document.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    hasExtension(document.filename, ".docx")
  );
}

function hasExtension(filename: string | undefined, extension: string) {
  return filename?.toLowerCase().endsWith(extension) ?? false;
}
