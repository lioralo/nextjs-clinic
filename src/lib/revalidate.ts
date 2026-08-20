import { revalidatePath } from "next/cache";

import { locales } from "@/i18n/routing";

export function revalidateClinic(patientId?: string) {
  for (const locale of locales) {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/patients`);
    revalidatePath(`/${locale}/calendar`);
    revalidatePath(`/${locale}/cancel-requests`);
    revalidatePath(`/${locale}/messages`);
    revalidatePath(`/${locale}/groups`);
    revalidatePath(`/${locale}/resources`);
    revalidatePath(`/${locale}/settings`);
    revalidatePath(`/${locale}/inquiries`);
    revalidatePath(`/${locale}/patient`);
    if (patientId) {
      revalidatePath(`/${locale}/patients/${patientId}`);
    }
  }
}
