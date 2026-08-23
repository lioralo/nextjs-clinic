import {
  ASSESSMENT_CATALOG,
  getCatalog,
  scoreAnswers,
} from "./assessment-catalog";
import { prisma } from "./prisma";
import {
  catalogDefinitionFallback,
  definitionFromCatalog,
  parseDefinitionJson,
  scoreDefinition,
} from "./questionnaire-definition";
import { revalidateClinic } from "./revalidate";

export async function ensureAssessmentTypes() {
  for (const item of ASSESSMENT_CATALOG) {
    const definitionJson = JSON.stringify(definitionFromCatalog(item));
    await prisma.assessmentType.upsert({
      where: { key: item.key },
      update: {
        name: item.name,
        description: item.descriptionEn,
        descriptionHe: item.descriptionHe,
        minScore: item.minScore,
        maxScore: item.maxScore,
        isActive: true,
        definitionJson,
      },
      create: {
        key: item.key,
        name: item.name,
        description: item.descriptionEn,
        descriptionHe: item.descriptionHe,
        minScore: item.minScore,
        maxScore: item.maxScore,
        definitionJson,
      },
    });
  }
}

export async function listAssessmentTypes(includeInactive = false) {
  await ensureAssessmentTypes();
  const rows = await prisma.assessmentType.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { name: "asc" },
  });
  const catalogOrder = new Map(
    ASSESSMENT_CATALOG.map((item, index) => [item.key, index])
  );
  return rows.sort(
    (a, b) =>
      (catalogOrder.get(a.key) ?? Number.MAX_SAFE_INTEGER) -
      (catalogOrder.get(b.key) ?? Number.MAX_SAFE_INTEGER)
  );
}

export async function getAssessmentType(key: string) {
  await ensureAssessmentTypes();
  return prisma.assessmentType.findUnique({ where: { key } });
}

export function resolveDefinition(type: {
  key: string;
  definitionJson: string | null;
}) {
  return (
    parseDefinitionJson(type.definitionJson) ??
    catalogDefinitionFallback(type.key)
  );
}

export async function listPatientAssessments(patientId: string) {
  await ensureAssessmentTypes();
  return prisma.assessment.findMany({
    where: { patientId },
    include: { type: true, takenBy: { select: { username: true, role: true } } },
    orderBy: { takenAt: "desc" },
  });
}

export async function takeAssessment(input: {
  patientId: string;
  typeKey: string;
  takenById: string;
  answers: number[];
  notes?: string;
  locale?: "en" | "he";
}) {
  await ensureAssessmentTypes();
  const type = await prisma.assessmentType.findUnique({
    where: { key: input.typeKey },
  });
  if (!type || !type.isActive) return { ok: false as const, error: "type" };

  const definition = resolveDefinition(type);
  if (!definition) {
    const scored = scoreAnswers(input.typeKey, input.answers);
    const catalog = getCatalog(input.typeKey);
    if (!catalog || !scored.ok) {
      return { ok: false as const, error: scored.ok === false ? scored.error : "type" };
    }
    const created = await prisma.assessment.create({
      data: {
        patientId: input.patientId,
        typeId: type.id,
        takenById: input.takenById,
        answersJson: JSON.stringify(input.answers),
        questionsJson: JSON.stringify(catalog.questions),
        totalScore: scored.totalScore,
        severityLevel: scored.severityLevel,
        interpretation:
          input.locale === "he" ? scored.interpretationHe : scored.interpretationEn,
        notes: input.notes?.trim() || null,
      },
    });
    revalidateClinic(input.patientId);
    return { ok: true as const, id: created.id, totalScore: scored.totalScore };
  }

  const scored = scoreDefinition(definition, input.answers);
  if (!scored.ok) return { ok: false as const, error: scored.error };

  const created = await prisma.assessment.create({
    data: {
      patientId: input.patientId,
      typeId: type.id,
      takenById: input.takenById,
      answersJson: JSON.stringify(input.answers),
      questionsJson: JSON.stringify(definition.questions),
      totalScore: scored.totalScore,
      severityLevel: scored.severityLevel,
      interpretation:
        input.locale === "he" ? scored.interpretationHe : scored.interpretationEn,
      notes: input.notes?.trim() || null,
    },
  });
  revalidateClinic(input.patientId);
  return { ok: true as const, id: created.id, totalScore: scored.totalScore };
}

export async function createQuestionnaire(input: {
  key: string;
  name: string;
  description?: string;
  descriptionHe?: string;
  definition: ReturnType<typeof definitionFromCatalog>;
  minScore: number;
  maxScore: number;
}) {
  const key = input.key.trim().toUpperCase().replace(/\s+/g, "-");
  if (!key || !input.name.trim()) return { ok: false as const, error: "invalid" };
  const existing = await prisma.assessmentType.findUnique({ where: { key } });
  if (existing) return { ok: false as const, error: "exists" };
  await prisma.assessmentType.create({
    data: {
      key,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      descriptionHe: input.descriptionHe?.trim() || null,
      minScore: input.minScore,
      maxScore: input.maxScore,
      definitionJson: JSON.stringify(input.definition),
      isActive: true,
    },
  });
  revalidateClinic();
  return { ok: true as const, key };
}

export async function updateQuestionnaire(
  key: string,
  input: {
    name: string;
    description?: string;
    descriptionHe?: string;
    definition: ReturnType<typeof definitionFromCatalog>;
    minScore: number;
    maxScore: number;
    isActive?: boolean;
  }
) {
  await prisma.assessmentType.update({
    where: { key },
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      descriptionHe: input.descriptionHe?.trim() || null,
      minScore: input.minScore,
      maxScore: input.maxScore,
      definitionJson: JSON.stringify(input.definition),
      isActive: input.isActive !== false,
    },
  });
  revalidateClinic();
  return { ok: true as const };
}

export async function setQuestionnaireActive(key: string, isActive: boolean) {
  await prisma.assessmentType.update({
    where: { key },
    data: { isActive },
  });
  revalidateClinic();
  return { ok: true as const };
}
