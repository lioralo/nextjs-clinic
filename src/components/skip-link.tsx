import { t } from "@/lib/copy";
import type { AppLocale } from "@/lib/locale";

export function SkipLink({ locale }: { locale: AppLocale }) {
  return (
    <a href="#main-content" className="skip-link">
      {t(locale, "Skip to main content", "דלגו לתוכן הראשי")}
    </a>
  );
}
