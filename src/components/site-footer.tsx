import { t } from "@/lib/copy";
import type { AppLocale } from "@/lib/locale";

export function SiteFooter({ locale }: { locale: AppLocale }) {
  return (
    <footer
      role="contentinfo"
      className="mt-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-sm text-[var(--color-foreground)]/70"
      style={{ borderBlockStart: "1px solid var(--color-border)" }}
    >
      <a href={`/${locale}/accessibility`} className="hover:underline">
        {t(locale, "Accessibility statement", "הצהרת נגישות")}
      </a>
    </footer>
  );
}
