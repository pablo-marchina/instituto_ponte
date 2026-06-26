import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeftIcon, BookmarkIcon, PlusIcon, EyeIcon, EyeSlashIcon, PhotoIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { MathText } from "../../../../../src/components/math/MathText";
import type { MateriaDto } from "../../../../../src/features/materias/materias.types";
import type { CreateQuestaoPayload } from "../../../../../src/features/questoes/questoes.types";
import { createTema, listTemas } from "../../../../../src/features/temas/temas.api";
import { confirmDiscardChanges, useUnsavedChangesWarning } from "./useUnsavedChangesWarning";

interface Props {
  onBack: () => void;
  onSave?: (payload: CreateQuestaoPayload) => void | Promise<void>;
  materias?: MateriaDto[];
  defaultMateriaId?: string;
  isSaving?: boolean;
  errorMessage?: string;
}

type FormQuestionType = "Múltipla Escolha" | "Verdadeiro/Falso" | "Discursiva";

const questionTypes: FormQuestionType[] = ["Múltipla Escolha", "Verdadeiro/Falso", "Discursiva"];
const dificuldades = ["Facil", "Media", "Dificil"];

function toApiType(t: FormQuestionType): CreateQuestaoPayload["tipo"] {
  if (t === "Múltipla Escolha") return "multipla_escolha";
  if (t === "Verdadeiro/Falso") return "verdadeiro_falso";
  return "discursiva";
}

const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
const maxImageSizeBytes = 2 * 1024 * 1024;
const maxTotalImageBytes = 6 * 1024 * 1024;

interface Alternative {
  id: string;
  text: string;
  correct: boolean;
  imageUrl?: string | null;
  imageSize?: number;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 40,
  backgroundColor: "#F2F3F5",
  border: "1px solid transparent",
  borderRadius: 8,
  padding: "0 13px",
  fontFamily: "Inter, sans-serif",
  fontSize: 14,
  color: "#111",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "Inter, sans-serif",
  fontSize: 12,
  fontWeight: 600,
  color: "#6A7181",
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  display: "block",
  marginBottom: 12,
};

