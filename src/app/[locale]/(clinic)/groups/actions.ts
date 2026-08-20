"use server";

import { redirect } from "next/navigation";

import { parseDateInput } from "@/lib/datetime";
import {
  addGroupMember,
  createGroup,
  createGroupSessionSeries,
  removeGroupMember,
  setAttendance,
} from "@/lib/group-service";
import { normalizeLocale } from "@/lib/locale";
import { revalidateClinic } from "@/lib/revalidate";
import { getSessionUser } from "@/lib/session";

function requireStaff(locale: string) {
  return async () => {
    const loc = normalizeLocale(locale) ?? "he";
    const user = await getSessionUser();
    if (!user || user.role === "PATIENT") redirect(`/${loc}/login`);
    return { loc, user };
  };
}

export async function createGroupAction(locale: string, formData: FormData) {
  const { loc } = await requireStaff(locale)();
  const result = await createGroup({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
  });
  if (!result.ok) redirect(`/${loc}/groups`);
  revalidateClinic();
  redirect(`/${loc}/groups/${result.id}`);
}

export async function addGroupMemberAction(
  locale: string,
  groupId: string,
  formData: FormData
) {
  const { loc } = await requireStaff(locale)();
  await addGroupMember(groupId, String(formData.get("patientId") ?? ""));
  revalidateClinic();
  redirect(`/${loc}/groups/${groupId}`);
}

export async function removeGroupMemberAction(
  locale: string,
  groupId: string,
  patientId: string
) {
  const { loc } = await requireStaff(locale)();
  await removeGroupMember(groupId, patientId);
  revalidateClinic();
  redirect(`/${loc}/groups/${groupId}`);
}

export async function createGroupSessionsAction(
  locale: string,
  groupId: string,
  formData: FormData
) {
  const { loc } = await requireStaff(locale)();
  const startAt = parseDateInput(String(formData.get("startAt") ?? ""));
  const endAt = parseDateInput(String(formData.get("endAt") ?? ""));
  const weeks = Number(formData.get("weeks") ?? 1);
  if (!startAt || !endAt) redirect(`/${loc}/groups/${groupId}`);
  await createGroupSessionSeries({
    groupId,
    startAt,
    endAt,
    weeks: Number.isFinite(weeks) ? Math.max(1, weeks) : 1,
  });
  revalidateClinic();
  redirect(`/${loc}/groups/${groupId}`);
}

export async function setAttendanceAction(
  locale: string,
  groupId: string,
  sessionId: string,
  patientId: string,
  formData: FormData
) {
  const { loc } = await requireStaff(locale)();
  const status = String(formData.get("status") ?? "PENDING");
  if (status === "PENDING" || status === "PRESENT" || status === "MISSED") {
    await setAttendance(sessionId, patientId, status);
  }
  revalidateClinic();
  redirect(`/${loc}/groups/${groupId}`);
}
