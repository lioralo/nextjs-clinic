import { t } from "./copy";
import type { AppLocale } from "./locale";

export type NavMatch = "exact" | "prefix";

export type ClinicNavItem = {
  href: string;
  label: string;
  match?: NavMatch;
};

export type ClinicNavGroup = {
  id: "clinical" | "ops";
  label: string;
  items: ClinicNavItem[];
};

export function clinicNav(locale: AppLocale): ClinicNavGroup[] {
  return [
    {
      id: "clinical",
      label: t(locale, "Care", "טיפול"),
      items: [
        {
          href: `/${locale}`,
          label: t(locale, "Dashboard", "לוח הבקרה"),
          match: "exact",
        },
        {
          href: `/${locale}/patients`,
          label: t(locale, "Patients", "מטופלים"),
        },
        {
          href: `/${locale}/calendar`,
          label: t(locale, "Calendar", "יומן"),
        },
      ],
    },
    {
      id: "ops",
      label: t(locale, "Clinic ops", "ניהול"),
      items: [
        {
          href: `/${locale}/cancel-requests`,
          label: t(locale, "Cancel requests", "בקשות ביטול"),
        },
        {
          href: `/${locale}/messages`,
          label: t(locale, "Messages", "הודעות"),
        },
        {
          href: `/${locale}/groups`,
          label: t(locale, "Groups", "קבוצות"),
        },
        {
          href: `/${locale}/resources`,
          label: t(locale, "Resources", "משאבים"),
        },
        {
          href: `/${locale}/inquiries`,
          label: t(locale, "Inquiries", "פניות"),
        },
        {
          href: `/${locale}/settings`,
          label: t(locale, "Settings", "הגדרות"),
        },
      ],
    },
  ];
}

export function normalizePath(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname || "/";
}

export function isNavActive(
  pathname: string,
  href: string,
  match: NavMatch = "prefix"
) {
  const current = normalizePath(pathname);
  const target = normalizePath(href);
  if (match === "exact") return current === target;
  return current === target || current.startsWith(`${target}/`);
}

export function pageTitleFromPath(locale: AppLocale, pathname: string) {
  const path = normalizePath(pathname).replace(/^\/(he|en)/, "") || "/";
  if (path === "/") return t(locale, "Dashboard", "לוח הבקרה");
  if (path.startsWith("/patients")) return t(locale, "Patients", "מטופלים");
  if (path.startsWith("/calendar")) return t(locale, "Calendar", "יומן");
  if (path.startsWith("/cancel-requests")) {
    return t(locale, "Cancel requests", "בקשות ביטול");
  }
  if (path.startsWith("/messages")) return t(locale, "Messages", "הודעות");
  if (path.startsWith("/groups")) return t(locale, "Groups", "קבוצות");
  if (path.startsWith("/resources")) return t(locale, "Resources", "משאבים");
  if (path.startsWith("/inquiries")) return t(locale, "Inquiries", "פניות");
  if (path.startsWith("/settings")) return t(locale, "Settings", "הגדרות");
  if (path.startsWith("/patient")) return t(locale, "Patient portal", "פורטל מטופל");
  if (path.startsWith("/contact")) return t(locale, "Contact", "צור קשר");
  if (path.startsWith("/login")) return t(locale, "Sign in", "כניסה");
  return t(locale, "Clinic", "הקליניקה");
}
