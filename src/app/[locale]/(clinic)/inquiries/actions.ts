"use server";

import { redirect } from "next/navigation";

import { deleteInquiry, markInquiryRead } from "@/lib/contact-service";
import { requireStaffUser } from "@/lib/session";

export async function markInquiryReadAction(locale: string, id: string) {
  const { loc } = await requireStaffUser(locale);
  await markInquiryRead(id);
  redirect(`/${loc}/inquiries`);
}

export async function deleteInquiryAction(locale: string, id: string) {
  const { loc } = await requireStaffUser(locale);
  await deleteInquiry(id);
  redirect(`/${loc}/inquiries`);
}
