import { businessRule } from "../errors/api-error.js";

export type MultipartFile = {
  filename: string;
  mimeType: string;
  content: Buffer;
};

const getBoundary = (contentType: string) => {
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  return match?.[1] ?? match?.[2] ?? null;
};

export const parseSingleMultipartFile = (body: Buffer, contentType: string): MultipartFile => {
  const boundary = getBoundary(contentType);
  if (!boundary) {
    throw businessRule("Requisição multipart sem boundary.");
  }

  const raw = body.toString("latin1");
  const part = raw
    .split(`--${boundary}`)
    .find((chunk) => chunk.includes('name="file"') && chunk.includes("Content-Disposition"));

  if (!part) {
    throw businessRule("Arquivo não enviado no campo file.");
  }

  const [rawHeaders, ...contentParts] = part.split("\r\n\r\n");
  const disposition = rawHeaders.match(/Content-Disposition:[^\r\n]+/i)?.[0] ?? "";
  const filename = disposition.match(/filename="([^"]+)"/i)?.[1] ?? "";
  const mimeType = rawHeaders.match(/Content-Type:\s*([^\r\n]+)/i)?.[1]?.trim() ?? "";

  if (!filename || !mimeType) {
    throw businessRule("Metadados do arquivo multipart inválidos.");
  }

  const contentRaw = contentParts.join("\r\n\r\n").replace(/\r\n$/, "");
  return {
    filename,
    mimeType,
    content: Buffer.from(contentRaw, "latin1"),
  };
};
