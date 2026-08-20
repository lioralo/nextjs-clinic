"use server";

import { redirect } from "next/navigation";

import { deleteInquiry, markInquiryRead } from "@/lib/contact-service";
import { normalizeLocale } from "@/lib/locale";
import { getSessionUser } from "@/lib/session";

async function requireStaff(locale: string) {
  const loc = normalizeLocale(locale) ?? "he";
  const user = await getSessionUser();
  if (!user || user.role === "PATIENT") redirect(`/${loc}/login`);
  return loc;
}

export async function markInquiryReadAction(locale: string, id: string) {
  const loc = await requireStaff(locale);
  await markInquiryRead(id);
  redirect(`/${loc}/inquiries`);
}

export async function deleteInquiryAction(locale: string, id: string) {
  const loc = await requireStaff(locale);
  await deleteInquiry(id);
  redirect(`/${loc}/inquiries`);
}
