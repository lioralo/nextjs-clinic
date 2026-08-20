"use client";

import { useMemo, useState } from "react";

import {
  ASSESSMENT_CATALOG,
  LIKERT_OPTIONS,
  getCatalog,
} from "@/lib/assessment-catalog";
import { t } from "@/lib/copy";
import type { AppLocale } from "@/lib/locale";

export function AssessmentForm({
  locale,
  action,
}: {
  locale: AppLocale;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [typeKey, setTypeKey] = useState(ASSESSMENT_CATALOG[0].key);
  const catalog = useMemo(() => getCatalog(typeKey) ?? ASSESSMENT_CATALOG[0], [typeKey]);

  return (
    <form action={action} className="flex flex-col gap-3" data-testid="assessment-form">
      <select
        name="typeKey"
        value={typeKey}
        onChange={(event) => setTypeKey(event.target.value as typeof typeKey)}
        data-testid="assessment-type"
        className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
      >
        {ASSESSMENT_CATALOG.map((item) => (
          <option key={item.key} value={item.key}>
            {item.name} · {locale === "he" ? item.descriptionHe : item.descriptionEn}
          </option>
        ))}
      </select>
      {catalog.questions.map((question, index) => (
        <fieldset
          key={`${catalog.key}-${index}`}
          className="rounded-xl border border-[var(--color-border)] p-3"
        >
          <legend className="text-sm font-medium mb-2">
            {index + 1}. {locale === "he" ? question.he : question.en}
          </legend>
          <div className="flex flex-wrap gap-2">
            {LIKERT_OPTIONS.map((option) => (
              <label key={option.value} className="text-sm flex items-center gap-1">
                <input type="radio" name={`q_${index}`} value={option.value} required />
                {locale === "he" ? option.he : option.en}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <button
        type="submit"
        data-testid="submit-assessment"
        className="rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] px-4 py-2 font-semibold"
      >
        {t(locale, "Save assessment", "שמור שאלון")}
      </button>
    </form>
  );
}
