import Link from "next/link";
import { notFound } from "next/navigation";

import { saveQuestionnaireAction } from "@/app/[locale]/(clinic)/questionnaires/actions";
import {
  getAssessmentType,
  resolveDefinition,
} from "@/lib/assessment-service";
import { t } from "@/lib/copy";

export default async function QuestionnaireEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: "en" | "he"; key: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { locale, key } = await params;
  const query = await searchParams;
  const type = await getAssessmentType(key);
  if (!type) notFound();
  const definition = resolveDefinition(type);
  const questionsText =
    definition?.questions
      .map((question) => `${question.en} | ${question.he}`)
      .join("\n") ?? "";
  const save = saveQuestionnaireAction.bind(null, locale, type.key);

  return (
    <div className="w-full min-w-0" data-testid="questionnaire-edit">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">
          {t(locale, "Edit questionnaire", "עריכת שאלון")}: {type.name}
        </h1>
        <Link
          href={`/${locale}/questionnaires`}
          className="inline-flex min-h-11 items-center rounded-xl border border-[var(--color-border)] px-4"
        >
          {t(locale, "Back", "חזרה")}
        </Link>
      </div>
      {query.saved ? (
        <p className="mb-3 text-sm" role="status">
          {t(locale, "Saved.", "נשמר.")}
        </p>
      ) : null}
      {query.error ? (
        <p className="mb-3 text-sm text-[var(--color-primary-dark)]" role="alert">
          {query.error}
        </p>
      ) : null}
      <form action={save} className="flex max-w-3xl flex-col gap-3">
        <input
          name="name"
          defaultValue={type.name}
          required
          className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
        />
        <input
          name="description"
          defaultValue={type.description ?? ""}
          placeholder={t(locale, "Description (EN)", "תיאור (EN)")}
          className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
        />
        <input
          name="descriptionHe"
          defaultValue={type.descriptionHe ?? ""}
          placeholder={t(locale, "Description (HE)", "תיאור (HE)")}
          className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
        />
        <label className="flex flex-col gap-1 text-sm">
          {t(
            locale,
            "Questions (one per line: English | Hebrew)",
            "שאלות (שורה לכל שאלה: אנגלית | עברית)"
          )}
          <textarea
            name="questions"
            defaultValue={questionsText}
            className="min-h-56 rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 font-mono text-sm outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t(
            locale,
            "Or paste CSV/TSV to replace questions",
            "או הדביקו CSV/TSV להחלפת השאלות"
          )}
          <textarea
            name="csv"
            data-testid="questionnaire-edit-csv"
            className="min-h-28 rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isActive"
            value="1"
            defaultChecked={type.isActive}
          />
          {t(locale, "Active", "פעיל")}
        </label>
        <button
          type="submit"
          data-testid="save-questionnaire"
          className="min-h-11 w-fit rounded-xl bg-[var(--color-primary)] px-4 py-2 font-semibold text-[var(--color-surface)]"
        >
          {t(locale, "Save", "שמור")}
        </button>
      </form>
    </div>
  );
}
