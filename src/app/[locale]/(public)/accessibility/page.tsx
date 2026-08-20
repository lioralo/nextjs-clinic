import { clinicName } from "@/lib/brand";
import { t } from "@/lib/copy";

export default async function AccessibilityPage({
  params,
}: {
  params: Promise<{ locale: "en" | "he" }>;
}) {
  const { locale } = await params;
  const name = clinicName(locale);

  return (
    <article className="mx-auto max-w-2xl" data-testid="accessibility-page">
      <h1 className="text-2xl font-semibold mb-3">
        {t(locale, "Accessibility statement", "הצהרת נגישות")}
      </h1>
      <p className="mb-4">
        {t(
          locale,
          `${name} is committed to making this site usable for people with disabilities, aligned with Israeli Standard IS 5568 (WCAG 2.0 Level AA).`,
          `${name} מחויבת להנגשת האתר לאנשים עם מוגבלויות, בהתאם לתקן הישראלי IS 5568 (WCAG 2.0 ברמה AA).`
        )}
      </p>
      <h2 className="text-lg font-semibold mb-2">
        {t(locale, "Accessibility on this site", "אמצעי נגישות באתר")}
      </h2>
      <ul className="mb-4 list-disc ps-5">
        <li>
          {t(
            locale,
            "Hebrew pages use lang=\"he\" and dir=\"rtl\". English pages use lang=\"en\" and dir=\"ltr\".",
            "עמודים בעברית מוגדרים עם lang=\"he\" ו-dir=\"rtl\". עמודים באנגלית מוגדרים עם lang=\"en\" ו-dir=\"ltr\"."
          )}
        </li>
        <li>
          {t(
            locale,
            "Skip link, keyboard focus, and labels on public forms.",
            "קישור דילוג לתוכן, מיקוד מקלדת ותוויות בטפסים הציבוריים."
          )}
        </li>
        <li>
          {t(
            locale,
            "Text alternatives for the clinic logo and a target of 4.5:1 contrast on body text.",
            "טקסט חלופי ללוגו הקליניקה ויעד ניגודיות 4.5:1 לטקסט."
          )}
        </li>
      </ul>
      <h2 className="text-lg font-semibold mb-2">
        {t(locale, "Known limitations", "מגבלות נגישות ידועות")}
      </h2>
      <ul className="mb-4 list-disc ps-5">
        <li>
          {t(
            locale,
            "The staff calendar uses a third-party week grid. Some controls may be less convenient with a screen reader.",
            "יומן הצוות משתמש ברשת שבועית של ספק חיצוני. חלק מהפקדים עלולים להיות פחות נוחים עם קורא מסך."
          )}
        </li>
      </ul>
      <h2 className="text-lg font-semibold mb-2">
        {t(locale, "Accessibility contact", "פנייה בנושא נגישות")}
      </h2>
      <p className="mb-4">
        {t(
          locale,
          "Coordinator: Lior Aloni. Use the contact form and mention accessibility in the message.",
          "רכז נגישות: ליאור אלוני. אפשר לפנות דרך טופס יצירת הקשר ולציין נגישות בהודעה."
        )}{" "}
        <a href={`/${locale}/contact`} className="underline">
          {t(locale, "Contact form", "טופס יצירת קשר")}
        </a>
      </p>
      <p className="text-sm text-[var(--color-foreground)]/70">
        {t(
          locale,
          "Statement updated: 20/08/2026. This page describes current site behavior; it is not a certified audit.",
          "תאריך עדכון ההצהרה: 20/08/2026. העמוד מתאר את מצב האתר כיום ואינו מהווה ביקורת מוסמכת."
        )}
      </p>
    </article>
  );
}
