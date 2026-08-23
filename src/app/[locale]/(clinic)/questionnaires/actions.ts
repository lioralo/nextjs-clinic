import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createQuestionnaire,
  setQuestionnaireActive,
  updateQuestionnaire,
} from "@/lib/assessment-service";
import { parseQuestionnaireCsv } from "@/lib/questionnaire-definition";

function revalidate(locale: string) {
  revalidatePath(`/${locale}/questionnaires`);
  revalidatePath(`/${locale}/patients`);
}

export async function importQuestionnaireAction(
  locale: "en" | "he",
  formData: FormData
) {
  const name = String(formData.get("name") ?? "").trim();
  const key = String(formData.get("key") ?? "").trim();
  const csv = String(formData.get("csv") ?? "");
  const parsed = parseQuestionnaireCsv(csv);
  if (!parsed.ok) redirect(`/${locale}/questionnaires?error=${parsed.error}`);
  const created = await createQuestionnaire({
    key: key || name,
    name: name || key,
    description: String(formData.get("description") ?? ""),
    descriptionHe: String(formData.get("descriptionHe") ?? ""),
    definition: parsed.definition,
    minScore: parsed.minScore,
    maxScore: parsed.maxScore,
  });
  if (!created.ok) redirect(`/${locale}/questionnaires?error=${created.error}`);
  revalidate(locale);
  redirect(`/${locale}/questionnaires/${created.key}`);
}

export async function saveQuestionnaireAction(
  locale: "en" | "he",
  key: string,
  formData: FormData
) {
  const csv = String(formData.get("csv") ?? "").trim();
  if (csv) {
    const parsed = parseQuestionnaireCsv(csv);
    if (!parsed.ok) redirect(`/${locale}/questionnaires/${key}?error=${parsed.error}`);
    await updateQuestionnaire(key, {
      name: String(formData.get("name") ?? key),
      description: String(formData.get("description") ?? ""),
      descriptionHe: String(formData.get("descriptionHe") ?? ""),
      definition: parsed.definition,
      minScore: parsed.minScore,
      maxScore: parsed.maxScore,
      isActive: formData.get("isActive") === "1",
    });
  } else {
    const questionsRaw = String(formData.get("questions") ?? "");
    const lines = questionsRaw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [en, he] = line.split("|").map((part) => part.trim());
        return { en: en || he || "", he: he || en || "" };
      })
      .filter((item) => item.en || item.he);
    const parsed = parseQuestionnaireCsv(
      lines.map((item) => `${item.en},${item.he}`).join("\n")
    );
    if (!parsed.ok) redirect(`/${locale}/questionnaires/${key}?error=${parsed.error}`);
    await updateQuestionnaire(key, {
      name: String(formData.get("name") ?? key),
      description: String(formData.get("description") ?? ""),
      descriptionHe: String(formData.get("descriptionHe") ?? ""),
      definition: parsed.definition,
      minScore: parsed.minScore,
      maxScore: parsed.maxScore,
      isActive: formData.get("isActive") === "1",
    });
  }
  revalidate(locale);
  redirect(`/${locale}/questionnaires/${key}?saved=1`);
}

export async function toggleQuestionnaireAction(
  locale: "en" | "he",
  key: string,
  formData: FormData
) {
  const active = formData.get("isActive") === "1";
  await setQuestionnaireActive(key, active);
  revalidate(locale);
  redirect(`/${locale}/questionnaires`);
}
