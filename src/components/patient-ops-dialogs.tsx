"use client";

import { useState } from "react";

import { Dialog } from "@/components/ui/dialog";
import {
  PATIENT_STATUSES,
  PATIENT_TYPES,
  statusLabel,
  t,
  typeLabel,
} from "@/lib/copy";
import { toDateInputValue } from "@/lib/datetime";
import type { AppLocale } from "@/lib/locale";

type PatientFields = {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  patientType: string;
  phone: string | null;
  email: string | null;
  birthDate: Date | string | null;
  idNumber: string | null;
  notesText: string | null;
  reminderEmailEnabled: boolean;
  portalUsername: string | null;
};

type ResourceOption = { id: string; title: string };

export function PatientOpsDialogs({
  locale,
  patient,
  resources,
  assignedResourceIds,
  portalUser,
  tempPassword,
  portalError,
  savePatient,
  grantPortal,
  assignResource,
  unassignResource,
}: {
  locale: AppLocale;
  patient: PatientFields;
  resources: ResourceOption[];
  assignedResourceIds: string[];
  portalUser?: string | null;
  tempPassword?: string | null;
  portalError?: string | null;
  savePatient: (formData: FormData) => void | Promise<void>;
  grantPortal: (formData: FormData) => void | Promise<void>;
  assignResource: (formData: FormData) => void | Promise<void>;
  unassignResource: (
    resourceId: string
  ) => (formData: FormData) => void | Promise<void>;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [portalOpen, setPortalOpen] = useState(Boolean(portalUser || portalError));
  const [resourceOpen, setResourceOpen] = useState(false);
  const birth =
    patient.birthDate instanceof Date
      ? toDateInputValue(patient.birthDate)
      : patient.birthDate
        ? toDateInputValue(new Date(patient.birthDate))
        : "";

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2" data-testid="patient-ops">
        <button
          type="button"
          data-testid="open-edit-patient"
          onClick={() => setEditOpen(true)}
          className="inline-flex min-h-11 items-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-surface)]"
        >
          {t(locale, "Edit details", "עריכת פרטים")}
        </button>
        <button
          type="button"
          data-testid="open-portal-dialog"
          onClick={() => setPortalOpen(true)}
          className="inline-flex min-h-11 items-center rounded-xl border border-[var(--color-border)] px-4 text-sm font-medium"
        >
          {t(locale, "Portal access", "גישת פורטל")}
        </button>
        <button
          type="button"
          data-testid="open-assign-resource"
          onClick={() => setResourceOpen(true)}
          className="inline-flex min-h-11 items-center rounded-xl border border-[var(--color-border)] px-4 text-sm font-medium"
        >
          {t(locale, "Resources", "משאבים")}
        </button>
      </div>

      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t(locale, "Edit patient", "עריכת מטופל")}
        testId="edit-patient-dialog"
      >
        <form action={savePatient} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              {t(locale, "First name", "שם פרטי")}
              <input
                name="firstName"
                defaultValue={patient.firstName}
                required
                className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t(locale, "Last name", "שם משפחה")}
              <input
                name="lastName"
                defaultValue={patient.lastName}
                required
                className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t(locale, "Status", "סטטוס")}
              <select
                name="status"
                defaultValue={patient.status}
                className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
              >
                {PATIENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(locale, status)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t(locale, "Patient Type", "סוג מטופל")}
              <select
                name="patientType"
                defaultValue={patient.patientType}
                className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
              >
                {PATIENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {typeLabel(locale, type)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t(locale, "Phone", "טלפון")}
              <input
                name="phone"
                defaultValue={patient.phone ?? ""}
                className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t(locale, "Email", "אימייל")}
              <input
                name="email"
                type="email"
                defaultValue={patient.email ?? ""}
                className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t(locale, "Date of Birth", "תאריך לידה")}
              <input
                name="birthDate"
                type="date"
                defaultValue={birth}
                className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t(locale, "ID Number", "מספר תעודת זהות")}
              <input
                name="idNumber"
                defaultValue={patient.idNumber ?? ""}
                className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            {t(locale, "Notes", "הערות")}
            <textarea
              name="notesText"
              defaultValue={patient.notesText ?? ""}
              className="min-h-24 rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="reminderEmailEnabled"
              value="1"
              defaultChecked={patient.reminderEmailEnabled}
            />
            {t(locale, "Email reminders", "תזכורות במייל")}
          </label>
          <button
            type="submit"
            className="min-h-11 rounded-xl bg-[var(--color-primary)] px-4 py-2 font-semibold text-[var(--color-surface)]"
          >
            {t(locale, "Save Patient Record", "שמירת תיק מטופל")}
          </button>
        </form>
      </Dialog>

      <Dialog
        open={portalOpen}
        onClose={() => setPortalOpen(false)}
        title={t(locale, "Portal access", "גישת פורטל")}
        testId="portal-dialog"
      >
        {patient.portalUsername ? (
          <p className="mb-2 text-sm">
            {t(locale, "Username", "שם משתמש")}: {patient.portalUsername}
          </p>
        ) : (
          <p className="mb-2 text-sm text-[var(--color-foreground)]/70">
            {t(locale, "No portal user yet.", "אין עדיין משתמש פורטל.")}
          </p>
        )}
        {portalUser ? (
          <p className="mb-2 text-sm" data-testid="portal-credentials">
            {portalUser}
            {tempPassword ? ` / ${tempPassword}` : ""}
          </p>
        ) : null}
        {portalError ? (
          <p className="mb-2 text-sm text-[var(--color-primary-dark)]">{portalError}</p>
        ) : null}
        <form action={grantPortal} className="flex flex-col gap-2">
          <input
            name="username"
            defaultValue={patient.portalUsername ?? ""}
            placeholder={t(locale, "Username", "שם משתמש")}
            className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
          />
          <input
            name="email"
            type="email"
            defaultValue={patient.email ?? ""}
            placeholder={t(locale, "Email", "אימייל")}
            className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
          />
          <button
            type="submit"
            data-testid="grant-portal"
            className="min-h-11 rounded-xl bg-[var(--color-primary)] px-4 py-2 font-semibold text-[var(--color-surface)]"
          >
            {t(locale, "Grant portal access", "הענק גישת פורטל")}
          </button>
        </form>
      </Dialog>

      <Dialog
        open={resourceOpen}
        onClose={() => setResourceOpen(false)}
        title={t(locale, "Assigned resources", "משאבים משויכים")}
        testId="assign-resource-dialog"
      >
        <form action={assignResource} className="mb-4 flex flex-col gap-2 sm:flex-row">
          <select
            name="resourceId"
            data-testid="assign-resource"
            className="min-h-11 flex-1 rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
          >
            {resources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.title}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="min-h-11 rounded-xl bg-[var(--color-primary)] px-4 py-2 font-semibold text-[var(--color-surface)]"
          >
            {t(locale, "Assign", "שיוך")}
          </button>
        </form>
        <ul className="flex flex-col gap-2">
          {assignedResourceIds.length === 0 ? (
            <li className="text-sm text-[var(--color-foreground)]/70">
              {t(locale, "No resources assigned.", "אין משאבים משויכים.")}
            </li>
          ) : (
            assignedResourceIds.map((resourceId) => {
              const resource = resources.find((item) => item.id === resourceId);
              if (!resource) return null;
              return (
                <li
                  key={resourceId}
                  className="flex items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                >
                  <span>{resource.title}</span>
                  <form action={unassignResource(resourceId)}>
                    <button type="submit" className="hover:underline">
                      {t(locale, "Remove", "הסר")}
                    </button>
                  </form>
                </li>
              );
            })
          )}
        </ul>
      </Dialog>
    </>
  );
}
