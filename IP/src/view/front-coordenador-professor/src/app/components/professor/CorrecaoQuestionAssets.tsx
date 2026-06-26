import { MathText } from "../../../../../src/components/math/MathText";
import type { AlternativaCorrecaoDto } from "../../../../../src/features/correcao/correcao.types";

type QuestionAssetsProps = {
  enunciado?: string | null;
  imagemUrl?: string | null;
};

type AlternativaProps = {
  title: string;
  alternativa?: AlternativaCorrecaoDto | null;
  tone?: "neutral" | "success" | "warning";
};

const toneStyle = {
  neutral: { bg: "#F7F8FA", border: "#E6E6E6", color: "#111" },
  success: { bg: "#E6FAF8", border: "#8CE0D8", color: "#05245F" },
  warning: { bg: "#FFF8E0", border: "#F9B233", color: "#8A5A00" },
};

export function CorrecaoQuestionAssets({ enunciado, imagemUrl }: QuestionAssetsProps) {
  if (!enunciado && !imagemUrl) return null;

  return (
    <div className="rounded-xl p-4 flex flex-col gap-3" style={{ backgroundColor: "#F7F8FA", border: "1px solid #E6E6E6" }}>
      <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 13, color: "#6A7181" }}>
        Questao
      </p>
      {enunciado && (
        <MathText style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#111", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
          {enunciado}
        </MathText>
      )}
      {imagemUrl && (
        <img
          src={imagemUrl}
          alt="Imagem da questao"
          className="rounded-lg object-contain"
          style={{ maxHeight: 260, maxWidth: "100%", border: "1px solid #D9D9D9", backgroundColor: "#fff" }}
        />
      )}
    </div>
  );
}

export function AlternativaCorrecaoCard({ title, alternativa, tone = "neutral" }: AlternativaProps) {
  if (!alternativa) return null;
  const style = toneStyle[tone];

  return (
    <div className="rounded-xl p-3 flex flex-col gap-2" style={{ backgroundColor: style.bg, border: `1px solid ${style.border}` }}>
      <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 12, color: style.color }}>
        {title} {alternativa.ordemOriginal ? `#${alternativa.ordemOriginal}` : ""}
      </p>
      <MathText style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#111", lineHeight: 1.5 }}>
        {alternativa.conteudoLatex}
      </MathText>
      {alternativa.urlImagem && (
        <img
          src={alternativa.urlImagem}
          alt={title}
          className="rounded-lg object-contain"
          style={{ maxHeight: 180, maxWidth: "100%", border: "1px solid #D9D9D9", backgroundColor: "#fff" }}
        />
      )}
    </div>
  );
}
