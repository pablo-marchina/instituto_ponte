import { describe, expect, it, jest } from "@jest/globals";
import { parseSingleMultipartFile } from "../../helpers/multipart.js";

const makeMultipartBody = (
  filename: string,
  mimeType: string,
  content: string,
  boundary: string = "----boundary123",
): Buffer => {
  const raw = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="file"; filename="${filename}"`,
    `Content-Type: ${mimeType}`,
    "",
    content,
    `--${boundary}--`,
    "",
  ].join("\r\n");
  return Buffer.from(raw, "latin1");
};

describe("multipart - unitário", () => {
describe("parseSingleMultipartFile", () => {
  it("deve extrair arquivo válido do multipart com filename, mimetype e conteúdo", () => {
    const body = makeMultipartBody("teste.pdf", "application/pdf", "conteudo");
    const result = parseSingleMultipartFile(body, `multipart/form-data; boundary=----boundary123`);

    expect(result.filename).toBe("teste.pdf");
    expect(result.mimeType).toBe("application/pdf");
    expect(result.content.toString("latin1")).toBe("conteudo");
  });

  it("deve extrair arquivo quando o nome contém espaços", () => {
    const body = makeMultipartBody("meu arquivo.png", "image/png", "imagem");
    const result = parseSingleMultipartFile(body, `multipart/form-data; boundary=----boundary123`);

    expect(result.filename).toBe("meu arquivo.png");
  });

  it("deve lançar erro quando o boundary do Content-Type está ausente", () => {
    expect(() =>
      parseSingleMultipartFile(Buffer.from(""), "multipart/form-data"),
    ).toThrow("Requisição multipart sem boundary.");
  });

  it("deve lançar erro quando o campo file está vazio no multipart", () => {
    const body = Buffer.from("--boundary\r\n\r\n--boundary--\r\n", "latin1");
    expect(() =>
      parseSingleMultipartFile(body, "multipart/form-data; boundary=boundary"),
    ).toThrow("Arquivo não enviado no campo file.");
  });

  it("deve lançar erro quando o filename está ausente no Content-Disposition", () => {
    const raw = [
      `--boundary`,
      `Content-Disposition: form-data; name="file"`,
      `Content-Type: image/png`,
      "",
      "conteudo",
      `--boundary--`,
      "",
    ].join("\r\n");
    expect(() =>
      parseSingleMultipartFile(Buffer.from(raw, "latin1"), "multipart/form-data; boundary=boundary"),
    ).toThrow("Metadados do arquivo multipart inválidos.");
  });

  it("deve lançar erro quando o Content-Type está ausente no multipart", () => {
    const raw = [
      `--boundary`,
      `Content-Disposition: form-data; name="file"; filename="teste.pdf"`,
      "",
      "conteudo",
      `--boundary--`,
      "",
    ].join("\r\n");
    expect(() =>
      parseSingleMultipartFile(Buffer.from(raw, "latin1"), "multipart/form-data; boundary=boundary"),
    ).toThrow("Metadados do arquivo multipart inválidos.");
  });

  it("deve extrair disposition vazia quando Content-Disposition nao tem valor", () => {
    const raw = [
      `--boundary`,
      `Content-Disposition:`,
      `name="file"`,
      `Content-Type: image/png`,
      "",
      "conteudo",
      `--boundary--`,
      "",
    ].join("\r\n");
    expect(() =>
      parseSingleMultipartFile(Buffer.from(raw, "latin1"), "multipart/form-data; boundary=boundary"),
    ).toThrow("Metadados do arquivo multipart inválidos.");
  });
});
});
