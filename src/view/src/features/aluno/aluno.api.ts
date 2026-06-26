import { apiRequest, apiUpload } from "../../lib/apiClient";
import type {
  EnvioFinalDto,
  IniciarProvaPayload,
  ProvaIniciadaDto,
  ProvaPublicaDto,
  RespostaAlunoDto,
  RespostaSalvaDto,
  SalvarRespostaPayload,
} from "./aluno.types";

function encodeUrlAcesso(urlAcesso: string) {
  return encodeURIComponent(urlAcesso);
}

export function getProvaPublica(urlAcesso: string, signal?: AbortSignal) {
  return apiRequest<ProvaPublicaDto>(`/public/provas/${encodeUrlAcesso(urlAcesso)}`, { signal });
}

export function iniciarProva(urlAcesso: string, payload: IniciarProvaPayload) {
  return apiRequest<ProvaIniciadaDto>(`/public/provas/${encodeUrlAcesso(urlAcesso)}/iniciar`, {
    method: "POST",
    headers: { "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify(payload),
  });
}

export function listarRespostas(provaAlunoId: string) {
  return apiRequest<RespostaAlunoDto[]>(`/public/provas-aluno/${provaAlunoId}/respostas`);
}

export function salvarResposta(
  provaAlunoId: string,
  questaoId: string,
  payload: SalvarRespostaPayload,
) {
  return apiRequest<RespostaSalvaDto>(`/public/provas-aluno/${provaAlunoId}/respostas/${questaoId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function enviarProva(provaAlunoId: string) {
  return apiRequest<EnvioFinalDto>(`/public/provas-aluno/${provaAlunoId}/enviar`, {
    method: "POST",
    headers: { "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify({ confirmarEnvio: true }),
  });
}

export type AnexoUploadDto = {
  id: string;
  urlArquivo: string;
  mimeType: string;
  tamanhoBytes: number;
};

const IMAGE_MAX_DIMENSION = 1600;
const IMAGE_QUALITY = 0.78;

function isCompressibleImage(file: File) {
  return file.type === "image/jpeg" || file.type === "image/png";
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível processar a imagem antes do upload."));
    };
    image.src = url;
  });
}

function getResizedDimensions(width: number, height: number) {
  const largestSide = Math.max(width, height);
  if (largestSide <= IMAGE_MAX_DIMENSION) {
    return { width, height };
  }

  const ratio = IMAGE_MAX_DIMENSION / largestSide;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

async function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Não foi possível comprimir a imagem antes do upload."));
      },
      mimeType,
      IMAGE_QUALITY,
    );
  });
}

async function compressImageClientSide(file: File) {
  if (!isCompressibleImage(file)) {
    return file;
  }

  const image = await loadImage(file);
  const { width, height } = getResizedDimensions(image.naturalWidth, image.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return file;

  context.drawImage(image, 0, 0, width, height);

  const outputType = "image/jpeg";
  const blob = await canvasToBlob(canvas, outputType);
  if (blob.size >= file.size) {
    return file;
  }

  const filename = file.name.replace(/\.[^.]+$/, "") || "anexo";
  return new File([blob], `${filename}.jpg`, {
    type: outputType,
    lastModified: Date.now(),
  });
}

export async function uploadAnexo(respostaId: string, file: File) {
  const fileToUpload = await compressImageClientSide(file);
  const formData = new FormData();
  formData.append("file", fileToUpload);

  return apiUpload<AnexoUploadDto>(`/public/respostas/${respostaId}/anexos`, formData);
}
