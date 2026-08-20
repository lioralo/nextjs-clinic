import { prisma } from "./prisma";
import { skipOccurrence } from "./appointment-service";
import { sendMail } from "./mail";
import {
  createNotification,
  getPrimaryStaffUser,
  notifyStaff,
} from "./messaging-service";
import { revalidateClinic } from "./revalidate";

export async function requestCancel(input: {
  appointmentId: string;
  patientId: string;
  reason: string;
  occurrenceStart?: Date | null;
  notifyPatientUserId?: string | null;
}) {
  const reason = input.reason.trim();
  if (!reason) return { ok: false as const, error: "reason" };

  const appointment = await prisma.appointment.findUnique({
    where: { id: input.appointmentId },
    include: { patient: true },
  });
  if (!appointment || appointment.patientId !== input.patientId) {
    return { ok: false as const, error: "invalid" };
  }

  const existing = await prisma.cancelRequest.findFirst({
    where: {
      appointmentId: appointment.id,
      status: "PENDING",
      occurrenceStart: input.occurrenceStart ?? null,
    },
  });
  if (existing) return { ok: true as const, id: existing.id, duplicate: true };

  const created = await prisma.cancelRequest.create({
    data: {
      appointmentId: appointment.id,
      patientId: input.patientId,
      reason,
      occurrenceStart: input.occurrenceStart ?? null,
    },
  });

  const patientName = appointment.patient
    ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
    : "Patient";
  await notifyStaff({
    title: "Cancel request",
    body: `${patientName}: ${reason}`,
    category: "CANCEL",
  });
  if (input.notifyPatientUserId) {
    await createNotification({
      recipientUserId: input.notifyPatientUserId,
      title: "Cancel request sent",
      body: reason,
      category: "CANCEL",
    });
  }

  const staff = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "CLINICIAN"] },
      email: { not: null },
      isActive: true,
    },
    select: { email: true },
  });
  await sendMail({
    to: staff.map((user) => user.email!).filter(Boolean),
    subject: `Cancel request: ${patientName}`,
    text: `${patientName} requested to cancel a meeting.\n\nReason: ${reason}\nWhen: ${appointment.startAt.toISOString()}`,
  });

  revalidateClinic(input.patientId);
  return { ok: true as const, id: created.id };
}

export async function listPendingCancelRequests() {
  return prisma.cancelRequest.findMany({
    where: { status: "PENDING" },
    include: {
      patient: true,
      appointment: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function approveCancelRequest(
  requestId: string,
  reviewerId: string
) {
  const request = await prisma.cancelRequest.findUnique({
    where: { id: requestId },
    include: {
      appointment: true,
      patient: { include: { portalUser: true } },
    },
  });
  if (!request || request.status !== "PENDING") {
    return { ok: false as const, error: "invalid" };
  }

  if (request.appointment.isRecurring && request.occurrenceStart) {
    await skipOccurrence(request.appointment.id, request.occurrenceStart);
  } else {
    await prisma.appointment.update({
      where: { id: request.appointmentId },
      data: { status: "CANCELLED" },
    });
  }

  await prisma.cancelRequest.update({
    where: { id: requestId },
    data: {
      status: "APPROVED",
      reviewedById: reviewerId,
      reviewedAt: new Date(),
    },
  });

  const portalUser = request.patient.portalUser;
  if (portalUser) {
    await createNotification({
      recipientUserId: portalUser.id,
      title: "Cancellation approved",
      body: request.reason,
      category: "CANCEL",
    });
  }
  const email = portalUser?.email || request.patient.email;
  if (email && request.patient.reminderEmailEnabled) {
    await sendMail({
      to: email,
      subject: "Appointment cancelled",
      text: `Your cancellation was approved for ${request.appointment.startAt.toISOString()}.`,
    });
  }

  revalidateClinic(request.patientId);
  return { ok: true as const };
}

export async function rejectCancelRequest(
  requestId: string,
  reviewerId: string
) {
  const request = await prisma.cancelRequest.findUnique({
    where: { id: requestId },
    include: {
      appointment: true,
      patient: { include: { portalUser: true } },
    },
  });
  if (!request || request.status !== "PENDING") {
    return { ok: false as const, error: "invalid" };
  }

  await prisma.cancelRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED",
      reviewedById: reviewerId,
      reviewedAt: new Date(),
    },
  });

  const portalUser = request.patient.portalUser;
  if (portalUser) {
    await createNotification({
      recipientUserId: portalUser.id,
      title: "Cancellation rejected",
      body: request.reason,
      category: "CANCEL",
    });
  }
  const email = portalUser?.email || request.patient.email;
  if (email && request.patient.reminderEmailEnabled) {
    await sendMail({
      to: email,
      subject: "Cancellation request rejected",
      text: `Your cancellation request was not approved. The meeting remains on ${request.appointment.startAt.toISOString()}.`,
    });
  }

  revalidateClinic(request.patientId);
  return { ok: true as const };
}

export async function countPendingCancelRequests() {
  return prisma.cancelRequest.count({ where: { status: "PENDING" } });
}

export async function sendDueAppointmentReminders(now = new Date()) {
  const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const due = await prisma.appointment.findMany({
    where: {
      kind: "APPOINTMENT",
      status: "SCHEDULED",
      reminderSentAt: null,
      startAt: { gte: now, lte: windowEnd },
      patient: { reminderEmailEnabled: true },
    },
    include: { patient: { include: { portalUser: true } } },
  });
  let sent = 0;
  for (const appointment of due) {
    const email =
      appointment.patient?.portalUser?.email || appointment.patient?.email;
    if (!email) continue;
    const result = await sendMail({
      to: email,
      subject: "Appointment reminder",
      text: `Reminder: you have a meeting at ${appointment.startAt.toISOString()}.`,
    });
    if (result.ok) {
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { reminderSentAt: new Date() },
      });
      sent += 1;
    }
  }
  const staff = await getPrimaryStaffUser();
  return { ok: true as const, sent, staffId: staff?.id ?? null };
}
