import { parseDateInput } from "./datetime";
import { prisma } from "./prisma";
import { revalidateClinic } from "./revalidate";

const PLAN_STATUSES = ["ACTIVE", "COMPLETED", "REVIEW", "DISCONTINUED"] as const;
const GOAL_STATUSES = [
  "ACTIVE",
  "IN_PROGRESS",
  "ACHIEVED",
  "DISCONTINUED",
  "REVISED",
] as const;

export type PlanStatus = (typeof PLAN_STATUSES)[number];
export type GoalStatus = (typeof GOAL_STATUSES)[number];

export type GoalInput = {
  description: string;
  objectives?: string;
  interventions?: string;
  targetDate?: string;
};

function parsePlanStatus(value: string): PlanStatus {
  return PLAN_STATUSES.includes(value as PlanStatus)
    ? (value as PlanStatus)
    : "ACTIVE";
}

function parseGoalStatus(value: string): GoalStatus {
  return GOAL_STATUSES.includes(value as GoalStatus)
    ? (value as GoalStatus)
    : "ACTIVE";
}

function clampProgress(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export async function listPatientPlans(patientId: string) {
  return prisma.treatmentPlan.findMany({
    where: { patientId },
    include: { goals: { orderBy: { goalNumber: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function listSharedPatientPlans(patientId: string) {
  return prisma.treatmentPlan.findMany({
    where: { patientId, shareWithPatient: true },
    include: { goals: { orderBy: { goalNumber: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createTreatmentPlan(input: {
  patientId: string;
  diagnosisCode?: string;
  diagnosisDescription?: string;
  problemStatement?: string;
  strengths?: string;
  notes?: string;
  status?: string;
  shareWithPatient?: boolean;
  reviewDate?: string;
  nextReviewDate?: string;
  goals: GoalInput[];
}) {
  const goals = input.goals
    .map((goal) => ({
      description: goal.description.trim(),
      objectives: goal.objectives?.trim() || null,
      interventions: goal.interventions?.trim() || null,
      targetDate: parseDateInput(goal.targetDate ?? ""),
    }))
    .filter((goal) => goal.description);
  if (goals.length === 0) return { ok: false as const, error: "goals" };

  const created = await prisma.treatmentPlan.create({
    data: {
      patientId: input.patientId,
      diagnosisCode: input.diagnosisCode?.trim() || null,
      diagnosisDescription: input.diagnosisDescription?.trim() || null,
      problemStatement: input.problemStatement?.trim() || null,
      strengths: input.strengths?.trim() || null,
      notes: input.notes?.trim() || null,
      status: parsePlanStatus(input.status ?? "ACTIVE"),
      shareWithPatient: Boolean(input.shareWithPatient),
      reviewDate: parseDateInput(input.reviewDate ?? ""),
      nextReviewDate: parseDateInput(input.nextReviewDate ?? ""),
      goals: {
        create: goals.map((goal, index) => ({
          goalNumber: index + 1,
          description: goal.description,
          objectives: goal.objectives,
          interventions: goal.interventions,
          targetDate: goal.targetDate,
        })),
      },
    },
  });
  revalidateClinic(input.patientId);
  return { ok: true as const, id: created.id };
}

export async function deleteTreatmentPlan(planId: string, patientId: string) {
  await prisma.treatmentPlan.deleteMany({ where: { id: planId, patientId } });
  revalidateClinic(patientId);
  return { ok: true as const };
}

export async function updateGoalProgress(input: {
  goalId: string;
  patientId: string;
  progressPercentage: number;
  status?: string;
}) {
  const goal = await prisma.treatmentPlanGoal.findUnique({
    where: { id: input.goalId },
    include: { plan: true },
  });
  if (!goal || goal.plan.patientId !== input.patientId) {
    return { ok: false as const, error: "invalid" };
  }
  await prisma.treatmentPlanGoal.update({
    where: { id: goal.id },
    data: {
      progressPercentage: clampProgress(input.progressPercentage),
      status: parseGoalStatus(input.status ?? goal.status),
    },
  });
  revalidateClinic(input.patientId);
  return { ok: true as const };
}
