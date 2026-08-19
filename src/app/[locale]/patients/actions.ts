"use server";

import { redirect } from "next/navigation";

import { normalizeLocale } from "@/lib/locale";
import {
  addNote,
  createPatient,
  updatePatient,
} from "@/lib/patient-service";
import { revalidateClinic } from "@/lib/revalidate";
import { getSessionUser } from "@/lib/session";

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function createPatientAction(
  locale: string,
  formData: FormData
) {
  const loc = normalizeLocale(locale) ?? "he";
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const phone = emptyToNull(String(formData.get("phone") ?? ""));
  const email = emptyToNull(String(formData.get("email") ?? ""));
  const notesText = emptyToNull(String(formData.get("notesText") ?? ""));

  if (!firstName || !lastName) {
    redirect(`/${loc}/patients/new`);
  }

  await createPatient({
    firstName,
    lastName,
    phone,
    email,
    notesText,
  });

  revalidateClinic();
  redirect(`/${loc}/patients`);
}

export async function updatePatientAction(
  locale: string,
  patientId: string,
  formData: FormData
) {
  const loc = normalizeLocale(locale) ?? "he";
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const phone = emptyToNull(String(formData.get("phone") ?? ""));
  const email = emptyToNull(String(formData.get("email") ?? ""));
  const notesText = emptyToNull(String(formData.get("notesText") ?? ""));

  if (!patientId || !firstName || !lastName) {
    redirect(`/${loc}/patients/${patientId}`);
  }

  await updatePatient(patientId, {
    firstName,
    lastName,
    phone,
    email,
    notesText,
  });

  revalidateClinic(patientId);
}

export async function addNoteAction(
  locale: string,
  patientId: string,
  formData: FormData
) {
  const loc = normalizeLocale(locale) ?? "he";
  const content = String(formData.get("content") ?? "").trim();
  const user = await getSessionUser();
  if (!user) {
    redirect(`/${loc}/login`);
  }

  if (!patientId || !content) {
    redirect(`/${loc}/patients/${patientId}`);
  }

  const authorId = user.id;
  await addNote({
    patientId,
    authorId,
    content,
  });

  revalidateClinic(patientId);
}
