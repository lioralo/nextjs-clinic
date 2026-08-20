"use server";

import { redirect } from "next/navigation";

import { submitContactInquiry } from "@/lib/contact-service";
import { normalizeLocale } from "@/lib/locale";

export async function submitContactAction(locale: string, formData: FormData) {
  const loc = normalizeLocale(locale) ?? "he";
  const result = await submitContactInquiry({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    message: String(formData.get("message") ?? ""),
  });
  if (!result.ok) {
    redirect(`/${loc}/contact?error=${result.error}`);
  }
  redirect(`/${loc}/contact?sent=1`);
}
