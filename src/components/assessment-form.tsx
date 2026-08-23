"use client";

import { useMemo, useState } from "react";

import { t } from "@/lib/copy";
import type { AppLocale } from "@/lib/locale";
import type { AssessmentDefinition } from "@/lib/questionnaire-definition";

type TypeOption = {
  key: string;
  name: string;
  description: string | null;
  descriptionHe: string | null;
  definition: AssessmentDefinition;
};

export function AssessmentForm({
  locale,
  action,
  types,
}: {
  locale: AppLocale;
  action: (formData: FormData) => void | Promise<void>;
  types: TypeOption[];
}) {
  const initial = types[0];
  const [typeKey, setTypeKey] = useState(initial?.key ?? "");
  const selected = useMemo(
    () => types.find((item) => item.key === typeKey) ?? initial,
    [initial, typeKey, types]
  );

  if (!selected) {
    return (
      <p className="text-sm text-[var(--color-foreground)]/70">
        {t(locale, "No active questionnaires.", "אין שאלונים פעילים.")}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3" data-testid="assessment-form">
      <select
        name="typeKey"
        value={typeKey}
        onChange={(event) => setTypeKey(event.target.value)}
        data-testid="assessment-type"
        className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
      >
        {types.map((item) => (
          <option key={item.key} value={item.key}>
            {item.name} ·{" "}
            {locale === "he"
              ? item.descriptionHe ?? item.description
              : item.description}
          </option>
        ))}
      </select>
      {selected.definition.questions.map((question, index) => (
        <fieldset
          key={`${selected.key}-${index}`}
          className="rounded-xl border border-[var(--color-border)] p-3"
        >
          <legend className="mb-2 text-sm font-medium">
            {index + 1}. {locale === "he" ? question.he : question.en}
          </legend>
          <div className="flex flex-wrap gap-2">
            {selected.definition.options.map((option) => (
              <label key={option.value} className="flex items-center gap-1 text-sm">
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
        className="rounded-xl bg-[var(--color-primary)] px-4 py-2 font-semibold text-[var(--color-surface)]"
      >
        {t(locale, "Save assessment", "שמור שאלון")}
      </button>
    </form>
  );
}
