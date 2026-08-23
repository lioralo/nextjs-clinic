import {
  ASSESSMENT_CATALOG,
  LIKERT_OPTIONS,
  type CatalogAssessment,
  type ScoreBand,
} from "./assessment-catalog";

export type QuestionDef = { en: string; he: string };
export type OptionDef = { value: number; en: string; he: string };

export type AssessmentDefinition = {
  questions: QuestionDef[];
  options: OptionDef[];
  bands: ScoreBand[];
};

export function definitionFromCatalog(item: CatalogAssessment): AssessmentDefinition {
  return {
    questions: item.questions,
    options: LIKERT_OPTIONS.map((option) => ({
      value: option.value,
      en: option.en,
      he: option.he,
    })),
    bands: item.bands,
  };
}

export function parseDefinitionJson(raw: string | null | undefined): AssessmentDefinition | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AssessmentDefinition;
    if (!Array.isArray(parsed.questions) || !Array.isArray(parsed.bands)) return null;
    return {
      questions: parsed.questions,
      options: Array.isArray(parsed.options) && parsed.options.length > 0
        ? parsed.options
        : LIKERT_OPTIONS.map((option) => ({
            value: option.value,
            en: option.en,
            he: option.he,
          })),
      bands: parsed.bands,
    };
  } catch {
    return null;
  }
}

export function scoreDefinition(
  definition: AssessmentDefinition,
  answers: number[]
) {
  if (answers.length !== definition.questions.length) {
    return { ok: false as const, error: "answers" };
  }
  const maxOption = Math.max(...definition.options.map((option) => option.value), 3);
  const minOption = Math.min(...definition.options.map((option) => option.value), 0);
  if (
    answers.some(
      (value) =>
        !Number.isInteger(value) || value < minOption || value > maxOption
    )
  ) {
    return { ok: false as const, error: "answers" };
  }
  const total = answers.reduce((sum, value) => sum + value, 0);
  const band =
    definition.bands.find((item) => total >= item.min && total <= item.max) ??
    definition.bands[definition.bands.length - 1];
  return {
    ok: true as const,
    totalScore: total,
    severityLevel: band.severity,
    interpretationEn: band.en,
    interpretationHe: band.he,
  };
}

export function catalogDefinitionFallback(key: string) {
  const catalog = ASSESSMENT_CATALOG.find((item) => item.key === key);
  return catalog ? definitionFromCatalog(catalog) : null;
}

/** Parse Google Sheets CSV / Docs TSV paste: order,text_en,text_he,min,max,severity,severity_en,severity_he OR question rows. */
export function parseQuestionnaireCsv(raw: string) {
  const lines = raw
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return { ok: false as const, error: "empty" };

  const rows = lines.map(splitCsvLine);
  const header = rows[0].map((cell) => cell.toLowerCase());
  const hasHeader = header.some((cell) =>
    ["text", "text_en", "question", "en", "he", "order"].includes(cell)
  );
  const data = hasHeader ? rows.slice(1) : rows;

  const questions: QuestionDef[] = [];
  for (const row of data) {
    if (row.length < 1) continue;
    // Formats:
    // text_en,text_he
    // order,text_en,text_he
    // text (single column → both locales)
    if (hasHeader) {
      const enIdx = header.findIndex((cell) =>
        ["text_en", "en", "question", "text"].includes(cell)
      );
      const heIdx = header.findIndex((cell) => ["text_he", "he"].includes(cell));
      const en = (row[enIdx >= 0 ? enIdx : 0] ?? "").trim();
      const he = (row[heIdx >= 0 ? heIdx : enIdx >= 0 ? enIdx : 0] ?? en).trim();
      if (!en && !he) continue;
      questions.push({ en: en || he, he: he || en });
    } else if (row.length >= 3 && /^\d+$/.test(row[0])) {
      questions.push({ en: row[1].trim(), he: (row[2] || row[1]).trim() });
    } else if (row.length >= 2) {
      questions.push({ en: row[0].trim(), he: row[1].trim() });
    } else {
      const text = row[0].trim();
      if (text) questions.push({ en: text, he: text });
    }
  }

  if (questions.length === 0) return { ok: false as const, error: "empty" };

  const maxScore = questions.length * 3;
  const bands: ScoreBand[] =
    maxScore <= 21
      ? [
          { min: 0, max: 4, severity: "none", en: "None–minimal", he: "ללא–מינימלי" },
          { min: 5, max: 9, severity: "mild", en: "Mild", he: "קל" },
          { min: 10, max: 14, severity: "moderate", en: "Moderate", he: "בינוני" },
          { min: 15, max: maxScore, severity: "severe", en: "Severe", he: "חמור" },
        ]
      : [
          { min: 0, max: 4, severity: "none", en: "None–minimal", he: "ללא–מינימלי" },
          { min: 5, max: 9, severity: "mild", en: "Mild", he: "קל" },
          { min: 10, max: 14, severity: "moderate", en: "Moderate", he: "בינוני" },
          { min: 15, max: 19, severity: "moderately_severe", en: "Moderately severe", he: "בינוני–חמור" },
          { min: 20, max: maxScore, severity: "severe", en: "Severe", he: "חמור" },
        ];

  return {
    ok: true as const,
    definition: {
      questions,
      options: LIKERT_OPTIONS.map((option) => ({
        value: option.value,
        en: option.en,
        he: option.he,
      })),
      bands,
    } satisfies AssessmentDefinition,
    minScore: 0,
    maxScore,
  };
}

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if ((char === "," || char === "\t") && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells;
}
