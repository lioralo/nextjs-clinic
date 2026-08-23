"use server";

import { redirect } from "next/navigation";

import { normalizeLocale } from "@/lib/locale";
import {
  createFolder,
  createResource,
  deleteFolder,
  deleteResource,
  renameFolder,
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

function folderQuery(folderId: string | null | undefined) {
  return folderId ? `?folder=${folderId}` : "";
}

export async function createFolderAction(locale: string, formData: FormData) {
  const loc = await requireStaff(locale);
  const parentId = String(formData.get("parentId") ?? "") || null;
  await createFolder({
    name: String(formData.get("name") ?? ""),
    parentId,
  });
  revalidateClinic();
  redirect(`/${loc}/resources${folderQuery(parentId)}`);
}

export async function renameFolderAction(
  locale: string,
  folderId: string,
  formData: FormData
) {
  const loc = await requireStaff(locale);
  await renameFolder(folderId, String(formData.get("name") ?? ""));
  revalidateClinic();
  redirect(`/${loc}/resources?folder=${folderId}`);
}

export async function deleteFolderAction(locale: string, folderId: string) {
  const loc = await requireStaff(locale);
  await deleteFolder(folderId);
  revalidateClinic();
  redirect(`/${loc}/resources`);
}

export async function createResourceAction(locale: string, formData: FormData) {
  const loc = await requireStaff(locale);
  const folderId = String(formData.get("folderId") ?? "") || null;
  await createResource({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    url: String(formData.get("url") ?? ""),
    folderId,
    isPublic: String(formData.get("isPublic") ?? "") === "1",
    allowPatientView: String(formData.get("allowPatientView") ?? "") === "1",
    allowPatientDownload:
      String(formData.get("allowPatientDownload") ?? "") === "1",
    notifyOnAssign: String(formData.get("notifyOnAssign") ?? "") === "1",
  });
  revalidateClinic();
  redirect(`/${loc}/resources${folderQuery(folderId)}`);
}

export async function updateResourceAction(
  locale: string,
  resourceId: string,
  formData: FormData
) {
  const loc = await requireStaff(locale);
  const folderId = String(formData.get("folderId") ?? "") || null;
  await updateResource(resourceId, {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    url: String(formData.get("url") ?? ""),
    folderId,
    isPublic: String(formData.get("isPublic") ?? "") === "1",
    allowPatientView: String(formData.get("allowPatientView") ?? "") === "1",
    allowPatientDownload:
      String(formData.get("allowPatientDownload") ?? "") === "1",
    notifyOnAssign: String(formData.get("notifyOnAssign") ?? "") === "1",
  });
  revalidateClinic();
  redirect(`/${loc}/resources${folderQuery(folderId)}`);
}

export async function deleteResourceAction(locale: string, resourceId: string) {
  const loc = await requireStaff(locale);
  await deleteResource(resourceId);
  revalidateClinic();
  redirect(`/${loc}/resources`);
}
