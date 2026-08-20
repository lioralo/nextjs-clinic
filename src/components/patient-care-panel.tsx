import { AssessmentForm } from "@/components/assessment-form";
import {
  createPlanAction,
  deletePlanAction,
  takeAssessmentAction,
  updateGoalAction,
} from "@/app/[locale]/(clinic)/patients/care-actions";
import { t } from "@/lib/copy";
import type { AppLocale } from "@/lib/locale";
import type { listPatientAssessments } from "@/lib/assessment-service";
import type { listPatientPlans } from "@/lib/treatment-plan-service";

type Plans = Awaited<ReturnType<typeof listPatientPlans>>;
type Assessments = Awaited<ReturnType<typeof listPatientAssessments>>;

export function PatientCarePanel({
  locale,
  patientId,
  plans,
  assessments,
}: {
  locale: AppLocale;
  patientId: string;
  plans: Plans;
  assessments: Assessments;
}) {
  const createPlan = createPlanAction.bind(null, locale, patientId);
  const take = takeAssessmentAction.bind(null, locale, patientId);

  return (
    <div className="flex flex-col gap-4">
      <section
        className="rounded-2xl border bg-[var(--color-surface)] border-[var(--color-border)] p-5"
        data-testid="treatment-plans"
      >
        <h2 className="text-lg font-semibold mb-2">
          {t(locale, "Treatment plans", "תוכניות טיפול")}
        </h2>
        <form action={createPlan} className="mb-4 flex flex-col gap-2">
          <input
            name="diagnosisDescription"
            data-testid="plan-diagnosis"
            placeholder={t(locale, "Diagnosis", "אבחנה")}
            className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
          />
          <textarea
            name="problemStatement"
            placeholder={t(locale, "Problem statement", "הגדרת הבעיה")}
            className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
          />
          <textarea
            name="strengths"
            placeholder={t(locale, "Strengths", "חוזקות")}
            className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
          />
          <input
            name="goalDescription"
            required
            data-testid="plan-goal"
            placeholder={t(locale, "Goal", "מטרה")}
            className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
          />
          <textarea
            name="goalObjectives"
            placeholder={t(locale, "Objectives", "יעדים")}
            className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="shareWithPatient" value="1" defaultChecked />
            {t(locale, "Share with patient", "שתף עם המטופל")}
          </label>
          <button
            type="submit"
            data-testid="create-plan"
            className="rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] px-4 py-2 font-semibold"
          >
            {t(locale, "Create plan", "צור תוכנית")}
          </button>
        </form>
        <ul className="flex flex-col gap-3">
          {plans.map((plan) => (
            <li
              key={plan.id}
              className="rounded-xl border border-[var(--color-border)] p-3"
            >
              <div className="font-medium">
                {plan.diagnosisDescription || t(locale, "Treatment plan", "תוכנית טיפול")}
              </div>
              <div className="text-sm text-[var(--color-foreground)]/70">
                {plan.status}
                {plan.shareWithPatient
                  ? ` · ${t(locale, "Shared", "משותף")}`
                  : ""}
              </div>
              {plan.goals.map((goal) => (
                <form
                  key={goal.id}
                  action={updateGoalAction.bind(null, locale, patientId, goal.id)}
                  className="mt-2 flex flex-wrap items-center gap-2"
                >
                  <span className="flex-1 text-sm">{goal.description}</span>
                  <input
                    type="number"
                    name="progressPercentage"
                    min={0}
                    max={100}
                    defaultValue={goal.progressPercentage}
                    className="w-20 rounded-xl border border-[var(--color-border)] bg-transparent px-2 py-1 text-sm"
                  />
                  <select
                    name="status"
                    defaultValue={goal.status}
                    className="rounded-xl border border-[var(--color-border)] bg-transparent px-2 py-1 text-sm"
                  >
                    <option value="ACTIVE">{t(locale, "Active", "פעיל")}</option>
                    <option value="IN_PROGRESS">{t(locale, "In progress", "בתהליך")}</option>
                    <option value="ACHIEVED">{t(locale, "Achieved", "הושג")}</option>
                    <option value="DISCONTINUED">{t(locale, "Discontinued", "הופסק")}</option>
                  </select>
                  <button type="submit" className="text-sm hover:underline">
                    {t(locale, "Save", "שמור")}
                  </button>
                </form>
              ))}
              <form action={deletePlanAction.bind(null, locale, patientId, plan.id)}>
                <button type="submit" className="mt-2 text-sm hover:underline">
                  {t(locale, "Delete plan", "מחק תוכנית")}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section
        className="rounded-2xl border bg-[var(--color-surface)] border-[var(--color-border)] p-5"
        data-testid="assessments"
      >
        <h2 className="text-lg font-semibold mb-2">
          {t(locale, "Assessments", "שאלונים")}
        </h2>
        <AssessmentForm locale={locale} action={take} />
        <ul className="mt-4 flex flex-col gap-2">
          {assessments.map((row) => (
            <li
              key={row.id}
              data-testid="assessment-result"
              className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
            >
              {row.type.name}: {row.totalScore} · {row.interpretation}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
