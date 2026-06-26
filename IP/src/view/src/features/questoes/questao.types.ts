export type QuestionType = "Alternativa" | "V/F" | "Discursiva";

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  imageUrl?: string | null;
  options?: { letter: string; text: string; correct: boolean; imageUrl?: string | null }[];
  answer?: string;
}
