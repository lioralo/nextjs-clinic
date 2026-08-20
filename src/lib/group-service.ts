import { addWeeks } from "./datetime";
import { prisma } from "./prisma";

export async function listGroups() {
  return prisma.therapyGroup.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { members: true, sessions: true } },
    },
  });
}

export async function getGroup(id: string) {
  return prisma.therapyGroup.findUnique({
    where: { id },
    include: {
      members: {
        where: { leftAt: null },
        include: { patient: true },
      },
      sessions: {
        orderBy: { startAt: "asc" },
        include: { attendance: true },
      },
    },
  });
}

export async function createGroup(input: { name: string; description?: string }) {
  const name = input.name.trim();
  if (!name) return { ok: false as const, error: "name" };
  const group = await prisma.therapyGroup.create({
    data: { name, description: input.description?.trim() || null },
  });
  return { ok: true as const, id: group.id };
}

export async function addGroupMember(groupId: string, patientId: string) {
  const existing = await prisma.groupMember.findUnique({
    where: { groupId_patientId: { groupId, patientId } },
  });
  if (existing) {
    if (existing.leftAt) {
      await prisma.groupMember.update({
        where: { id: existing.id },
        data: { leftAt: null },
      });
    }
    return { ok: true as const };
  }
  await prisma.groupMember.create({ data: { groupId, patientId } });
  return { ok: true as const };
}

export async function removeGroupMember(groupId: string, patientId: string) {
  await prisma.groupMember.updateMany({
    where: { groupId, patientId, leftAt: null },
    data: { leftAt: new Date() },
  });
  return { ok: true as const };
}

export async function createGroupSessionSeries(input: {
  groupId: string;
  startAt: Date;
  endAt: Date;
  weeks: number;
}) {
  if (!(input.endAt > input.startAt) || input.weeks < 1) {
    return { ok: false as const, error: "invalid" };
  }
  const members = await prisma.groupMember.findMany({
    where: { groupId: input.groupId, leftAt: null },
  });
  const createdIds: string[] = [];
  for (let week = 0; week < input.weeks; week += 1) {
    const startAt = addWeeks(input.startAt, week);
    const endAt = addWeeks(input.endAt, week);
    const session = await prisma.groupSession.create({
      data: {
        groupId: input.groupId,
        startAt,
        endAt,
      },
    });
    createdIds.push(session.id);
    if (members.length > 0) {
      await prisma.groupAttendance.createMany({
        data: members.map((member) => ({
          sessionId: session.id,
          patientId: member.patientId,
          status: "PENDING" as const,
        })),
      });
    }
  }
  return { ok: true as const, ids: createdIds };
}

export async function setAttendance(
  sessionId: string,
  patientId: string,
  status: "PENDING" | "PRESENT" | "MISSED"
) {
  await prisma.groupAttendance.upsert({
    where: { sessionId_patientId: { sessionId, patientId } },
    update: { status },
    create: { sessionId, patientId, status },
  });
  return { ok: true as const };
}

export async function listGroupSessionsInRange(start: Date, end: Date) {
  return prisma.groupSession.findMany({
    where: {
      status: { not: "CANCELLED" },
      startAt: { lt: end },
      endAt: { gt: start },
    },
    include: { group: true },
    orderBy: { startAt: "asc" },
  });
}

export async function listPatientGroupSessions(patientId: string, from = new Date()) {
  const memberships = await prisma.groupMember.findMany({
    where: { patientId, leftAt: null },
    select: { groupId: true },
  });
  const groupIds = memberships.map((row) => row.groupId);
  if (groupIds.length === 0) return [];
  return prisma.groupSession.findMany({
    where: {
      groupId: { in: groupIds },
      status: { not: "CANCELLED" },
      startAt: { gte: from },
    },
    include: { group: true },
    orderBy: { startAt: "asc" },
    take: 20,
  });
}

export function toGroupCalendarEvent(session: {
  id: string;
  startAt: Date;
  endAt: Date;
  group: { name: string };
}) {
  return {
    id: `group:${session.id}`,
    seriesId: session.id,
    patientId: null,
    title: session.group.name,
    start: session.startAt.toISOString(),
    end: session.endAt.toISOString(),
    kind: "GROUP" as const,
    isRecurring: false,
    meetingType: "IN_PERSON" as const,
    meetingLink: null,
  };
}
