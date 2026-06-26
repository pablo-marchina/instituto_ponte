import katex from "katex";
import { memo, type CSSProperties } from "react";

type MathTextProps = {
  children: string | null | undefined;
  className?: string;
  style?: CSSProperties;
  emptyText?: string;
};

type Segment =
  | { type: "text"; value: string }
  | { type: "math"; value: string; displayMode: boolean };

const delimiters = [
  { open: "$$", close: "$$", displayMode: true },
  { open: "\\[", close: "\\]", displayMode: true },
  { open: "\\(", close: "\\)", displayMode: false },
  { open: "$", close: "$", displayMode: false },
];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function findNextDelimiter(text: string, startAt: number) {
  let match: { index: number; open: string; close: string; displayMode: boolean } | null = null;

  for (const delimiter of delimiters) {
    const index = text.indexOf(delimiter.open, startAt);
    if (index === -1) continue;
    if (!match || index < match.index || (index === match.index && delimiter.open.length > match.open.length)) {
      match = { index, ...delimiter };
    }
  }

  return match;
}

function parseMathSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const next = findNextDelimiter(text, cursor);
    if (!next) {
      segments.push({ type: "text", value: text.slice(cursor) });
      break;
    }

    if (next.index > cursor) {
      segments.push({ type: "text", value: text.slice(cursor, next.index) });
    }

    const mathStart = next.index + next.open.length;
    const mathEnd = text.indexOf(next.close, mathStart);
    if (mathEnd === -1) {
      segments.push({ type: "text", value: text.slice(next.index) });
      break;
    }

    const value = text.slice(mathStart, mathEnd).trim();
    segments.push(value ? { type: "math", value, displayMode: next.displayMode } : { type: "text", value: next.open + next.close });
    cursor = mathEnd + next.close.length;
  }

  return segments;
}

function processTextLatex(text: string): string {
  const replacements: Array<{ placeholder: string; html: string }> = [];

  let result = text;

  result = result.replace(/\\textbf\{([^}]*)\}/g, (_, content) => {
    const ph = `\x00PH_${replacements.length}\x00`;
    replacements.push({ placeholder: ph, html: `<b>${escapeHtml(content)}</b>` });
    return ph;
  });

  result = result.replace(/\\textit\{([^}]*)\}/g, (_, content) => {
    const ph = `\x00PH_${replacements.length}\x00`;
    replacements.push({ placeholder: ph, html: `<i>${escapeHtml(content)}</i>` });
    return ph;
  });

  result = result.replace(/\\emph\{([^}]*)\}/g, (_, content) => {
    const ph = `\x00PH_${replacements.length}\x00`;
    replacements.push({ placeholder: ph, html: `<em>${escapeHtml(content)}</em>` });
    return ph;
  });

  result = result.replace(/\\underline\{([^}]*)\}/g, (_, content) => {
    const ph = `\x00PH_${replacements.length}\x00`;
    replacements.push({ placeholder: ph, html: `<u>${escapeHtml(content)}</u>` });
    return ph;
  });

  result = result.replace(/\\begin\{enumerate\}(\[[^\]]*\])?/g, () => {
    const ph = `\x00PH_${replacements.length}\x00`;
    replacements.push({ placeholder: ph, html: `<ol>` });
    return ph;
  });

  result = result.replace(/\\end\{enumerate\}/g, () => {
    const ph = `\x00PH_${replacements.length}\x00`;
    replacements.push({ placeholder: ph, html: `</ol>` });
    return ph;
  });

  result = result.replace(/\\begin\{itemize\}(\[[^\]]*\])?/g, () => {
    const ph = `\x00PH_${replacements.length}\x00`;
    replacements.push({ placeholder: ph, html: `<ul>` });
    return ph;
  });

  result = result.replace(/\\end\{itemize\}/g, () => {
    const ph = `\x00PH_${replacements.length}\x00`;
    replacements.push({ placeholder: ph, html: `</ul>` });
    return ph;
  });

  result = result.replace(/\\item(\[[^\]]*\])?/g, () => {
    const ph = `\x00PH_${replacements.length}\x00`;
    replacements.push({ placeholder: ph, html: `<li>` });
    return ph;
  });

  result = result.replace(/\\begin\{center\}/g, () => {
    const ph = `\x00PH_${replacements.length}\x00`;
    replacements.push({ placeholder: ph, html: `<div style="text-align:center">` });
    return ph;
  });

  result = result.replace(/\\end\{center\}/g, () => {
    const ph = `\x00PH_${replacements.length}\x00`;
    replacements.push({ placeholder: ph, html: `</div>` });
    return ph;
  });

  result = result.replace(/\\\\/g, () => {
    const ph = `\x00PH_${replacements.length}\x00`;
    replacements.push({ placeholder: ph, html: `<br />` });
    return ph;
  });

  result = result.replace(/\\newline/g, () => {
    const ph = `\x00PH_${replacements.length}\x00`;
    replacements.push({ placeholder: ph, html: `<br />` });
    return ph;
  });

  result = escapeHtml(result);

  for (const { placeholder, html } of replacements) {
    result = result.replaceAll(placeholder, html);
  }

  result = result.replace(/\n/g, "<br />");

  result = result.replace(/<br \/>\s*<ol>/g, "<ol>");
  result = result.replace(/<ol>\s*<br \/>/g, "<ol>");
  result = result.replace(/<br \/>\s*<\/ol>/g, "</ol>");
  result = result.replace(/<br \/>\s*<ul>/g, "<ul>");
  result = result.replace(/<ul>\s*<br \/>/g, "<ul>");
  result = result.replace(/<br \/>\s*<\/ul>/g, "</ul>");
  result = result.replace(/\s*<br \/>\s*<li>/g, "<li>");

  return result;
}

function renderMathText(value: string) {
  return parseMathSegments(value)
    .map((segment) => {
      if (segment.type === "text") {
        return processTextLatex(segment.value);
      }

      return katex.renderToString(segment.value, {
        displayMode: segment.displayMode,
        output: "html",
        throwOnError: false,
        strict: "warn",
        trust: false,
      });
    })
    .join("");
}

export const MathText = memo(function MathText({ children, className, style, emptyText = "" }: MathTextProps) {
  const value = children?.trim() ? children : emptyText;

  return (
    <span
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: renderMathText(value) }}
    />
  );
});
