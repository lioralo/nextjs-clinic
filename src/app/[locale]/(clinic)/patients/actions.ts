"use server";

import type { PatientStatus, PatientType } from "@prisma/client";
import { redirect } from "next/navigation";

import { parseDateInput } from "@/lib/datetime";
import { normalizeLocale } from "@/lib/locale";
import {
  addNote,
  createPatient,
  deleteNote,
  updateNote,
  updatePatient,
} from "@/lib/patient-service";
import { revalidateClinic } from "@/lib/revalidate";
import { getSessionUser } from "@/lib/session";

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseStatus(value: string): PatientStatus {
  if (
    value === "ONGOING" ||
    value === "CANDIDATE" ||
    value === "WAITING" ||
    value === "ARCHIVED"
  ) {
    return value;
  }
  return "CANDIDATE";
}

function parseType(value: string): PatientType {
  if (
    value === "PRIVATE" ||
    value === "RESIDENCY" ||
    value === "GROUP" ||
    value === "INITIAL_INTAKE"
  ) {
    return value;
  }
  return "PRIVATE";
}

function parseOptionalInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
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
  const idNumber = emptyToNull(String(formData.get("idNumber") ?? ""));
  const birthDate = parseDateInput(String(formData.get("birthDate") ?? ""));
  const status = parseStatus(String(formData.get("status") ?? ""));
  const patientType = parseType(String(formData.get("patientType") ?? ""));

  if (!firstName || !lastName) {
    redirect(`/${loc}/patients/new`);
  }

  await createPatient({
    firstName,
    lastName,
    phone,
    email,
    notesText,
    status,
    patientType,
    birthDate,
    idNumber,
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
  const idNumber = emptyToNull(String(formData.get("idNumber") ?? ""));
  const birthDate = parseDateInput(String(formData.get("birthDate") ?? ""));
  const status = parseStatus(String(formData.get("status") ?? ""));
  const patientType = parseType(String(formData.get("patientType") ?? ""));

  const reminderEmailEnabled =
    String(formData.get("reminderEmailEnabled") ?? "") === "1";

  if (!patientId || !firstName || !lastName) {
    redirect(`/${loc}/patients/${patientId}`);
  }

  await updatePatient(patientId, {
    firstName,
    lastName,
    phone,
    email,
    notesText,
    status,
    patientType,
    birthDate,
    idNumber,
    reminderEmailEnabled,
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
  const keyTopics = emptyToNull(String(formData.get("keyTopics") ?? ""));
  const sessionNumber = parseOptionalInt(
    String(formData.get("sessionNumber") ?? "")
  );
  const noteDate = parseDateInput(String(formData.get("noteDate") ?? ""));
  const shareWithPatient = String(formData.get("shareWithPatient") ?? "") === "1";
  const user = await getSessionUser();
  if (!user) {
    redirect(`/${loc}/login`);
  }

  if (!patientId || !content) {
    redirect(`/${loc}/patients/${patientId}`);
  }

  await addNote({
    patientId,
    authorId: user.id,
    content,
    keyTopics,
    sessionNumber,
    noteDate,
    shareWithPatient,
  });

  revalidateClinic(patientId);
}

export async function updateNoteAction(
  locale: string,
  patientId: string,
  noteId: string,
  formData: FormData
) {
  const loc = normalizeLocale(locale) ?? "he";
  const content = String(formData.get("content") ?? "").trim();
  const keyTopics = emptyToNull(String(formData.get("keyTopics") ?? ""));
  const sessionNumber = parseOptionalInt(
    String(formData.get("sessionNumber") ?? "")
  );
  const noteDate = parseDateInput(String(formData.get("noteDate") ?? ""));
  const shareWithPatient = String(formData.get("shareWithPatient") ?? "") === "1";
  const user = await getSessionUser();
  if (!user) {
    redirect(`/${loc}/login`);
  }
  if (!noteId || !content) {
    redirect(`/${loc}/patients/${patientId}`);
  }

  await updateNote(noteId, {
    content,
    keyTopics,
    sessionNumber,
    noteDate,
    shareWithPatient,
  });
  revalidateClinic(patientId);
}

export async function deleteNoteAction(
  locale: string,
  patientId: string,
  noteId: string
) {
  const loc = normalizeLocale(locale) ?? "he";
  const user = await getSessionUser();
  if (!user) {
    redirect(`/${loc}/login`);
  }
  if (!noteId) {
    redirect(`/${loc}/patients/${patientId}`);
  }
  await deleteNote(noteId);
  revalidateClinic(patientId);
}

export async function grantPortalAction(
  locale: string,
  patientId: string,
  formData: FormData
) {
  const loc = normalizeLocale(locale) ?? "he";
  const user = await getSessionUser();
  if (!user || user.role === "PATIENT") redirect(`/${loc}/login`);
  const { grantPortalAccess } = await import("@/lib/portal-service");
  const result = await grantPortalAccess({
    patientId,
    username: String(formData.get("username") ?? ""),
    email: String(formData.get("email") ?? "") || null,
  });
  const params = new URLSearchParams();
  if (result.ok) {
    params.set("portalUser", result.username);
    params.set("tempPassword", result.tempPassword);
  } else {
    params.set("portalError", result.error);
  }
  redirect(`/${loc}/patients/${patientId}?${params.toString()}`);
}

export async function assignResourceAction(
  locale: string,
  patientId: string,
  formData: FormData
) {
  const loc = normalizeLocale(locale) ?? "he";
  const user = await getSessionUser();
  if (!user || user.role === "PATIENT") redirect(`/${loc}/login`);
  const { assignResource } = await import("@/lib/resource-service");
  await assignResource(patientId, String(formData.get("resourceId") ?? ""));
  redirect(`/${loc}/patients/${patientId}`);
}

export async function unassignResourceAction(
  locale: string,
  patientId: string,
  resourceId: string
) {
  const loc = normalizeLocale(locale) ?? "he";
  const user = await getSessionUser();
  if (!user || user.role === "PATIENT") redirect(`/${loc}/login`);
  const { unassignResource } = await import("@/lib/resource-service");
  await unassignResource(patientId, resourceId);
  redirect(`/${loc}/patients/${patientId}`);
}