export function NovaQuestaoPage({ onBack, onSave, materias = [], defaultMateriaId, isSaving = false, errorMessage }: Props) {
  const queryClient = useQueryClient();
  const [showPreview, setShowPreview] = useState(true);
  const [type, setType] = useState<FormQuestionType>("Múltipla Escolha");
  const [dificuldade, setDificuldade] = useState("Media");
  const [points, setPoints] = useState("1");
  const [materiaId, setMateriaId] = useState(defaultMateriaId ?? "");
  const [theme, setTheme] = useState("");
  const [enunciado, setEnunciado] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageSizes, setImageSizes] = useState<number[]>([]);
  const [imageError, setImageError] = useState("");
  const [allowPhotos, setAllowPhotos] = useState(false);
  const [vfAnswer, setVfAnswer] = useState<"Verdadeiro" | "Falso">("Verdadeiro");
  const [alternatives, setAlternatives] = useState<Alternative[]>([
    { id: "A", text: "Alternativa A", correct: false },
    { id: "B", text: "Alternativa B", correct: false },
    { id: "C", text: "Alternativa C", correct: false },
    { id: "D", text: "Alternativa D", correct: false },
  ]);

  const temasQuery = useQuery({
    queryKey: ["temas", materiaId],
    queryFn: () => listTemas({ materiaId }),
    select: (result) => result.data,
    enabled: !!materiaId,
  });

  const createTemaMutation = useMutation({
    mutationFn: createTema,
    onSuccess: (_tema, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["temas", variables.materiaId] });
    },
  });

  function markCorrect(id: string) {
    setAlternatives((prev) =>
      prev.map((a) => ({ ...a, correct: a.id === id }))
    );
  }

  function updateAlt(id: string, text: string) {
    setAlternatives((prev) =>
      prev.map((a) => (a.id === id ? { ...a, text } : a))
    );
  }

  const hasCorrectAlternative = alternatives.some((alternative) => alternative.correct);
  const canSave = !!enunciado.trim() && !!materiaId && !isSaving && (type !== "Múltipla Escolha" || hasCorrectAlternative);
  const hasUnsavedChanges =
    !!enunciado.trim() ||
    imageUrls.length > 0 ||
    !!materiaId ||
    dificuldade !== "Media" ||
    !!theme.trim() ||
    alternatives.some((alternative) => alternative.text.trim() && !alternative.text.startsWith("Alternativa "));

  useUnsavedChangesWarning(hasUnsavedChanges && !isSaving);

  function handleBack() {
    if (confirmDiscardChanges(hasUnsavedChanges)) onBack();
  }

  function handleImageChange(file?: File) {
    setImageError("");
    if (!file) return;
    const alternativesSize = alternatives.reduce((total, alternative) => total + (alternative.imageSize ?? 0), 0);
    const currentTotal = imageSizes.reduce((total, size) => total + size, 0) + alternativesSize;
    if (currentTotal + file.size > maxTotalImageBytes) {
      setImageError("O total de imagens da questao deve ter ate 6 MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setImageError("Escolha um arquivo de imagem válido.");
      return;
    }
    if (file.size > maxImageSizeBytes) {
      setImageError("A imagem deve ter até 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageUrls((prev) => [...prev, reader.result as string]);
        setImageSizes((prev) => [...prev, file.size]);
      }
    };
    reader.onerror = () => setImageError("Não foi possível carregar a imagem escolhida.");
    reader.readAsDataURL(file);
  }

  function handleAlternativeImageChange(id: string, file?: File) {
    setImageError("");
    if (!file) return;
    const questionImagesSize = imageSizes.reduce((total, size) => total + size, 0);
    const alternativesSize = alternatives.reduce((total, alternative) => (
      total + (alternative.id === id ? 0 : alternative.imageSize ?? 0)
    ), 0);
    if (questionImagesSize + alternativesSize + file.size > maxTotalImageBytes) {
      setImageError("O total de imagens da questao deve ter ate 6 MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setImageError("Escolha um arquivo de imagem valido.");
      return;
    }
    if (file.size > maxImageSizeBytes) {
      setImageError("A imagem deve ter ate 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAlternatives((prev) => prev.map((alternative) => (
          alternative.id === id ? { ...alternative, imageUrl: reader.result as string, imageSize: file.size } : alternative
        )));
      }
    };
    reader.onerror = () => setImageError("Nao foi possivel carregar a imagem escolhida.");
    reader.readAsDataURL(file);
  }

  function removeQuestionImage(index: number) {
    setImageUrls((prev) => prev.filter((_, imageIndex) => imageIndex !== index));
    setImageSizes((prev) => prev.filter((_, imageIndex) => imageIndex !== index));
  }

  function removeAlternativeImage(id: string) {
    setAlternatives((prev) => prev.map((alternative) => (
      alternative.id === id ? { ...alternative, imageUrl: null, imageSize: undefined } : alternative
    )));
  }

  function enunciadoComImagensExtras() {
    const imagensExtras = imageUrls.slice(1);
    if (imagensExtras.length === 0) return enunciado.trim();
    return [
      enunciado.trim(),
      ...imagensExtras.map((url, index) => `![Imagem ${index + 2}](${url})`),
    ].join("\n\n");
  }

  async function handleSave() {
    if (!canSave) return;

    const tipo = toApiType(type);
    const temaNome = theme.trim();
    const existingTema = (temasQuery.data ?? []).find(
      (tema) => tema.nome.trim().toLowerCase() === temaNome.toLowerCase(),
    );
    const temaId = temaNome
      ? existingTema?.id ?? (await createTemaMutation.mutateAsync({ materiaId, nome: temaNome })).id
      : null;
    const payload: CreateQuestaoPayload = {
      materiaId,
      temaId,
      tipo,
      dificuldade,
      permiteAnexo: tipo === "discursiva" ? allowPhotos : undefined,
      pontuacaoPadrao: Number(points) > 0 ? Number(points) : 1,
      enunciado: {
        conteudoLatex: enunciadoComImagensExtras(),
        urlImagem: imageUrls[0] ?? null,
      },
      alternativas:
        tipo === "discursiva"
          ? []
          : tipo === "verdadeiro_falso"
            ? [
              { ordemOriginal: 1, conteudoLatex: "Verdadeiro", correta: vfAnswer === "Verdadeiro" },
              { ordemOriginal: 2, conteudoLatex: "Falso", correta: vfAnswer === "Falso" },
            ]
            : alternatives.map((alternative, index) => ({
              ordemOriginal: index + 1,
              conteudoLatex: alternative.text,
              urlImagem: alternative.imageUrl ?? null,
              correta: alternative.correct,
            })),
    };

    try {
      await onSave?.(payload);
      onBack();
    } catch {
      // O erro vem do estado da mutation exibido nesta tela.
    }
  }

  function addAlternative() {
    if (alternatives.length >= letters.length) return;
    const nextLetter = letters[alternatives.length];
    setAlternatives((prev) => [
      ...prev,
      { id: nextLetter, text: `Alternativa ${nextLetter}`, correct: false },
    ]);
  }

  function removeAlternative(id: string) {
    if (alternatives.length <= 2) return;
    setAlternatives((prev) => prev.filter((alternative) => alternative.id !== id).map((alternative, index) => ({
      ...alternative,
      id: letters[index],
    })));
  }

  function moveAlternative(id: string, direction: -1 | 1) {
    setAlternatives((prev) => {
      const currentIndex = prev.findIndex((alternative) => alternative.id === id);
      const nextIndex = currentIndex + direction;
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      [next[currentIndex], next[nextIndex]] = [next[nextIndex], next[currentIndex]];
      return next.map((alternative, index) => ({ ...alternative, id: letters[index] }));
    });
  }

  return (
    <div className="p-8 flex flex-col gap-5">
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 hover:opacity-70 transition-opacity self-start"
            style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 14, color: "#6B6B6B" }}
          >
            <ChevronLeftIcon className="w-4 h-4" style={{ color: "#6B6B6B" }} />
            Voltar para provas
          </button>
          <h1 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: 20, color: "#000" }}>
            Nova Questão
          </h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#6B6B6B" }}>
            Preencha os dados iniciais. A prova será salva como rascunho.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 mt-6">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-80 transition-opacity"
            style={{
              border: "1px solid #E6E6E6",
              backgroundColor: "#fff",
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              fontSize: 14,
              color: "#6A7181",
            }}
          >
            {showPreview ? <EyeSlashIcon className="w-[15px] h-[15px]" /> : <EyeIcon className="w-[15px] h-[15px]" />}
            {showPreview ? "Ocultar Preview" : "Mostrar Preview"}
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex items-center gap-2 px-5 py-2 rounded-lg transition-opacity"
            style={{
              backgroundColor: canSave ? "#6B6FA3" : "#B1B4BD",
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              fontSize: 14,
              color: "#fff",
              cursor: canSave ? "pointer" : "not-allowed",
            }}
          >
            <BookmarkIcon className="w-[15px] h-[15px]" style={{ color: "#fff" }} />
            {isSaving ? "Salvando..." : "Salvar Questão"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-5 items-start">
        {/* Left form column */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* CONFIGURAÇÃO */}
          <div
            className="bg-white rounded-2xl p-6 flex flex-col gap-4"
            style={{ border: "1px solid #E6E6E6" }}
          >
            <label style={labelStyle}>Configuração</label>

            <div className="flex gap-4">
              {/* Tipo */}
              <div className="flex flex-col gap-1.5 flex-1">
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#111" }}>Tipo</span>
                <div className="relative">
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as FormQuestionType)}
                    style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                    onFocus={(e) => { e.target.style.borderColor = "#05245F"; e.target.style.backgroundColor = "#fff"; }}
                    onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = "#F2F3F5"; }}
                  >
                    {questionTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width={16} height={16} viewBox="0 0 16 16" fill="none">
                    <path d="M4 6L8 10L12 6" stroke="#6B6B6B" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* Pontuação */}
              <div className="flex flex-col gap-1.5" style={{ width: 130 }}>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#111" }}>Pontuação</span>
                <input
                  type="number"
                  value={points}
                  min={0}
                  max={10}
                  onChange={(e) => setPoints(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = "#05245F"; e.target.style.backgroundColor = "#fff"; }}
                  onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = "#F2F3F5"; }}
                />
              </div>

              <div className="flex flex-col gap-1.5" style={{ width: 150 }}>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#111" }}>Dificuldade</span>
                <div className="relative">
                  <select
                    value={dificuldade}
                    onChange={(e) => setDificuldade(e.target.value)}
                    style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                    onFocus={(e) => { e.target.style.borderColor = "#05245F"; e.target.style.backgroundColor = "#fff"; }}
                    onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = "#F2F3F5"; }}
                  >
                    {dificuldades.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width={16} height={16} viewBox="0 0 16 16" fill="none">
                    <path d="M4 6L8 10L12 6" stroke="#6B6B6B" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              {/* Disciplina */}
              <div className="flex flex-col gap-1.5 flex-1">
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#111" }}>Disciplina</span>
                <select
                  value={materiaId}
                  onChange={(e) => setMateriaId(e.target.value)}
                  style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                  onFocus={(e) => { e.target.style.borderColor = "#05245F"; e.target.style.backgroundColor = "#fff"; }}
                  onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = "#F2F3F5"; }}
                >
                  <option value="">Selecionar matéria</option>
                  {materias.map((materia) => (
                    <option key={materia.id} value={materia.id}>{materia.nome}</option>
                  ))}
                </select>
              </div>

              {/* Tema */}
              <div className="flex flex-col gap-1.5 flex-1">
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#111" }}>Tema</span>
                <input
                  type="text"
                  placeholder="Ex: Derivadas"
                  list="temas-disponiveis"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = "#05245F"; e.target.style.backgroundColor = "#fff"; }}
                  onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = "#F2F3F5"; }}
                />
                <datalist id="temas-disponiveis">
                  {(temasQuery.data ?? []).map((tema) => (
                    <option key={tema.id} value={tema.nome} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* ENUNCIADO */}
          <div
            className="bg-white rounded-2xl p-6 flex flex-col gap-3"
            style={{ border: "1px solid #E6E6E6" }}
          >
            <label style={labelStyle}>Enunciado *</label>
            <textarea
              rows={5}
              placeholder="Digite o enunciado da questão..."
              value={enunciado}
              onChange={(e) => setEnunciado(e.target.value)}
              style={{
                width: "100%",
                backgroundColor: "#F2F3F5",
                border: "1px solid transparent",
                borderRadius: 8,
                padding: "10px 13px",
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                color: "#111",
                outline: "none",
                resize: "none",
              }}
              onFocus={(e) => { e.target.style.borderColor = "#05245F"; e.target.style.backgroundColor = "#fff"; }}
              onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = "#F2F3F5"; }}
            />
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#9FA3AC" }}>
              Suporta LaTeX entre <code>$$</code> — ex: <code>$$f'(x) = 2x$$</code>
            </p>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#6A7181" }}>
              Imagens: ate 2 MB por arquivo e 6 MB no total da questao.
            </p>
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {imageUrls.map((url, index) => (
                  <div key={`${url}-${index}`} className="rounded-xl overflow-hidden flex flex-col" style={{ border: "1px solid #E6E6E6", backgroundColor: "#F7F8FA" }}>
                    <img src={url} alt={`Imagem ${index + 1} do enunciado`} style={{ width: "100%", height: 120, objectFit: "contain" }} />
                    <button
                      type="button"
                      onClick={() => removeQuestionImage(index)}
                      className="py-2 hover:opacity-75 transition-opacity"
                      style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#9A3412", fontWeight: 600 }}
                    >
                      Remover imagem
                    </button>
                  </div>
                ))}
              </div>
            )}
            {imageError && (
              <p role="alert" style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#9A3412" }}>
                {imageError}
              </p>
            )}
          </div>

          {type === "Verdadeiro/Falso" && (
            <div className="bg-white rounded-2xl p-6 flex flex-col gap-3" style={{ border: "1px solid #E6E6E6" }}>
              <label style={labelStyle}>Resposta correta</label>
              <div className="flex gap-3">
                {(["Verdadeiro", "Falso"] as const).map((answer) => (
                  <button
                    key={answer}
                    onClick={() => setVfAnswer(answer)}
                    className="flex-1 py-3 rounded-lg transition-all"
                    style={{
                      backgroundColor: vfAnswer === answer ? "#6B6FA3" : "#F2F3F5",
                      color: vfAnswer === answer ? "#fff" : "#6A7181",
                      fontFamily: "Poppins, sans-serif",
                      fontWeight: 600,
                      fontSize: "14px",
                    }}
                  >
                    {answer}
                  </button>
                ))}
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl p-4" style={{ backgroundColor: "#FCE8E6", color: "#9A3412", fontFamily: "Inter, sans-serif", fontSize: "14px" }}>
              {errorMessage}
            </div>
          )}

          {/* ALTERNATIVAS (only for Múltipla Escolha) */}
          {type === "Múltipla Escolha" && (
            <div
              className="bg-white rounded-2xl p-6 flex flex-col gap-3"
              style={{ border: "1px solid #E6E6E6" }}
            >
              <div className="flex items-center justify-between">
                <label style={{ ...labelStyle, marginBottom: 0 }}>Alternativas *</label>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#9FA3AC" }}>
                  Digite o texto e clique no círculo para marcar a correta
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {alternatives.map((alt, index) => (
                  <div key={alt.id} className="flex items-start gap-3">
                    <button
                      onClick={() => markCorrect(alt.id)}
                      className="shrink-0 hover:opacity-70 transition-opacity"
                      title="Marcar como gabarito"
                      style={{ marginTop: 10 }}
                    >
                      {alt.correct
                        ? <CheckCircleIcon className="w-5 h-5" style={{ color: "#05245F" }} />
                        : <div className="rounded-full border-2" style={{ width: 20, height: 20, borderColor: "#D7D7D9" }} />
                      }
                    </button>
                    <div className="flex-1 flex flex-col gap-2">
                      <div
                        className="flex items-center gap-2 flex-1 px-3 rounded-xl transition-all"
                        style={{
                          minHeight: 42,
                          backgroundColor: alt.correct ? "#E6FAF8" : "#F2F3F5",
                          border: `1px solid ${alt.correct ? "#05245F" : "transparent"}`,
                        }}
                      >
                        <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13, color: "#6B6FA3", minWidth: 16 }}>
                          {alt.id})
                        </span>
                        <input
                          type="text"
                          value={alt.text}
                          onChange={(e) => updateAlt(alt.id, e.target.value)}
                          placeholder={`Digite o texto da alternativa ${alt.id}`}
                          style={{
                            flex: 1,
                            background: "transparent",
                            border: "none",
                            outline: "none",
                            fontFamily: "Inter, sans-serif",
                            fontSize: 13,
                            color: "#111",
                          }}
                        />
                      </div>
                      {alt.imageUrl && (
                        <div className="rounded-xl overflow-hidden flex flex-col" style={{ border: "1px solid #E6E6E6", backgroundColor: "#F7F8FA" }}>
                          <img src={alt.imageUrl} alt={`Imagem da alternativa ${alt.id}`} style={{ width: "100%", maxHeight: 140, objectFit: "contain" }} />
                          <button
                            type="button"
                            onClick={() => removeAlternativeImage(alt.id)}
                            className="py-2 hover:opacity-75 transition-opacity"
                            style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#9A3412", fontWeight: 600 }}
                          >
                            Remover imagem
                          </button>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <label className="px-3 py-1.5 rounded-lg cursor-pointer hover:opacity-80 transition-opacity" style={{ border: "1px solid #D7D7D9", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#05245F", fontWeight: 600 }}>
                          <input type="file" accept="image/*" className="hidden" onChange={(event) => handleAlternativeImageChange(alt.id, event.target.files?.[0])} />
                          Imagem
                        </label>
                        <button type="button" disabled={index === 0} onClick={() => moveAlternative(alt.id, -1)} className="px-3 py-1.5 rounded-lg disabled:opacity-40" style={{ border: "1px solid #D7D7D9", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#6A7181" }}>
                          Subir
                        </button>
                        <button type="button" disabled={index === alternatives.length - 1} onClick={() => moveAlternative(alt.id, 1)} className="px-3 py-1.5 rounded-lg disabled:opacity-40" style={{ border: "1px solid #D7D7D9", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#6A7181" }}>
                          Descer
                        </button>
                        <button type="button" disabled={alternatives.length <= 2} onClick={() => removeAlternative(alt.id)} className="px-3 py-1.5 rounded-lg disabled:opacity-40" style={{ border: "1px solid #F4B4A8", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#9A3412" }}>
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {alternatives.length < letters.length && (
                <button
                  onClick={addAlternative}
                  className="flex items-center gap-1.5 hover:opacity-70 transition-opacity self-start mt-1"
                  style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#05245F", fontWeight: 500 }}
                >
                  <PlusIcon className="w-[15px] h-[15px]" style={{ color: "#05245F" }} />
                  Adicionar Alternativa
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right preview column */}
        {showPreview && (
          <div className="flex flex-col gap-4 shrink-0" style={{ width: 320 }}>
            {/* Preview card */}
            <div
              className="bg-white rounded-2xl p-5 flex flex-col gap-3"
              style={{ border: "1px solid #E6E6E6" }}
            >
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: "#6A7181", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Preview — como o aluno verá
              </p>

              <div className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center rounded-full shrink-0"
                  style={{ width: 24, height: 24, backgroundColor: "#6B6FA3" }}
                >
                  <span style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: 11, color: "#fff" }}>1</span>
                </div>
                <span
                  className="px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: "#EEF1F8", color: "#6B6FA3", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600 }}
                >
                  {type}
                </span>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#6A7181" }}>
                  {points} ponto{Number(points) !== 1 ? "s" : ""}
                </span>
              </div>

              <div
                className="rounded-xl p-3 min-h-[60px]"
                style={{ backgroundColor: "#F7F8FA", border: "1px solid #E6E6E6" }}
              >
                {enunciado
                  ? <MathText style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#111" }}>{enunciado}</MathText>
                  : <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#B1B4BD", fontStyle: "italic" }}>O enunciado aparecerá aqui...</p>
                }
                {imageUrls.map((url, index) => (
                  <img key={`${url}-${index}`} src={url} alt={`Preview da imagem ${index + 1} do enunciado`} style={{ width: "100%", maxHeight: 180, objectFit: "contain", marginTop: 12, borderRadius: 8 }} />
                ))}
              </div>

              {type === "Múltipla Escolha" && alternatives.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {alternatives.map((alt) => (
                    <div key={alt.id} className="flex flex-col gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "#F2F3F5" }}>
                      <div className="flex items-center gap-2">
                        <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 11, color: "#6B6FA3" }}>{alt.id})</span>
                        <MathText style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#333" }}>{alt.text}</MathText>
                      </div>
                      {alt.imageUrl && (
                        <img src={alt.imageUrl} alt={`Preview da alternativa ${alt.id}`} style={{ width: "100%", maxHeight: 100, objectFit: "contain", borderRadius: 8 }} />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#05245F", textAlign: "center" as const }}>
                  {type === "Múltipla Escolha" ? "Adicione as alternativas ao lado." : ""}
                </p>
              )}
            </div>

            {/* Add image */}
            <div
              className="bg-white rounded-2xl p-5 flex flex-col gap-3"
              style={{ border: "1px solid #E6E6E6" }}
            >
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: "#6A7181", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Adicionar imagem à prova
              </p>
              <label
                className="flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                style={{ height: 100, backgroundColor: "#F7F8FA", border: "2px dashed #D7D7D9", cursor: "pointer" }}
              >
                <input type="file" accept="image/*" className="hidden" onChange={(event) => handleImageChange(event.target.files?.[0])} />
                <PhotoIcon className="w-6 h-6" style={{ color: "#B1B4BD" }} />
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#9FA3AC" }}>
                  Escolher arquivo do computador
                </span>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#9FA3AC" }}>
                  Max. 2 MB por imagem, 6 MB no total
                </span>
              </label>
            </div>

            {/* Allow photos */}
            <div
              className="bg-white rounded-2xl p-5"
              style={{ border: "1px solid #E6E6E6" }}
            >
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: "#6A7181", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                Permitir a inclusão de fotos nessa prova
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowPhotos}
                  onChange={(e) => setAllowPhotos(e.target.checked)}
                  style={{ accentColor: "#05245F", width: 16, height: 16 }}
                />
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#444" }}>
                  Permitir inclusão de fotos
                </span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
