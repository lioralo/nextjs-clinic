import { describe, expect, it } from "vitest";

import { parseQuestionnaireCsv } from "./questionnaire-definition";

describe("parseQuestionnaireCsv", () => {
  it("parses headered english/hebrew columns", () => {
    const result = parseQuestionnaireCsv(
      "text_en,text_he\nFeeling down,תחושת עצבות\nTrouble sleeping,קשיי שינה"
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.definition.questions).toHaveLength(2);
    expect(result.definition.questions[0]).toEqual({
      en: "Feeling down",
      he: "תחושת עצבות",
    });
    expect(result.maxScore).toBe(6);
  });

  it("parses one question per line", () => {
    const result = parseQuestionnaireCsv("Q1\nQ2\nQ3");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.definition.questions.map((q) => q.en)).toEqual(["Q1", "Q2", "Q3"]);
  });

  it("rejects empty input", () => {
    expect(parseQuestionnaireCsv("   ")).toEqual({ ok: false, error: "empty" });
  });
});
