import Link from "next/link";

import {
  importQuestionnaireAction,
  toggleQuestionnaireAction,
} from "@/app/[locale]/(clinic)/questionnaires/actions";
import { listAssessmentTypes } from "@/lib/assessment-service";
import { t } from "@/lib/copy";
import { resolveDefinition } from "@/lib/assessment-service";

export default async function QuestionnairesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: "en" | "he" }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const types = await listAssessmentTypes(true);
  const importAction = importQuestionnaireAction.bind(null, locale);

  return (
    <div className="w-full min-w-0" data-testid="questionnaires-page">
      <h1 className="mb-1 text-2xl font-semibold">
        {t(locale, "Questionnaires", "שאלונים")}
      </h1>
      <p className="mb-4 text-[var(--color-foreground)]/70">
        {t(
          locale,
          "Edit PHQ-9/GAD-7 or import questions from a Google Sheets CSV / Docs table paste.",
          "ערכו PHQ-9/GAD-7 או ייבאו שאלות מקובץ CSV של Google Sheets / הדבקת טבלה מ-Docs."
        )}
      </p>
      {query.error ? (
        <p className="mb-3 text-sm text-[var(--color-primary-dark)]" role="alert">
          {query.error}
        </p>
      ) : null}

      <form
        action={importAction}
        className="mb-6 grid gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 lg:grid-cols-2"
      >
        <div className="flex flex-col gap-2">
          <input
            name="key"
            required
            placeholder={t(locale, "Key (e.g. CUSTOM-1)", "מפתח (למשל CUSTOM-1)")}
            className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
            data-testid="questionnaire-key"
          />
          <input
            name="name"
            required
            placeholder={t(locale, "Display name", "שם לתצוגה")}
            className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
          />
          <input
            name="description"
            placeholder={t(locale, "Description (EN)", "תיאור (EN)")}
            className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
          />
          <input
            name="descriptionHe"
            placeholder={t(locale, "Description (HE)", "תיאור (HE)")}
            className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
          />
        </div>
        <div className="flex flex-col gap-2">
          <textarea
            name="csv"
            required
            data-testid="questionnaire-csv"
            placeholder={t(
              locale,
              "Paste CSV/TSV: text_en,text_he (or one question per line)",
              "הדביקו CSV/TSV: text_en,text_he (או שאלה בכל שורה)"
            )}
            className="min-h-40 rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
          />
          <button
            type="submit"
            data-testid="import-questionnaire"
            className="min-h-11 rounded-xl bg-[var(--color-primary)] px-4 py-2 font-semibold text-[var(--color-surface)]"
          >
            {t(locale, "Import questionnaire", "ייבוא שאלון")}
          </button>
        </div>
      </form>

      <ul className="flex flex-col gap-3">
        {types.map((type) => {
          const definition = resolveDefinition(type);
          return (
            <li
              key={type.id}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">
                    {type.name}{" "}
                    <span className="text-sm font-normal text-[var(--color-foreground)]/60">
                      ({type.key})
                    </span>
                  </div>
                  <div className="text-sm text-[var(--color-foreground)]/70">
                    {locale === "he"
                      ? type.descriptionHe ?? type.description
                      : type.description}
                    {" · "}
                    {definition?.questions.length ?? 0}{" "}
                    {t(locale, "questions", "שאלות")}
                    {" · "}
                    {type.isActive
                      ? t(locale, "Active", "פעיל")
                      : t(locale, "Inactive", "לא פעיל")}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/${locale}/questionnaires/${type.key}`}
                    className="inline-flex min-h-11 items-center rounded-xl border border-[var(--color-border)] px-3 text-sm"
                  >
                    {t(locale, "Edit", "עריכה")}
                  </Link>
                  <form
                    action={toggleQuestionnaireAction.bind(null, locale, type.key)}
                  >
                    <input
                      type="hidden"
                      name="isActive"
                      value={type.isActive ? "0" : "1"}
                    />
                    <button
                      type="submit"
                      className="inline-flex min-h-11 items-center rounded-xl border border-[var(--color-border)] px-3 text-sm"
                    >
                      {type.isActive
                        ? t(locale, "Deactivate", "השבת")
                        : t(locale, "Activate", "הפעל")}
                    </button>
                  </form>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
