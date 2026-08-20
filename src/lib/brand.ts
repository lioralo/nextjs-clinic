import { t } from "./copy";
import type { AppLocale } from "./locale";

export function clinicName(locale: AppLocale) {
  return t(locale, "Lior Aloni Clinic", "קליניקת ליאור אלוני");
}

export function clinicTagline(locale: AppLocale) {
  return t(
    locale,
    "Therapy, scheduling, and a private patient portal.",
    "טיפול, יומן קביעות ופורטל אישי למטופלים."
  );
}

export function clinicDescription(locale: AppLocale) {
  return t(
    locale,
    "Private clinic for scheduling, patient records, and a secure portal.",
    "קליניקה פרטית לניהול יומן, תיקי מטופלים ופורטל מאובטח."
  );
}
