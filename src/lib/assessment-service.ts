import {
  ASSESSMENT_CATALOG,
  getCatalog,
  scoreAnswers,
} from "./assessment-catalog";
import { prisma } from "./prisma";
import { revalidateClinic } from "./revalidate";

export async function ensureAssessmentTypes() {
  for (const item of ASSESSMENT_CATALOG) {
    await prisma.assessmentType.upsert({
      where: { key: item.key },
      update: {
        name: item.name,
        description: item.descriptionEn,
        minScore: item.minScore,
        maxScore: item.maxScore,
        isActive: true,
      },
      create: {
        key: item.key,
        name: item.name,
        description: item.descriptionEn,
        minScore: item.minScore,
        maxScore: item.maxScore,
      },
    });
  }
}

export async function listAssessmentTypes() {
  await ensureAssessmentTypes();
  return prisma.assessmentType.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
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
  const catalog = getCatalog(input.typeKey);
  const scored = scoreAnswers(input.typeKey, input.answers);
  if (!catalog || !scored.ok) {
    return { ok: false as const, error: scored.ok === false ? scored.error : "type" };
  }

  await ensureAssessmentTypes();
  const type = await prisma.assessmentType.findUnique({
    where: { key: catalog.key },
  });
  if (!type) return { ok: false as const, error: "type" };

  const created = await prisma.assessment.create({
    data: {
      patientId: input.patientId,
      typeId: type.id,
      takenById: input.takenById,
      answersJson: JSON.stringify(input.answers),
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
