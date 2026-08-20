import { redirect } from "next/navigation";

import { patientRequestCancelAction } from "@/app/[locale]/(clinic)/cancel-requests/actions";
import {
  markPortalNotificationsReadAction,
  sendPatientMessageAction,
} from "@/app/[locale]/(portal)/patient/actions";
import { listPatientAppointments } from "@/lib/appointment-service";
import { t } from "@/lib/copy";
import { listPatientGroupSessions } from "@/lib/group-service";
import {
  getPrimaryStaffUser,
  listNotifications,
  listThread,
} from "@/lib/messaging-service";
import { prisma } from "@/lib/prisma";
import { getPortalPatient } from "@/lib/portal-service";
import { listPatientResources } from "@/lib/resource-service";
import { takePortalAssessmentAction } from "@/app/[locale]/(portal)/patient/care-actions";
import { AssessmentForm } from "@/components/assessment-form";
import { listPatientAssessments } from "@/lib/assessment-service";
import { listSharedPatientPlans } from "@/lib/treatment-plan-service";
import { getSessionUser } from "@/lib/session";

export default async function PatientHomePage({
  params,
}: {
  params: Promise<{ locale: "en" | "he" }>;
}) {
  const { locale } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/login`);
  const portal = await getPortalPatient(user.id);
  if (!portal) redirect(`/${locale}/login`);
  if (portal.user.forcePasswordChange) {
    redirect(`/${locale}/patient/change-password`);
  }

  const staff = await getPrimaryStaffUser();
  const [meetings, groups, notes, resources, notifications, thread, plans, assessments] =
    await Promise.all([
      listPatientAppointments(portal.patient.id),
      listPatientGroupSessions(portal.patient.id),
      prisma.note.findMany({
        where: { patientId: portal.patient.id, shareWithPatient: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      listPatientResources(portal.patient.id),
      listNotifications(user.id),
      staff ? listThread(user.id, staff.id) : Promise.resolve([]),
      listSharedPatientPlans(portal.patient.id),
      listPatientAssessments(portal.patient.id),
    ]);
  const upcoming = meetings.filter((row) => row.startAt.getTime() >= Date.now());
  const send = sendPatientMessageAction.bind(null, locale);
  const markRead = markPortalNotificationsReadAction.bind(null, locale);

  return (
    <div className="mx-auto max-w-3xl flex flex-col gap-4">
      <h1 className="text-2xl font-semibold" data-testid="patient-home">
        {t(locale, "My clinic", "הקליניקה שלי")}
      </h1>
      <a href={`/${locale}/patient/security`} className="text-sm hover:underline">
        {t(locale, "Security / 2FA", "אבטחה / אימות דו-שלבי")}
      </a>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="font-semibold mb-2">
          {t(locale, "Upcoming meetings", "פגישות קרובות")}
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-[var(--color-foreground)]/70">
            {t(locale, "No upcoming meetings.", "אין פגישות קרובות.")}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {upcoming.map((meeting) => (
              <li key={meeting.id} className="rounded-xl border border-[var(--color-border)] p-3">
                <div>{meeting.startAt.toLocaleString(locale)}</div>
                <form
                  action={patientRequestCancelAction.bind(
                    null,
                    locale,
                    meeting.id
                  )}
                  className="mt-2 flex flex-col gap-2"
                >
                  <input
                    type="hidden"
                    name="occurrenceStart"
                    value={meeting.startAt.toISOString()}
                  />
                  <input
                    name="reason"
                    required
                    placeholder={t(locale, "Reason", "סיבה")}
                    className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
                  />
                  <button
                    type="submit"
                    data-testid="portal-request-cancel"
                    className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                  >
                    {t(locale, "Request cancellation", "בקש ביטול")}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="font-semibold mb-2">
          {t(locale, "Group sessions", "מפגשי קבוצה")}
        </h2>
        {groups.length === 0 ? (
          <p className="text-sm text-[var(--color-foreground)]/70">
            {t(locale, "No group sessions.", "אין מפגשי קבוצה.")}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {groups.map((session) => (
              <li key={session.id}>
                {session.group.name} · {session.startAt.toLocaleString(locale)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">
            {t(locale, "Notifications", "התראות")}
          </h2>
          <form action={markRead}>
            <button type="submit" className="text-sm hover:underline">
              {t(locale, "Mark read", "סמן כנקרא")}
            </button>
          </form>
        </div>
        <ul className="flex flex-col gap-2" data-testid="portal-notifications">
          {notifications.map((item) => (
            <li key={item.id} className="text-sm">
              <span className="font-medium">{item.title}</span> — {item.body}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="font-semibold mb-2">{t(locale, "Messages", "הודעות")}</h2>
        <div className="mb-3 flex flex-col gap-2">
          {thread.map((row) => (
            <div key={row.id} className="rounded-xl border border-[var(--color-border)] px-3 py-2">
              {row.body}
            </div>
          ))}
        </div>
        <form action={send} className="flex flex-col gap-2">
          <textarea
            name="body"
            required
            data-testid="portal-message-body"
            className="min-h-16 rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
          />
          <button
            type="submit"
            data-testid="portal-send-message"
            className="rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] px-4 py-2 font-semibold"
          >
            {t(locale, "Send", "שלח")}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="font-semibold mb-2">
          {t(locale, "Treatment plan", "תוכנית טיפול")}
        </h2>
        {plans.length === 0 ? (
          <p className="text-sm text-[var(--color-foreground)]/70">
            {t(locale, "No shared treatment plan.", "אין תוכנית טיפול משותפת.")}
          </p>
        ) : (
          <ul className="flex flex-col gap-3" data-testid="portal-plans">
            {plans.map((plan) => (
              <li key={plan.id}>
                <div className="font-medium">
                  {plan.diagnosisDescription || t(locale, "Treatment plan", "תוכנית טיפול")}
                </div>
                <ul className="mt-1 text-sm">
                  {plan.goals.map((goal) => (
                    <li key={goal.id}>
                      {goal.description} · {goal.progressPercentage}%
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="font-semibold mb-2">
          {t(locale, "Assessments", "שאלונים")}
        </h2>
        <AssessmentForm
          locale={locale}
          action={takePortalAssessmentAction.bind(null, locale)}
        />
        <ul className="mt-3 flex flex-col gap-2" data-testid="portal-assessments">
          {assessments.map((row) => (
            <li key={row.id} className="text-sm">
              {row.type.name}: {row.totalScore} · {row.interpretation}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="font-semibold mb-2">
          {t(locale, "Shared notes", "יומנים משותפים")}
        </h2>
        {notes.length === 0 ? (
          <p className="text-sm text-[var(--color-foreground)]/70">
            {t(locale, "No shared notes.", "אין יומנים משותפים.")}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {notes.map((note) => (
              <li key={note.id} className="whitespace-pre-wrap text-sm">
                {note.content}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="font-semibold mb-2">
          {t(locale, "Resources", "משאבים")}
        </h2>
        <ul className="flex flex-col gap-2" data-testid="portal-resources">
          {resources
            .filter((row) => row.resource.allowPatientView)
            .map((row) => (
              <li key={row.resourceId} className="flex items-center justify-between gap-2">
                <span>{row.resource.title}</span>
                <span className="flex gap-2 text-sm">
                  <a
                    href={`/api/resources/${row.resourceId}/open`}
                    className="hover:underline"
                  >
                    {t(locale, "Open", "פתח")}
                  </a>
                  {row.resource.allowPatientDownload ? (
                    <a
                      href={`/api/resources/${row.resourceId}/download`}
                      data-testid="resource-download"
                      className="hover:underline"
                    >
                      {t(locale, "Download", "הורד")}
                    </a>
                  ) : null}
                </span>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
