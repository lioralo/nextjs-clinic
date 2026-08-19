import type { AppLocale } from "./locale";

export function t(locale: AppLocale, en: string, he: string) {
  return locale === "he" ? he : en;
}

export const PATIENT_STATUSES = [
  "ONGOING",
  "CANDIDATE",
  "WAITING",
  "ARCHIVED",
] as const;

export const PATIENT_TYPES = [
  "PRIVATE",
  "RESIDENCY",
  "GROUP",
  "INITIAL_INTAKE",
] as const;

export type CrmStatusFilter = "all" | "candidate" | "ongoing" | "archived";

export function statusLabel(locale: AppLocale, status: string) {
  switch (status) {
    case "ONGOING":
      return t(locale, "Ongoing", "פעיל");
    case "CANDIDATE":
      return t(locale, "Candidate", "מועמד");
    case "WAITING":
      return t(locale, "Waiting", "ממתין");
    case "ARCHIVED":
      return t(locale, "Archived", "בארכיון");
    default:
      return status;
  }
}

export function typeLabel(locale: AppLocale, type: string) {
  switch (type) {
    case "PRIVATE":
      return t(locale, "Private", "פרטי");
    case "RESIDENCY":
      return t(locale, "Residency", "התמחות");
    case "GROUP":
      return t(locale, "Group", "קבוצתי");
    case "INITIAL_INTAKE":
      return t(locale, "Initial Intake", "אינטייק ראשוני");
    default:
      return type;
  }
}

export function kindLabel(locale: AppLocale, kind: string) {
  switch (kind) {
    case "VACANCY":
      return t(locale, "Vacant Slot", "משבצת פנויה");
    case "BLOCK":
      return t(locale, "Blocked", "חסום");
    default:
      return t(locale, "Appointment", "פגישה");
  }
}
