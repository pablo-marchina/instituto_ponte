import JSZip from "jszip";
import type { AnexoExportarItemDto } from "./anexos.types";

function sanitizeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "arquivo";
}

function extensionFor(item: AnexoExportarItemDto) {
  const byName = item.nomeArquivo?.split(".").pop();
  if (byName && byName !== item.nomeArquivo) return byName;
  if (item.mimeType === "image/jpeg") return "jpg";
  if (item.mimeType === "image/png") return "png";
  if (item.mimeType === "application/pdf") return "pdf";
  return "bin";
}

function buildManifest(items: AnexoExportarItemDto[], failedIds: Set<string>) {
  const rows = items.map((item) => `
    <tr>
      <td>${item.aluno}</td>
      <td>${item.questaoId}</td>
      <td>${item.nomeArquivo ?? item.id}</td>
      <td>${item.mimeType}</td>
      <td>${failedIds.has(item.id) ? "Falhou no download; usar link" : "Incluido no pacote"}</td>
      <td><a href="${item.urlArquivo}">${item.urlArquivo}</a></td>
    </tr>
  `).join("");

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Manifesto de anexos</title>
    <style>
      body { font-family: Arial, sans-serif; color: #111; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
      th { background: #f2f2f2; text-align: left; }
    </style>
  </head>
  <body>
    <h1>Manifesto de anexos</h1>
    <p>Total de anexos: ${items.length}</p>
    <table>
      <thead>
        <tr>
          <th>Aluno</th>
          <th>Questao</th>
          <th>Arquivo</th>
          <th>Tipo</th>
          <th>Status</th>
          <th>URL original</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </body>
</html>`;
}

export async function buildAnexosZip(items: AnexoExportarItemDto[], provaLabel: string) {
  const zip = new JSZip();
  const failedIds = new Set<string>();

  await Promise.all(items.map(async (item, index) => {
    const aluno = sanitizeFilename(item.aluno);
    const questao = sanitizeFilename(`questao_${item.questaoId}`);
    const basename = sanitizeFilename(item.nomeArquivo ?? `anexo_${index + 1}.${extensionFor(item)}`);
    const filename = `${aluno}/${questao}/${String(index + 1).padStart(3, "0")}_${basename}`;

    try {
      const response = await fetch(item.urlArquivo);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      zip.file(filename, await response.blob());
    } catch {
      failedIds.add(item.id);
    }
  }));

  zip.file("manifesto.html", buildManifest(items, failedIds));

  const blob = await zip.generateAsync({ type: "blob" });
  const failedCount = failedIds.size;

  return {
    blob,
    filename: `${sanitizeFilename(provaLabel)}-anexos.zip`,
    failedCount,
  };
}
