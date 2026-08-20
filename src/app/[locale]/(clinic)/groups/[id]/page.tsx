import { notFound } from "next/navigation";

import {
  addGroupMemberAction,
  createGroupSessionsAction,
  removeGroupMemberAction,
  setAttendanceAction,
} from "@/app/[locale]/(clinic)/groups/actions";
import { t } from "@/lib/copy";
import { toDatetimeLocalValue } from "@/lib/datetime";
import { getGroup } from "@/lib/group-service";
import { listPatients } from "@/lib/patient-service";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ locale: "en" | "he"; id: string }>;
}) {
  const { locale, id } = await params;
  const group = await getGroup(id);
  if (!group) notFound();
  const patients = await listPatients();
  const addMember = addGroupMemberAction.bind(null, locale, group.id);
  const addSessions = createGroupSessionsAction.bind(null, locale, group.id);
  const now = new Date();
  const later = new Date(now.getTime() + 60 * 60 * 1000);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold mb-1">{group.name}</h1>
      {group.description ? (
        <p className="mb-4 text-[var(--color-foreground)]/70">{group.description}</p>
      ) : null}

      <section className="mb-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="font-semibold mb-2">{t(locale, "Members", "חברים")}</h2>
        <form action={addMember} className="mb-3 flex gap-2">
          <select
            name="patientId"
            data-testid="group-patient"
            className="flex-1 rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
          >
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.firstName} {patient.lastName}
              </option>
            ))}
          </select>
          <button
            type="submit"
            data-testid="add-group-member"
            className="rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] px-4 py-2 font-semibold"
          >
            {t(locale, "Add", "הוסף")}
          </button>
        </form>
        <ul className="flex flex-col gap-2">
          {group.members.map((member) => (
            <li key={member.id} className="flex items-center justify-between">
              <span>
                {member.patient.firstName} {member.patient.lastName}
              </span>
              <form
                action={removeGroupMemberAction.bind(
                  null,
                  locale,
                  group.id,
                  member.patientId
                )}
              >
                <button type="submit" className="text-sm hover:underline">
                  {t(locale, "Remove", "הסר")}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="font-semibold mb-2">{t(locale, "Sessions", "מפגשים")}</h2>
        <form action={addSessions} className="mb-4 flex flex-col gap-2">
          <input
            type="datetime-local"
            name="startAt"
            defaultValue={toDatetimeLocalValue(now)}
            className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
          />
          <input
            type="datetime-local"
            name="endAt"
            defaultValue={toDatetimeLocalValue(later)}
            className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
          />
          <input
            type="number"
            name="weeks"
            min={1}
            defaultValue={4}
            className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
          />
          <button
            type="submit"
            data-testid="create-group-sessions"
            className="rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] px-4 py-2 font-semibold"
          >
            {t(locale, "Create weekly sessions", "צור מפגשים שבועיים")}
          </button>
        </form>
        <ul className="flex flex-col gap-3">
          {group.sessions.map((session) => (
            <li
              key={session.id}
              className="rounded-xl border border-[var(--color-border)] p-3"
            >
              <div className="font-medium">
                {session.startAt.toLocaleString(locale)}
              </div>
              <ul className="mt-2 flex flex-col gap-2">
                {group.members.map((member) => {
                  const row = session.attendance.find(
                    (item) => item.patientId === member.patientId
                  );
                  return (
                    <li key={member.patientId} className="flex items-center gap-2">
                      <span className="flex-1 text-sm">
                        {member.patient.firstName} {member.patient.lastName}
                      </span>
                      <form
                        action={setAttendanceAction.bind(
                          null,
                          locale,
                          group.id,
                          session.id,
                          member.patientId
                        )}
                        className="flex items-center gap-2"
                      >
                        <select
                          name="status"
                          defaultValue={row?.status ?? "PENDING"}
                          className="rounded-xl border border-[var(--color-border)] bg-transparent px-2 py-1 text-sm"
                        >
                          <option value="PENDING">{t(locale, "Pending", "ממתין")}</option>
                          <option value="PRESENT">{t(locale, "Present", "נכח")}</option>
                          <option value="MISSED">{t(locale, "Missed", "נעדר")}</option>
                        </select>
                        <button type="submit" className="text-sm hover:underline">
                          {t(locale, "Save", "שמור")}
                        </button>
                      </form>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
