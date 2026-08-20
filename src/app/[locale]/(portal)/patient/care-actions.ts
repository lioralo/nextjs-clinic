"use server";

import { redirect } from "next/navigation";

import { takeAssessment } from "@/lib/assessment-service";
import { getCatalog } from "@/lib/assessment-catalog";
import { normalizeLocale } from "@/lib/locale";
import { getPortalPatient } from "@/lib/portal-service";
import { getSessionUser } from "@/lib/session";

export async function takePortalAssessmentAction(
  locale: string,
  formData: FormData
) {
  const loc = normalizeLocale(locale) ?? "he";
  const user = await getSessionUser();
  if (!user || user.role !== "PATIENT") redirect(`/${loc}/login`);
  const portal = await getPortalPatient(user.id);
  if (!portal) redirect(`/${loc}/login`);
  const typeKey = String(formData.get("typeKey") ?? "");
  const catalog = getCatalog(typeKey);
  const answers = (catalog?.questions ?? []).map((_, index) =>
    Number(formData.get(`q_${index}`))
  );
  await takeAssessment({
    patientId: portal.patient.id,
    typeKey,
    takenById: user.id,
    answers,
    locale: loc,
  });
  redirect(`/${loc}/patient`);
}
