"use server";

import { redirect } from "next/navigation";

import { takeAssessment } from "@/lib/assessment-service";
import { getCatalog } from "@/lib/assessment-catalog";
import { normalizeLocale } from "@/lib/locale";
import { revalidateClinic } from "@/lib/revalidate";
import { getSessionUser } from "@/lib/session";
import {
  createTreatmentPlan,
  deleteTreatmentPlan,
  updateGoalProgress,
} from "@/lib/treatment-plan-service";

async function requireStaff(locale: string) {
  const loc = normalizeLocale(locale) ?? "he";
  const user = await getSessionUser();
  if (!user || user.role === "PATIENT") redirect(`/${loc}/login`);
  return { loc, user };
}

function carePath(loc: string, patientId: string) {
  return `/${loc}/patients/${patientId}?section=care`;
}

function readGoals(formData: FormData) {
  const descriptions = formData.getAll("goalDescription").map(String);
  const objectives = formData.getAll("goalObjectives").map(String);
  const interventions = formData.getAll("goalInterventions").map(String);
  const targets = formData.getAll("goalTargetDate").map(String);
  return descriptions.map((description, index) => ({
    description,
    objectives: objectives[index],
    interventions: interventions[index],
    targetDate: targets[index],
  }));
}

export async function createPlanAction(
  locale: string,
  patientId: string,
  formData: FormData
) {
  const { loc } = await requireStaff(locale);
  await createTreatmentPlan({
    patientId,
    diagnosisCode: String(formData.get("diagnosisCode") ?? ""),
    diagnosisDescription: String(formData.get("diagnosisDescription") ?? ""),
    problemStatement: String(formData.get("problemStatement") ?? ""),
    strengths: String(formData.get("strengths") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    status: String(formData.get("status") ?? "ACTIVE"),
    shareWithPatient: String(formData.get("shareWithPatient") ?? "") === "1",
    reviewDate: String(formData.get("reviewDate") ?? ""),
    nextReviewDate: String(formData.get("nextReviewDate") ?? ""),
    goals: readGoals(formData),
  });
  revalidateClinic(patientId);
  redirect(carePath(loc, patientId));
}

export async function deletePlanAction(
  locale: string,
  patientId: string,
  planId: string
) {
  const { loc } = await requireStaff(locale);
  await deleteTreatmentPlan(planId, patientId);
  redirect(carePath(loc, patientId));
}

export async function updateGoalAction(
  locale: string,
  patientId: string,
  goalId: string,
  formData: FormData
) {
  const { loc } = await requireStaff(locale);
  await updateGoalProgress({
    goalId,
    patientId,
    progressPercentage: Number(formData.get("progressPercentage") ?? 0),
    status: String(formData.get("status") ?? ""),
  });
  redirect(carePath(loc, patientId));
}

export async function takeAssessmentAction(
  locale: string,
  patientId: string,
  formData: FormData
) {
  const { loc, user } = await requireStaff(locale);
  const typeKey = String(formData.get("typeKey") ?? "");
  const catalog = getCatalog(typeKey);
  const answers = (catalog?.questions ?? []).map((_, index) =>
    Number(formData.get(`q_${index}`))
  );
  await takeAssessment({
    patientId,
    typeKey,
    takenById: user.id,
    answers,
    notes: String(formData.get("notes") ?? ""),
    locale: loc,
  });
  redirect(carePath(loc, patientId));
}
