import { revalidatePath } from "next/cache";

import { locales } from "@/i18n/routing";

export function revalidateClinic(patientId?: string) {
  for (const locale of locales) {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/patients`);
    revalidatePath(`/${locale}/calendar`);
    if (patientId) {
      revalidatePath(`/${locale}/patients/${patientId}`);
    }
  }
}
