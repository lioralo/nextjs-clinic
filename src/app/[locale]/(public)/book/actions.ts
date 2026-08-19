"use server";

import { redirect } from "next/navigation";

import { bookPublicVacancy } from "@/lib/public-booking-service";
import { normalizeLocale } from "@/lib/locale";
import { revalidateClinic } from "@/lib/revalidate";

export async function bookPublicVacancyAction(
  locale: string,
  token: string,
  formData: FormData
) {
  const loc = normalizeLocale(locale) ?? "he";
  const result = await bookPublicVacancy({
    token,
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    website: String(formData.get("website") ?? ""),
    vacancyEventId: String(formData.get("vacancyEventId") ?? ""),
    birthDate: String(formData.get("birthDate") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });

  if (result.ok) {
    revalidateClinic("patientId" in result ? result.patientId : undefined);
    redirect(`/${loc}/book/${token}?booked=1`);
  }

  redirect(`/${loc}/book/${token}?error=${result.error}`);
}
