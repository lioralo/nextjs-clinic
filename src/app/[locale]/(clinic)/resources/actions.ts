"use server";

import { redirect } from "next/navigation";

import { normalizeLocale } from "@/lib/locale";
import {
  createResource,
  deleteResource,
  updateResource,
} from "@/lib/resource-service";
import { revalidateClinic } from "@/lib/revalidate";
import { getSessionUser } from "@/lib/session";

async function requireStaff(locale: string) {
  const loc = normalizeLocale(locale) ?? "he";
  const user = await getSessionUser();
  if (!user || user.role === "PATIENT") redirect(`/${loc}/login`);
  return loc;
}

export async function createResourceAction(locale: string, formData: FormData) {
  const loc = await requireStaff(locale);
  await createResource({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    url: String(formData.get("url") ?? ""),
    isPublic: String(formData.get("isPublic") ?? "") === "1",
    allowPatientView: String(formData.get("allowPatientView") ?? "") === "1",
    allowPatientDownload:
      String(formData.get("allowPatientDownload") ?? "") === "1",
    notifyOnAssign: String(formData.get("notifyOnAssign") ?? "") === "1",
  });
  revalidateClinic();
  redirect(`/${loc}/resources`);
}

export async function updateResourceAction(
  locale: string,
  resourceId: string,
  formData: FormData
) {
  const loc = await requireStaff(locale);
  await updateResource(resourceId, {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    url: String(formData.get("url") ?? ""),
    isPublic: String(formData.get("isPublic") ?? "") === "1",
    allowPatientView: String(formData.get("allowPatientView") ?? "") === "1",
    allowPatientDownload:
      String(formData.get("allowPatientDownload") ?? "") === "1",
    notifyOnAssign: String(formData.get("notifyOnAssign") ?? "") === "1",
  });
  revalidateClinic();
  redirect(`/${loc}/resources`);
}

export async function deleteResourceAction(locale: string, resourceId: string) {
  const loc = await requireStaff(locale);
  await deleteResource(resourceId);
  revalidateClinic();
  redirect(`/${loc}/resources`);
}
